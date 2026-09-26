import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRankFromExp } from '@/lib/rankUtils';

// Config ค่า EXP และโบนัสต่างๆ ให้สมดุลกับ 7 แรงค์ และเปิดทางให้ฟาร์มต่อในโหมดพิมพ์ด่วน
// Rank 1: 0 - 3,000 XP
// Rank 2: 3,000 - 9,000 XP
// Rank 3: 9,000 - 24,000 XP (ผู้เล่นจบทั้ง 21 บทเรียน 210 ด่านจะอยู่ที่ประมาณ Rank 2 ปลายๆ ถึง Rank 3 ต้นๆ ~9,000-14,000 XP)
// Rank 4-7: 24,000 - 234,000+ XP ออกแบบไว้สำหรับประลองและฟาร์มในโหมดพิมพ์ด่วน (Farm Mode)
const EXP_CONFIG = {
    BASE_CLEAR: 15,
    PER_STAR: 5,
    BONUS_3_STARS: 20,       // 3 ดาว: Base 15 + 20 = 35 XP (ก่อนคูณระดับ)
    REPLAY_SCORE: 5,         // เล่นด่านเดิมซ้ำเมื่อทำสถิติดีขึ้น ได้ 5 XP (ป้องกันการปั๊มด่านแรก ให้ไปฟาร์มพิมพ์ด่วน)
    PERFECT_BONUS: 5,        // ความแม่นยำ 100% ได้ +5 XP
    QUEST_REWARD: 50,        // รางวัลเควสรายวัน 50 XP

    // 🌟 โบนัสเสริมรายวันและฝีมือ
    FIRST_WIN_REWARD: 25,    // ประเดิมด่านแรกของวัน
    WPM_MILESTONES: {        // รางวัลเจ้าความเร็ว
        FAST: 30,   // > 30 WPM ได้ +3
        FASTER: 40, // > 40 WPM ได้ +5
        FASTEST: 50 // > 50 WPM ได้ +10
    },
    WPM_BONUS: {
        FAST: 3,
        FASTER: 5,
        FASTEST: 10
    },
    GRINDER_MILESTONES: {    // โบนัสคนขยันรายวัน (เล่นครบกี่ด่าน)
        LEVEL_1: 5,  // ครบ 5 ด่าน +15
        LEVEL_2: 10, // ครบ 10 ด่าน +30
        LEVEL_3: 20  // ครบ 20 ด่าน +50
    },
    GRINDER_BONUS: {
        LEVEL_1: 15,
        LEVEL_2: 30,
        LEVEL_3: 50
    },

    // ตัวคูณระดับความยากของบทเรียน
    MULTIPLIER: {
        beginner: 1.0,       // เริ่มต้น: 3 ดาว = ~35-40 XP / ด่าน
        intermediate: 1.3,   // ปานกลาง: 3 ดาว = ~45-55 XP / ด่าน
        advanced: 1.7        // ขั้นสูง: 3 ดาว = ~60-70 XP / ด่าน
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
        if (stars < 0 || stars > 3) return NextResponse.json({ error: "Invalid stars" }, { status: 400 });
        if (accuracy > 100 || accuracy < 0) return NextResponse.json({ error: "Invalid accuracy" }, { status: 400 });
        if (wpm > 300 || (wpm > 50 && duration < 2)) {
            return NextResponse.json({ error: "Suspicious activity detected" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
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
            const existingProgress = await tx.lessonProgress.findUnique({
                where: { userId_subLessonId: { userId, subLessonId } },
            });

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
                    await tx.lessonProgress.update({
                        where: { userId_subLessonId: { userId, subLessonId } },
                        data: {
                            wpm: Math.max(wpm, existingProgress.wpm),
                            accuracy: Math.max(accuracy, existingProgress.accuracy),
                            stars: Math.max(stars, existingProgress.stars),
                            status: "completed",
                            updatedAt: new Date()
                        },
                    });
                }
            }

            // --- 3. คำนวณโบนัสต่างๆ (Quest, WPM, Grinder, First Win) ---

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // ดึงสถิติวันนี้
            const dailyStats = await tx.lessonProgress.aggregate({
                where: { userId: userId, updatedAt: { gte: today } },
                _count: { subLessonId: true },
                _sum: { duration: true }
            });

            const dailyTotalLessons = dailyStats._count.subLessonId;
            const dailyTotalTime = dailyStats._sum.duration || 0;

            let questBonus = 0;
            let completedQuestInfo: { text: string; xp: number } | null = null;
            let completedQuestsCount = 0;

            // ✅ 1. เปลี่ยนจาก string เป็น array เพื่อเก็บชื่อหลายเควส
            let completedQuestNames = [];

            // Quest 1: เวลาเล่นรวม
            const prevTotalTime = dailyTotalTime - duration;
            if (dailyTotalTime >= 300 && prevTotalTime < 300) {
                questBonus += EXP_CONFIG.QUEST_REWARD;
                completedQuestsCount++;
                completedQuestNames.push("เควสพิมพ์ครบ 5 นาที"); // ✅ เก็บชื่อเข้า Array
            }

            // Quest 2: ผ่าน 3 บทเรียน
            if (dailyTotalLessons === 3) {
                questBonus += EXP_CONFIG.QUEST_REWARD;
                completedQuestsCount++;
                completedQuestNames.push("เควสผ่าน 3 บทเรียน"); // ✅ เก็บชื่อเข้า Array
            }

            // Quest 3: แม่นยำ 95%
            const highAccCount = await tx.lessonProgress.count({
                where: { userId: userId, updatedAt: { gte: today }, accuracy: { gte: 95 } }
            });

            // เช็คว่า accuracy ผ่านเกณฑ์ และเป็นครั้งแรกของวัน (highAccCount === 1)
            if (accuracy >= 95 && highAccCount === 1) {
                questBonus += EXP_CONFIG.QUEST_REWARD;
                completedQuestsCount++;
                completedQuestNames.push("เควสแม่นยำ 95%!"); // ✅ เก็บชื่อเข้า Array

                // ⚠️ สั่งบันทึกลง DB (อันนี้อาจจะทำงานอยู่แล้ว หรือหน้าบ้านเช็คจาก lessonProgress เอง)
            }

            // ✅ 2. รวมชื่อเควสทั้งหมดมาแสดง (เช่น "แม่นยำ 95%! + ผ่าน 3 บทเรียน")
            if (completedQuestsCount > 0) {
                completedQuestInfo = {
                    text: completedQuestNames.join(" + "), // เอาชื่อมาต่อกัน
                    xp: questBonus
                };
            }

            // --- 🌟 NEW BONUSES ---

            // A. 🏎️ WPM Milestone Bonus
            let wpmBonus = 0;
            if (accuracy >= 90) { // ต้องแม่นด้วยถึงจะได้โบนัสความเร็ว
                if (wpm >= EXP_CONFIG.WPM_MILESTONES.FASTEST) wpmBonus = EXP_CONFIG.WPM_BONUS.FASTEST;
                else if (wpm >= EXP_CONFIG.WPM_MILESTONES.FASTER) wpmBonus = EXP_CONFIG.WPM_BONUS.FASTER;
                else if (wpm >= EXP_CONFIG.WPM_MILESTONES.FAST) wpmBonus = EXP_CONFIG.WPM_BONUS.FAST;
            }

            // B. 🏋️ Grinder Bonus (โบนัสคนขยัน)
            let grinderBonus = 0;
            if (dailyTotalLessons === EXP_CONFIG.GRINDER_MILESTONES.LEVEL_1) grinderBonus = EXP_CONFIG.GRINDER_BONUS.LEVEL_1;
            else if (dailyTotalLessons === EXP_CONFIG.GRINDER_MILESTONES.LEVEL_2) grinderBonus = EXP_CONFIG.GRINDER_BONUS.LEVEL_2;
            else if (dailyTotalLessons === EXP_CONFIG.GRINDER_MILESTONES.LEVEL_3) grinderBonus = EXP_CONFIG.GRINDER_BONUS.LEVEL_3;

            // C. 🌅 First Win of the Day
            let firstWinBonus = 0;
            const lastPlayed = user.lastPlayedAt ? new Date(user.lastPlayedAt) : null;
            if (lastPlayed) lastPlayed.setHours(0, 0, 0, 0);

            // ถ้าไม่เคยเล่น หรือ เล่นครั้งล่าสุดคือก่อนวันนี้
            if (!lastPlayed || lastPlayed.getTime() < today.getTime()) {
                firstWinBonus = EXP_CONFIG.FIRST_WIN_REWARD;
            }

            // --- 4. รวม XP และอัปเดต User ---
            const totalExpGained = baseLessonExp + questBonus + wpmBonus + grinderBonus + firstWinBonus;

            const currentTotalExp = (user.currentExp || 0) + totalExpGained;
            const newRank = getRankFromExp(currentTotalExp);

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
            isNewHighScore: result.isNewHighScore,
            totalXP: result.updatedUser.currentExp,
            rank: result.updatedUser.rank
        });

    } catch (error) {
        console.error('Error saving lesson:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}