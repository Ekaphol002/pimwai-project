import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRankFromExp, calculateRankInfo } from '@/lib/rankUtils';
import { getStartOfTodayBangkok } from '@/lib/streakUtils';
import { evaluateNewlyCompletedQuests } from '@/lib/questUtils';

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

        // 🛡️ 1. Rate Limit & Time Velocity Check
        const lastTime = lastRequestTimeMap.get(userId);
        const elapsedSec = lastTime ? (now - lastTime) / 1000 : 999;

        // ป้องกันการสแปมยิง API ถี่ผิดปกติ (ต้องเว้นอย่างน้อย 1.5 วินาที)
        if (lastTime && (now - lastTime) < 1500) {
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

        const addedDuration = Math.max(0, Math.min(300, Math.round(Number(timeSpentSeconds) || 0)));
        const numWords = Math.max(0, Math.round(Number(wordsCount) || 0));

        // 🛡️ ป้องกันบอทส่งเวลาเล่นปลอมเกินเวลาโลกจริง (เช่น ยิงห่างกัน 3 วิ แต่บอกว่าเล่นไป 60 วิ)
        if (lastTime && addedDuration > elapsedSec + 5) {
            return NextResponse.json({
                success: false,
                error: "Invalid session duration"
            }, { status: 400 });
        }

        // 🛡️ 3. Anti-Cheat: สกัดกั้นบอทพิมพ์ 1 คำแล้วกดยิง API (Farm Loop Exploit)
        if (numWords < 3 && addedDuration < 6) {
            return NextResponse.json({
                success: false,
                error: "ต้องพิมพ์อย่างน้อย 3 คำ หรือใช้เวลาอย่างน้อย 6 วินาทีเพื่อบันทึก EXP"
            }, { status: 400 });
        }

        // 🛡️ 4. EXP Velocity Cap (ขีดจำกัดทางชีวภาพและตัวคูณ):
        // แม้จะเป็น Rank 7 (ตัวคูณสูงสุด x25 + Fever x2 = x50) ก็มีเพดานสูงสุดตามจำนวนคำและเวลาจริง
        const maxExpByTime = Math.max(500, (addedDuration || 5) * 800);
        const maxExpByWords = Math.max(500, numWords * 450);
        const maxPlausibleExp = Math.min(maxExpByTime, maxExpByWords);
        const safeExp = Math.min(numExp, maxPlausibleExp, 100000);

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

        // 🛡️ Atomic Transaction: ป้องกัน Race Condition และ EXP สูญหาย (B8 Fix)
        // 🛡️ ถนอมดาวสะสม: ไม่เขียนทับ User.stars ด้วย rankInfo.stars เพื่อไม่ให้ดาวจากบทเรียนหาย (B7 Fix)
        const result = await prisma.$transaction(async (tx) => {
            let createdFarmSessionId: string | undefined = undefined;
            if (addedDuration > 0 || safeExp > 0) {
                const newFarmSession = await tx.farmSession.create({
                    data: {
                        userId: user.id,
                        duration: addedDuration,
                        expEarned: safeExp,
                        wpm: numWpm,
                        accuracy: numAccuracy,
                        wordsCount: Number(wordsCount) || 0
                    }
                });
                createdFarmSessionId = newFarmSession.id;
            }

            // ตรวจสอบว่ามีเควสรายวันไหนที่เพิ่งสำเร็จในรอบการซิงค์นี้หรือไม่
            const { newlyCompletedQuests, totalQuestBonusXp } = await evaluateNewlyCompletedQuests({
                tx,
                userId: user.id,
                currentActivity: {
                    type: 'farm',
                    recordId: createdFarmSessionId
                }
            });

            const totalAddedExp = safeExp + totalQuestBonusXp;

            // บันทึกแบบ Atomic Increment
            const updatedUserRecord = await tx.user.update({
                where: { id: user.id },
                data: {
                    currentExp: { increment: totalAddedExp },
                    farmTimeSeconds: { increment: addedDuration },
                    lastPlayedAt: new Date()
                },
                select: {
                    id: true,
                    rank: true,
                    currentExp: true,
                    stars: true,
                    farmTimeSeconds: true
                }
            });

            const currentExpAfterUpdate = updatedUserRecord.currentExp;
            let isTop10 = false;
            if (currentExpAfterUpdate >= 234000) {
                const higherCount = await tx.user.count({
                    where: {
                        currentExp: { gt: currentExpAfterUpdate }
                    }
                });
                isTop10 = higherCount < 10;
            }

            const rankInfo = calculateRankInfo(currentExpAfterUpdate, isTop10);
            if (rankInfo.rank !== updatedUserRecord.rank) {
                await tx.user.update({
                    where: { id: user.id },
                    data: { rank: rankInfo.rank }
                });
                updatedUserRecord.rank = rankInfo.rank;
            }

            const startOfToday = getStartOfTodayBangkok();
            const todayFarm = await tx.farmSession.aggregate({
                where: {
                    userId: user.id,
                    createdAt: { gte: startOfToday }
                },
                _sum: {
                    duration: true
                }
            });

            return {
                updatedUser: {
                    ...updatedUserRecord,
                    todayFarmTimeSeconds: todayFarm._sum.duration || 0
                },
                completedQuests: newlyCompletedQuests,
                questBonusXp: totalQuestBonusXp
            };
        });

        return NextResponse.json({
            success: true,
            completedQuests: result.completedQuests,
            questBonusXp: result.questBonusXp,
            updatedUser: result.updatedUser
        });

    } catch (error: any) {
        console.error("Error saving farm exp:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
