import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getRankFromExp } from '@/lib/rankUtils';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { expEarned, wpm, accuracy, wordsCount, timeSpentSeconds } = body;

        // Anti-Cheat / Sanity checks
        const safeExp = Math.min(Math.max(0, Number(expEarned) || 0), 5000);
        if (safeExp <= 0) {
            return NextResponse.json({ success: true, message: "No EXP to update" });
        }

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

        const newRank = getRankFromExp(newTotalExp, isTop10);

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                currentExp: newTotalExp,
                rank: newRank,
                lastPlayedAt: new Date()
            },
            select: {
                id: true,
                rank: true,
                currentExp: true,
                stars: true
            }
        });

        // 🌟 บันทึกกิจกรรมเพื่อจุดไฟ / รักษา Streak และอัปเดตสถิติรายวัน
        const safeDuration = Math.min(600, Math.max(1, Number(timeSpentSeconds) || Math.round((Number(wordsCount) || 10) / Math.max(0.5, (Number(wpm) || 30) / 60))));
        const safeWpm = Math.min(300, Math.max(0, Math.round(Number(wpm) || 0)));
        const safeAccuracy = Math.min(100, Math.max(0, Math.round(Number(accuracy) || 100)));

        await prisma.speedTestResult.create({
            data: {
                userId: user.id,
                duration: safeDuration,
                wpm: safeWpm,
                accuracy: safeAccuracy,
                mistakes: {}
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
