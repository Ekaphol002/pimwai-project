// app/api/leaderboard/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const duration = parseInt(searchParams.get('duration') || '60'); // default 60 วิ
        const mode = searchParams.get('mode') || 'speed'; // 'speed' | 'rank'

        // 1. ดึงข้อมูล User ปัจจุบัน (ถ้าล็อกอิน)
        const session = await getServerSession(authOptions);
        let currentUserId: string | null = null;

        if (session?.user?.email) {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { id: true }
            });
            if (user) currentUserId = user.id;
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
                    // ✅ แก้ที่ 1: เพิ่ม name: true เข้ามาด้วย
                    user: { select: { id: true, username: true, name: true, rank: true, currentExp: true, image: true } }
                }
            });

            // กรอง User ซ้ำ (เอาคะแนนดีสุดของแต่ละคน)
            leaderboard = rawResults.map((result, index) => {

                // สร้าง user object ใหม่ (กันเหนียวเรื่องชื่อว่าง)
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
                            // ✅ แก้ที่ 3: จัดการชื่อของตัวเองด้วย (กรณีไม่ติด Top 50)
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
        else {
            const users = await prisma.user.findMany({
                orderBy: [
                    { currentExp: 'desc' }, // EXP มากสุดขึ้นก่อน
                    { rank: 'desc' }
                ],
                take: 50,
                select: {
                    // ✅ แก้ที่ 4: เพิ่ม name: true ใน select
                    id: true, username: true, name: true, rank: true, currentExp: true, image: true
                }
            });

            leaderboard = users.map((u, index) => ({
                id: u.id,
                userId: u.id,
                // ✅ แก้ที่ 5: จัดการชื่อในโหมด Rank
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
                            // ✅ แก้ที่ 6: จัดการชื่อตัวเองในโหมด Rank
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

        // กรณี User ใหม่ หรือไม่ได้ล็อกอิน
        if (!myData && currentUserId) {
            myData = {
                rankOrder: null,
                displayVal1: 0,
                displayVal2: 0,
                user: { username: "คุณ (ยังไม่มีสถิติ)" }
            };
        }

        return NextResponse.json({
            success: true,
            leaderboard,
            myRank: myData
        });

    } catch (error) {
        console.error('Leaderboard API Error:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}