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
        const {
            expEarned,
            wpm,
            accuracy,
            wordsCount,
            timeSpentSeconds,
            isFinalSession,
            sessionDuration,
            sessionWords,
            sessionExp
        } = body;

        const numExp = Number(expEarned) || 0;
        const numWpm = Math.min(300, Math.max(0, Math.round(Number(wpm) || 0)));
        const numAccuracy = Math.min(100, Math.max(0, Math.round(Number(accuracy) || 100)));
        const addedDuration = Math.max(0, Math.min(7200, Math.round(Number(timeSpentSeconds) || 0)));
        const numWords = Math.max(0, Math.round(Number(wordsCount) || 0));

        // ถ้าไม่มีทั้ง EXP, ไม่มีเวลาสะสม, ไม่มีคำ และไม่ได้จบรอบ ให้ผ่านโดยไม่ต้องอัปเดต DB
        if (numExp <= 0 && addedDuration <= 0 && !isFinalSession && Number(sessionExp) <= 0) {
            return NextResponse.json({ success: true, message: "No data to update" });
        }

        // 🛡️ 1. Anti-Cheat: ป้องกัน WPM เกินระดับมนุษย์ (> 250 WPM)
        if (numWpm > 250) {
            return NextResponse.json({ error: "Suspicious typing speed detected" }, { status: 400 });
        }

        // 🛡️ 2. ปลอดภัยและรองรับตัวคูณ EXP สูงสุดทุก Rank (อนุญาตให้รับ EXP ได้เต็มจำนวนสูงสุดถึง 1,000,000 EXP ต่อเซสชัน)
        const safeExp = Math.min(Math.max(0, numExp), 1000000);

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
            // 🛡️ ปรับการบันทึก FarmSession แบบใหม่:
            // สร้างแถว FarmSession เพียง 1 แถวต่อเมื่อ "จบรอบ" หรือ "ออกจากหน้า" (isFinalSession === true)
            // ระหว่างกำลังพิมพ์ (Periodic Sync) จะอัปเดตเฉพาะ EXP และเวลาสะสมใน User โดยไม่สร้างแถวซ้ำซ้อนใน FarmSession
            if (isFinalSession === true && (Number(sessionDuration) > 0 || addedDuration > 0 || numWords >= 1 || safeExp > 0 || Number(sessionExp) > 0)) {
                const finalDuration = Math.min(7200, Math.max(1, Number(sessionDuration) || addedDuration));
                const finalWords = Math.max(0, Number(sessionWords) || numWords);
                const finalExp = Math.max(0, Number(sessionExp) || safeExp);

                const newFarmSession = await tx.farmSession.create({
                    data: {
                        userId: user.id,
                        duration: finalDuration,
                        expEarned: finalExp,
                        wpm: numWpm,
                        accuracy: numAccuracy,
                        wordsCount: finalWords
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
