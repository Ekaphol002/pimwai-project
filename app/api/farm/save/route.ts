import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRankFromExp, calculateRankInfo } from '@/lib/rankUtils';

// 🛡️ In-memory rate limiting map (userId -> timestamp of last request)
const lastRequestTimeMap = new Map<string, number>();

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { expEarned, wpm, accuracy, wordsCount, timeSpentSeconds } = body;

        const numExp = Number(expEarned) || 0;
        if (numExp <= 0) {
            return NextResponse.json({ success: true, message: "No EXP to update" });
        }

        const userId = session.user.id || session.user.email;
        const now = Date.now();

        // 🛡️ 1. Rate Limit: ป้องกันบอทสแปมรัวคำขอ (500ms ต่อคำขอ เพื่อรองรับการ Sync ขณะพิมพ์เร็ว)
        const lastTime = lastRequestTimeMap.get(userId);
        if (lastTime && (now - lastTime) < 500) {
            return NextResponse.json({
                success: false,
                rateLimited: true,
                error: "Too many requests. Please slow down."
            }, { status: 429 });
        }
        lastRequestTimeMap.set(userId, now);

        // ทำความสะอาด map ไม่ให้ล้น memory (เก็บไม่เกิน 1,000 users)
        if (lastRequestTimeMap.size > 1000) {
            const cutoff = now - 60000;
            for (const [k, v] of lastRequestTimeMap.entries()) {
                if (v < cutoff) lastRequestTimeMap.delete(k);
            }
        }

        // 🛡️ 2. Anti-Cheat: ความเร็ว & ความแม่นยำต้องสมจริง
        const numWpm = Math.min(300, Math.max(0, Math.round(Number(wpm) || 0)));
        const numAccuracy = Math.min(100, Math.max(0, Math.round(Number(accuracy) || 100)));
        if (numWpm > 250) {
            return NextResponse.json({ error: "Suspicious typing speed detected" }, { status: 400 });
        }

        // 🛡️ 3. Anti-Cheat: รองรับผู้เล่น Rank สูงที่คูณแต้มเยอะและสะสมคิวมาส่ง (แคปสูงสุดต่อ 1 ครั้งที่ 100,000 EXP)
        const safeExp = Math.min(numExp, 100000);

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: session.user.id || undefined },
                    { email: session.user.email || undefined }
                ]
            }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        const newTotalExp = (user.currentExp || 0) + safeExp;
        
        let isTop10 = false;
        if (newTotalExp >= 234000) {
            const higherCount = await prisma.user.count({
                where: {
                    currentExp: { gt: newTotalExp }
                }
            });
            isTop10 = higherCount < 10;
        }

        const rankInfo = calculateRankInfo(newTotalExp, isTop10);

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                currentExp: newTotalExp,
                rank: rankInfo.rank,
                stars: rankInfo.stars,
                lastPlayedAt: new Date()
            },
            select: {
                id: true,
                rank: true,
                currentExp: true,
                stars: true
            }
        });

        return NextResponse.json({
            success: true,
            updatedUser
        });

    } catch (error: any) {
        console.error("Error saving farm exp:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
