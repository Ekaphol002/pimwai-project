import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateCurrentStreak, calculateTotalDays, toDateKey } from '@/lib/streakUtils';
import { calculateRankInfo } from '@/lib/rankUtils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('mode') || 'speed'; // 'speed' | 'rank' | 'streak'
        const duration = parseInt(searchParams.get('duration') || '1'); // 1, 3, 5 นาที (เฉพาะโหมด Speed)

        // ดึงข้อมูลผู้ใช้ปัจจุบัน (ถ้าล็อกอิน)
        const session = await getServerSession(authOptions);
        let currentUserId: string | null = session?.user?.id || null;

        if (!currentUserId && session?.user?.email) {
            const currentUser = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { id: true }
            });
            currentUserId = currentUser?.id || null;
        }

        let leaderboard: any[] = [];
        let myData: any = null;

        // ---------------------------------------------------------
        // CASE A: จัดอันดับตามความเร็ว (Speed) -> ดึงจาก SpeedTestResult
        // ---------------------------------------------------------
        if (mode === 'speed') {
            // ใช้ DISTINCT ON (userId) เพื่อคัดเฉพาะผลสอบที่ดีที่สุดของแต่ละ User ออกมาตั้งแต่ระดับฐานข้อมูล
            // ป้องกันปัญหา User ที่เล่นเยอะกินโควตาจนแสดงผลไม่ครบ Top 50
            interface BestSpeedRow {
                id: string;
                userId: string;
                duration: number;
                wpm: number;
                accuracy: number;
                createdAt: Date;
                username: string | null;
                name: string | null;
                rank: number;
                currentExp: number;
            }

            const top50Results = await prisma.$queryRaw<BestSpeedRow[]>`
                SELECT 
                    ub.id,
                    ub."userId",
                    ub.duration,
                    ub.wpm,
                    ub.accuracy,
                    ub."createdAt",
                    u.username,
                    u.name,
                    u.rank,
                    u."currentExp"
                FROM (
                    SELECT DISTINCT ON (s."userId")
                        s.id,
                        s."userId",
                        s.duration,
                        s.wpm,
                        s.accuracy,
                        s."createdAt"
                    FROM "SpeedTestResult" s
                    JOIN "User" u ON s."userId" = u.id
                    WHERE s.duration = ${duration}
                      AND (u."showInLeaderboard" IS NOT FALSE)
                    ORDER BY s."userId", s.wpm DESC, s.accuracy DESC, s."createdAt" DESC
                ) ub
                JOIN "User" u ON ub."userId" = u.id
                ORDER BY ub.wpm DESC, ub.accuracy DESC, ub."createdAt" DESC
                LIMIT 50;
            `;

            const userIdsToFetchImages = top50Results.map((r) => r.userId);
            if (currentUserId && !userIdsToFetchImages.includes(currentUserId)) {
                userIdsToFetchImages.push(currentUserId);
            }

            // ดึงเฉพาะรูปของ 50 คนที่ติดอันดับ ป้องกัน memory เต็มจาก base64 ขนาดใหญ่
            const userImages = await prisma.user.findMany({
                where: { id: { in: userIdsToFetchImages } },
                select: { id: true, image: true }
            });
            const imageMap = new Map(userImages.map(u => [u.id, u.image]));

            leaderboard = top50Results.map((result, index: number) => {
                const displayUser = {
                    id: result.userId,
                    username: result.username || result.name || "User",
                    name: result.name,
                    rank: result.rank,
                    currentExp: result.currentExp,
                    image: imageMap.get(result.userId) || null
                };

                return {
                    id: result.id,
                    userId: result.userId,
                    duration: result.duration,
                    wpm: result.wpm,
                    accuracy: result.accuracy,
                    createdAt: result.createdAt,
                    user: displayUser,
                    rankOrder: index + 1,        // ลำดับที่ 1, 2, 3...
                    displayVal1: result.wpm,     // ช่อง WPM
                    displayVal2: result.accuracy,// ช่อง Acc
                    isSpeedMode: true
                };
            });

            // หาอันดับของฉัน (เฉพาะถ้าล็อกอิน)
            if (currentUserId) {
                myData = leaderboard.find(item => item.userId === currentUserId);
                if (!myData) {
                    const myBest = await prisma.speedTestResult.findFirst({
                        where: { userId: currentUserId, duration: duration },
                        orderBy: [{ wpm: 'desc' }, { accuracy: 'desc' }],
                        include: {
                            user: { select: { id: true, username: true, name: true, rank: true, currentExp: true } }
                        }
                    });
                    if (myBest) {
                        myData = {
                            ...myBest,
                            user: {
                                ...myBest.user,
                                username: myBest.user.username || myBest.user.name || "User",
                                image: imageMap.get(myBest.userId) || null
                            },
                            rankOrder: null, // ไม่ติด Top 50
                            displayVal1: myBest.wpm,
                            displayVal2: myBest.accuracy,
                            isSpeedMode: true
                        };
                    }
                }
            }
        }
        // ---------------------------------------------------------
        // CASE B: จัดอันดับตามยศ (Rank/EXP) -> ดึงจาก User โดยตรง
        // ---------------------------------------------------------
        else if (mode === 'rank') {
            const users = await prisma.user.findMany({
                where: {
                    showInLeaderboard: { not: false }
                },
                orderBy: [
                    { currentExp: 'desc' }, // EXP มากสุดขึ้นก่อน
                    { rank: 'desc' }
                ],
                take: 50,
                select: {
                    id: true, username: true, name: true, rank: true, currentExp: true, image: true
                }
            });

            leaderboard = users.map((u: any, index: number) => {
                const isTop10 = index < 10;
                const dynamicRank = calculateRankInfo(u.currentExp || 0, isTop10).rank;
                return {
                    id: u.id,
                    userId: u.id,
                    user: {
                        ...u,
                        username: u.username || u.name || "User",
                        rank: dynamicRank
                    },
                    rankOrder: index + 1,
                    displayVal1: dynamicRank,       // Rank Level (1-7)
                    displayVal2: u.currentExp,     // Total EXP
                    isSpeedMode: false
                };
            });

            // หาอันดับของฉัน (เฉพาะถ้าล็อกอิน)
            if (currentUserId) {
                myData = leaderboard.find(item => item.userId === currentUserId);
                if (!myData) {
                    const myUser = await prisma.user.findUnique({ where: { id: currentUserId } });
                    if (myUser) {
                        myData = {
                            id: myUser.id,
                            userId: myUser.id,
                            user: {
                                ...myUser,
                                username: myUser.username || myUser.name || "User"
                            },
                            rankOrder: null,
                            displayVal1: myUser.rank,
                            displayVal2: myUser.currentExp,
                            isSpeedMode: false
                        };
                    }
                }
            }
        }
        else if (mode === 'streak') {
            // คำนวณจำนวนวันที่เล่นทั้งหมด (Total Days) ในระดับ Database (PostgreSQL) โดยตรง
            // เพื่อไม่ต้องดึงข้อมูล 85,000+ แถวมาประมวลผลใน Node.js ซึ่งทำให้โหลดช้าหรือค้าง
            const streakRows = await prisma.$queryRaw<{ userId: string; total_days: number }[]>`
                SELECT "userId", COUNT(DISTINCT d)::int AS total_days
                FROM (
                    SELECT "userId", (("updatedAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok')::date AS d FROM "LessonProgress"
                    UNION ALL
                    SELECT "userId", (("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok')::date AS d FROM "SpeedTestResult"
                    UNION ALL
                    SELECT "userId", (("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok')::date AS d FROM "FarmSession"
                    UNION ALL
                    SELECT "id" AS "userId", (("lastPlayedAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok')::date AS d FROM "User" WHERE "lastPlayedAt" IS NOT NULL
                ) t
                WHERE "userId" IS NOT NULL AND d IS NOT NULL
                GROUP BY "userId"
                HAVING COUNT(DISTINCT d) > 0
                ORDER BY total_days DESC
            `;

            const topCandidateIds = streakRows.slice(0, 70).map(r => r.userId);
            if (currentUserId && !topCandidateIds.includes(currentUserId)) {
                topCandidateIds.push(currentUserId);
            }

            const users = await prisma.user.findMany({
                where: { id: { in: topCandidateIds } },
                select: { id: true, username: true, name: true, image: true, rank: true, currentExp: true, showInLeaderboard: true }
            });
            const userMap = new Map(users.map(u => [u.id, u]));

            const validList: any[] = [];
            for (const row of streakRows) {
                const u = userMap.get(row.userId);
                if (!u || u.showInLeaderboard === false) continue;
                validList.push({
                    user: {
                        ...u,
                        username: u.username || u.name || "User"
                    },
                    userId: u.id,
                    id: u.id,
                    streak: row.total_days
                });
            }

            // เรียงลำดับตามจำนวนวันที่เล่นทั้งหมด และถ้าวันเท่ากันให้เรียงตาม EXP
            validList.sort((a, b) => {
                if (b.streak !== a.streak) return b.streak - a.streak;
                return (b.user.currentExp || 0) - (a.user.currentExp || 0);
            });

            leaderboard = validList.slice(0, 50).map((u, index) => ({
                ...u,
                rankOrder: index + 1,
                displayVal1: u.streak,
                displayVal2: 0,
                isSpeedMode: false
            }));

            if (currentUserId) {
                myData = leaderboard.find(item => item.userId === currentUserId);
                if (!myData) {
                    const myRow = streakRows.find(r => r.userId === currentUserId);
                    const meObj = userMap.get(currentUserId);
                    if (meObj) {
                        myData = {
                            user: {
                                ...meObj,
                                username: meObj.username || meObj.name || "User"
                            },
                            userId: currentUserId,
                            id: currentUserId,
                            rankOrder: null,
                            displayVal1: myRow?.total_days || 0,
                            displayVal2: 0,
                            isSpeedMode: false
                        };
                    }
                }
            }
        }

        // กรณี User ใหม่ หรือไม่ได้ล็อกอิน
        if (!myData && currentUserId) {
            const currentUser = await prisma.user.findUnique({
                where: { id: currentUserId },
                select: { id: true, username: true, name: true, rank: true, currentExp: true, image: true }
            });
            if (currentUser) {
                myData = {
                    user: {
                        ...currentUser,
                        username: currentUser.username || currentUser.name || "User"
                    },
                    userId: currentUserId,
                    rankOrder: null,
                    displayVal1: mode === 'speed' ? 0 : mode === 'rank' ? currentUser.rank : 0,
                    displayVal2: mode === 'speed' ? 0 : mode === 'rank' ? currentUser.currentExp : 0,
                    isSpeedMode: mode === 'speed'
                };
            }
        }

        return NextResponse.json({
            success: true,
            leaderboard: leaderboard.slice(0, 50),
            myData: myData,
            myRank: myData
        });

    } catch (error) {
        console.error("Leaderboard API Error:", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}