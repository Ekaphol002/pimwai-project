import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRankFromExp } from '@/lib/rankUtils';
import { getStartOfTodayBangkok, toDateKey } from '@/lib/streakUtils';
import { evaluateNewlyCompletedQuests } from '@/lib/questUtils';

// Config ค่า EXP และโบนัสต่างๆ ให้สะใจ (150 - 300 XP ต่อด่าน)
// Rank 1: 0 - 3,000 XP (ผ่านช่วงต้นของ Beginner 1-2 บทเรียนก็ขึ้น Rank 2)
// Rank 2: 3,000 - 9,000 XP
// Rank 3: 9,000 - 24,000 XP
// Rank 4: 24,000 - 54,000 XP (จบครบ 21 บทเรียน 210 ด่านจะสะสมได้ประมาณ 45,000 - 52,000 XP ทะลุเข้า Rank 4 ปลายๆ เกือบถึง Rank 5)
// Rank 5 (54k - 114k), Rank 6 (114k - 234k), Rank 7 (234k+ Top 10): สำหรับผู้เล่นลุยฟาร์มและประลองในโหมดพิมพ์ด่วน (Farm Mode)
const EXP_CONFIG = {
    BASE_CLEAR: 60,
    PER_STAR: 20,
    BONUS_3_STARS: 90,       // 3 ดาว: Base 60 + 90 = 150 XP (ก่อนคูณระดับความยาก)
    REPLAY_SCORE: 20,        // เล่นด่านเดิมซ้ำเมื่อทำสถิติดีขึ้น ได้ 20 XP (เพื่อดึงดูดให้ไปฟาร์มพิมพ์ด่วนถ้าต้องการ EXP สูงๆ)
    PERFECT_BONUS: 20,       // ความแม่นยำ 100% ได้ +20 XP
    QUEST_REWARD: 100,       // รางวัลเควสรายวัน 100 XP

    // 🌟 โบนัสเสริมรายวันและฝีมือ
    FIRST_WIN_REWARD: 50,    // ประเดิมด่านแรกของวัน +50 XP
    WPM_MILESTONES: {        // รางวัลเจ้าความเร็ว
        FAST: 30,   // > 30 WPM ได้ +10
        FASTER: 40, // > 40 WPM ได้ +20
        FASTEST: 50 // > 50 WPM ได้ +30
    },
    WPM_BONUS: {
        FAST: 10,
        FASTER: 20,
        FASTEST: 30
    },
    GRINDER_MILESTONES: {    // โบนัสคนขยันรายวัน (เล่นครบกี่ด่าน)
        LEVEL_1: 5,  // ครบ 5 ด่าน +30
        LEVEL_2: 10, // ครบ 10 ด่าน +60
        LEVEL_3: 20  // ครบ 20 ด่าน +100
    },
    GRINDER_BONUS: {
        LEVEL_1: 30,
        LEVEL_2: 60,
        LEVEL_3: 100
    },

    // ตัวคูณระดับความยากของบทเรียน
    MULTIPLIER: {
        beginner: 1.0,       // เริ่มต้น: 3 ดาว = ~150 - 170 XP / ด่าน
        intermediate: 1.4,   // ปานกลาง: 3 ดาว = ~210 - 230 XP / ด่าน
        advanced: 1.8        // ขั้นสูง: 3 ดาว = ~270 - 300 XP / ด่าน
    }
};

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { subLessonId, wpm, accuracy, stars, duration } = body;

        // 🚨 1. Validation & Anti-Cheat
        if (typeof stars !== 'number' || stars < 0 || stars > 3) return NextResponse.json({ error: "Invalid stars" }, { status: 400 });
        if (typeof accuracy !== 'number' || accuracy > 100 || accuracy < 0) return NextResponse.json({ error: "Invalid accuracy" }, { status: 400 });
        if (typeof wpm !== 'number' || wpm > 250 || (wpm > 40 && (!duration || duration < 3))) {
            return NextResponse.json({ error: "Suspicious activity detected" }, { status: 400 });
        }

        const cleanEmail = session.user.email?.trim().toLowerCase();
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    ...((session.user as any)?.id ? [{ id: (session.user as any).id }] : []),
                    ...(cleanEmail ? [{ email: cleanEmail }] : [])
                ]
            }
        });
        if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

        const userId = user.id;

        // ดึงข้อมูล Lesson แม่
        const subLessonInfo = await prisma.subLesson.findUnique({
            where: { id: subLessonId },
            include: { lesson: true }
        });

        let difficultyMultiplier = 1.0;
        if (subLessonInfo?.lesson?.level) {
            difficultyMultiplier = EXP_CONFIG.MULTIPLIER[subLessonInfo.lesson.level as keyof typeof EXP_CONFIG.MULTIPLIER] || 1.0;
        }

        const result = await prisma.$transaction(async (tx) => {
            const today = getStartOfTodayBangkok();
            const existingProgress = await tx.lessonProgress.findUnique({
                where: { userId_subLessonId: { userId, subLessonId } },
            });

            const prevLessonProgress = existingProgress ? {
                duration: existingProgress.duration || 0,
                wpm: existingProgress.wpm || 0,
                accuracy: existingProgress.accuracy || 0,
                updatedToday: new Date(existingProgress.updatedAt).getTime() >= today.getTime()
            } : null;

            // --- 2. คำนวณ Base XP ---
            let baseLessonExp = 0;
            const isFirstClear = !existingProgress || existingProgress.stars === 0;
            let isNewHighScore = false;

            if (isFirstClear) {
                const starBonus = stars === 3 ? EXP_CONFIG.BONUS_3_STARS : stars * EXP_CONFIG.PER_STAR;
                let rawExp = EXP_CONFIG.BASE_CLEAR + starBonus;
                rawExp = Math.round(rawExp * difficultyMultiplier);
                if (accuracy === 100) rawExp += EXP_CONFIG.PERFECT_BONUS;

                baseLessonExp = rawExp;
                isNewHighScore = true;

                if (!existingProgress) {
                    await tx.lessonProgress.create({
                        data: { userId, subLessonId, wpm, accuracy, stars, duration, status: "completed" },
                    });
                } else {
                    await tx.lessonProgress.update({
                        where: { userId_subLessonId: { userId, subLessonId } },
                        data: { wpm, accuracy, stars, duration, status: "completed", updatedAt: new Date() },
                    });
                }
            } else {
                // Replay Mode
                const isBetterScore = wpm > existingProgress.wpm || stars > existingProgress.stars;
                if (isBetterScore) {
                    baseLessonExp = EXP_CONFIG.REPLAY_SCORE;
                    isNewHighScore = true;
                }
                // อัปเดต updatedAt และสะสม duration ของวันนี้เพื่อให้เควสรายวันทำงานแม้เล่นด่านซ้ำ
                const nextDuration = prevLessonProgress?.updatedToday
                    ? (existingProgress.duration || 0) + duration
                    : duration;
                await tx.lessonProgress.update({
                    where: { userId_subLessonId: { userId, subLessonId } },
                    data: {
                        wpm: Math.max(wpm, existingProgress.wpm),
                        accuracy: Math.max(accuracy, existingProgress.accuracy),
                        stars: Math.max(stars, existingProgress.stars),
                        duration: nextDuration,
                        status: "completed",
                        updatedAt: new Date()
                    },
                });
            }

            // --- 3. คำนวณโบนัสต่างๆ (Quest, WPM, Grinder, First Win) ---
            const dailyStats = await tx.lessonProgress.aggregate({
                where: { userId: userId, updatedAt: { gte: today } },
                _count: { subLessonId: true }
            });
            const dailyTotalLessons = dailyStats._count.subLessonId;

            const { newlyCompletedQuests, totalQuestBonusXp } = await evaluateNewlyCompletedQuests({
                tx,
                userId,
                currentActivity: {
                    type: 'lesson',
                    subLessonId,
                    prevLessonProgress
                }
            });

            const questBonus = totalQuestBonusXp;
            const completedQuestInfo = newlyCompletedQuests.length > 0 ? {
                text: newlyCompletedQuests.map(q => q.text).join(" + "),
                xp: questBonus
            } : null;

            // --- 🌟 NEW BONUSES ---

            // A. 🏎️ WPM Milestone Bonus
            let wpmBonus = 0;
            if (accuracy >= 90) { // ต้องแม่นด้วยถึงจะได้โบนัสความเร็ว
                if (wpm >= EXP_CONFIG.WPM_MILESTONES.FASTEST) wpmBonus = EXP_CONFIG.WPM_BONUS.FASTEST;
                else if (wpm >= EXP_CONFIG.WPM_MILESTONES.FASTER) wpmBonus = EXP_CONFIG.WPM_BONUS.FASTER;
                else if (wpm >= EXP_CONFIG.WPM_MILESTONES.FAST) wpmBonus = EXP_CONFIG.WPM_BONUS.FAST;
            }

            // B. 🏋️ Grinder Bonus (โบนัสคนขยัน: ให้เฉพาะเมื่อนับด่านใหม่ของวันนี้เท่านั้น ป้องกันการเล่นด่านเดิมซ้ำเพื่อปั๊มโบนัส)
            let grinderBonus = 0;
            const wasUpdatedToday = prevLessonProgress?.updatedToday;
            if (!wasUpdatedToday) {
                if (dailyTotalLessons === EXP_CONFIG.GRINDER_MILESTONES.LEVEL_1) grinderBonus = EXP_CONFIG.GRINDER_BONUS.LEVEL_1;
                else if (dailyTotalLessons === EXP_CONFIG.GRINDER_MILESTONES.LEVEL_2) grinderBonus = EXP_CONFIG.GRINDER_BONUS.LEVEL_2;
                else if (dailyTotalLessons === EXP_CONFIG.GRINDER_MILESTONES.LEVEL_3) grinderBonus = EXP_CONFIG.GRINDER_BONUS.LEVEL_3;
            }

            // C. 🌅 First Win of the Day (เทียบตามเวลาประเทศไทยป้องกัน Timezone UTC คลาดเคลื่อน)
            let firstWinBonus = 0;
            const userLastPlayedDateKey = user.lastPlayedAt ? toDateKey(user.lastPlayedAt) : null;
            const todayDateKey = toDateKey(new Date());

            if (!userLastPlayedDateKey || userLastPlayedDateKey !== todayDateKey) {
                firstWinBonus = EXP_CONFIG.FIRST_WIN_REWARD;
            }

            // --- 4. รวม XP และอัปเดต User ---
            const totalExpGained = baseLessonExp + questBonus + wpmBonus + grinderBonus + firstWinBonus;

            const currentTotalExp = (user.currentExp || 0) + totalExpGained;
            let isTop10 = false;
            if (currentTotalExp >= 234000) {
                const higherCount = await tx.user.count({
                    where: {
                        id: { not: userId },
                        currentExp: { gt: currentTotalExp }
                    }
                });
                isTop10 = higherCount < 10;
            }
            const newRank = getRankFromExp(currentTotalExp, isTop10);

            let starsToAdd = 0;
            if (isFirstClear) {
                starsToAdd = stars;
            } else if (stars > (existingProgress?.stars || 0)) {
                starsToAdd = stars - (existingProgress?.stars || 0);
            }

            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    currentExp: currentTotalExp,
                    rank: newRank,
                    stars: { increment: starsToAdd },
                    lastPlayedAt: new Date()
                }
            });

            // คืนค่าทั้งหมดแยกตามประเภท เพื่อให้ Frontend นำไปแสดงผลได้
            return {
                baseLessonExp,
                questBonus,
                completedQuestInfo,
                newlyCompletedQuests,
                wpmBonus,      // 🌟 ส่งกลับ
                grinderBonus,  // 🌟 ส่งกลับ
                firstWinBonus, // 🌟 ส่งกลับ
                isNewHighScore,
                updatedUser
            };
        });

        return NextResponse.json({
            success: true,
            earnedXP: result.baseLessonExp + result.questBonus + result.wpmBonus + result.grinderBonus + result.firstWinBonus, // รวม XP ที่โชว์ตัวใหญ่

            // ✅ ส่ง Breakdown ไปให้หน้าจบเกมแสดงผล
            xpBreakdown: {
                base: result.baseLessonExp,
                quest: result.questBonus,
                wpm: result.wpmBonus,
                grinder: result.grinderBonus,
                firstWin: result.firstWinBonus
            },

            completedQuest: result.completedQuestInfo,
            completedQuests: result.newlyCompletedQuests,
            isNewHighScore: result.isNewHighScore,
            totalXP: result.updatedUser.currentExp,
            rank: result.updatedUser.rank
        });

    } catch (error) {
        console.error('Error saving lesson:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}