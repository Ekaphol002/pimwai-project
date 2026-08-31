import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { calculateTotalDays } from '@/lib/streakUtils';

// ฟังก์ชันแปลง Date ให้เป็น format 'YYYY-MM-DD' เพื่อเปรียบเทียบวัน
function toDateKey(date: Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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
            const rawResults = await prisma.speedTestResult.findMany({
                where: { duration: duration },
                orderBy: [
                    { wpm: 'desc' },
                    { accuracy: 'desc' },
                    { createdAt: 'desc' }
                ],
                distinct: ['userId'],
                take: 100,
                include: {
                    user: { select: { id: true, username: true, name: true, rank: true, currentExp: true, image: true } }
                }
            });

            // กรอง User ซ้ำ (เอาคะแนนดีสุดของแต่ละคน)
            leaderboard = rawResults.map((result: any, index: number) => {
                const displayUser = {
                    ...result.user,
                    username: result.user.username || result.user.name || "User"
                };

                return {
                    ...result,
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
                        include: { user: true }
                    });
                    if (myBest) {
                        myData = {
                            ...myBest,
                            user: {
                                ...myBest.user,
                                username: myBest.user.username || myBest.user.name || "User"
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
                orderBy: [
                    { currentExp: 'desc' }, // EXP มากสุดขึ้นก่อน
                    { rank: 'desc' }
                ],
                take: 50,
                select: {
                    id: true, username: true, name: true, rank: true, currentExp: true, image: true
                }
            });

            leaderboard = users.map((u: any, index: number) => ({
                id: u.id,
                userId: u.id,
                user: {
                    ...u,
                    username: u.username || u.name || "User"
                },
                rankOrder: index + 1,
                displayVal1: u.rank,       // Rank Level
                displayVal2: u.currentExp, // Total EXP
                isSpeedMode: false
            }));

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
            const allUsers = await prisma.user.findMany({
                select: { id: true, username: true, name: true, image: true, rank: true }
            });

            const [lessons, tests] = await Promise.all([
                prisma.lessonProgress.findMany({
                    select: { userId: true, updatedAt: true }
                }),
                prisma.speedTestResult.findMany({
                    select: { userId: true, createdAt: true }
                })
            ]);

            const userStreaks: any[] = [];
            
            allUsers.forEach((user: any) => {
                const userLessons = lessons.filter(l => l.userId === user.id).map(l => toDateKey(l.updatedAt));
                const userTests = tests.filter(t => t.userId === user.id).map(t => toDateKey(t.createdAt));
                const activityDates = [...userLessons, ...userTests];
                
                const streak = calculateTotalDays(activityDates);
                if (streak > 0) {
                    userStreaks.push({
                        user: {
                            ...user,
                            username: user.username || user.name || "User"
                        },
                        userId: user.id,
                        id: user.id,
                        streak: streak
                    });
                }
            });

            userStreaks.sort((a, b) => b.streak - a.streak);
            const topStreaks = userStreaks.slice(0, 50);
            
            leaderboard = topStreaks.map((u, index) => ({
                ...u,
                rankOrder: index + 1,
                displayVal1: u.streak,
                displayVal2: 0,
                isSpeedMode: false
            }));

            if (currentUserId) {
                myData = leaderboard.find(item => item.userId === currentUserId);
                if (!myData) {
                    const myUser = userStreaks.find(u => u.userId === currentUserId);
                    if (myUser) {
                        myData = {
                            ...myUser,
                            rankOrder: null,
                            displayVal1: myUser.streak,
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