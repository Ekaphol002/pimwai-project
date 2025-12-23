// app/api/leaderboard/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth"; // ✅ เพิ่ม
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // ✅ ต้อง Import path ให้ถูก

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
        select: { id: true } // ดึงแค่ id ก็พอ
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
            take: 100,
            include: {
                user: { select: { id: true, username: true, rank: true, currentExp: true, image: true } } // ดึงรูปด้วยถ้ามี
            }
        });

        // กรอง User ซ้ำ (เอาคะแนนดีสุดของแต่ละคน)
        const uniqueMap = new Map();
        for (const result of rawResults) {
            if (!uniqueMap.has(result.userId)) {
                uniqueMap.set(result.userId, true);
                leaderboard.push({
                    ...result,
                    rankOrder: leaderboard.length + 1,
                    displayVal1: result.wpm,           // WPM
                    displayVal2: result.accuracy,      // Acc
                    isSpeedMode: true
                });
            }
            if (leaderboard.length >= 50) break;
        }

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
                id: true, username: true, rank: true, currentExp: true, image: true // เลือก field ที่จำเป็น
            }
        });

        leaderboard = users.map((u, index) => ({
            id: u.id,
            userId: u.id,
            user: u,
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
                        user: myUser,
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