import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRankFromExp, calculateRankInfo, getRankMultiplierConfig } from '@/lib/rankUtils';
import { getStartOfTodayBangkok, toDateKey } from '@/lib/streakUtils';
import { recordUserActiveDate } from '@/lib/activeDates';
import { evaluateQuestsFromSnapshot, getTotalSubLessonsCount } from '@/lib/questUtils';

// แคชระดับความยากของ SubLesson ในหน่วยความจำ (10 นาที) ลดการ join ซ้ำทุกครั้งที่จบด่าน
const subLessonLevelCache = new Map<string, { level: string; expiresAt: number }>();

async function getSubLessonLevel(subLessonId: string): Promise<string | null> {
    const now = Date.now();
    const cached = subLessonLevelCache.get(subLessonId);
    if (cached && cached.expiresAt > now) {
        return cached.level;
    }
    const row = await prisma.subLesson.findUnique({
        where: { id: subLessonId },
        select: { lesson: { select: { level: true } } }
    });
    const level = row?.lesson?.level || null;
    if (level) {
        subLessonLevelCache.set(subLessonId, { level, expiresAt: now + 10 * 60 * 1000 });
    }
    return level;
}

const EXP_CONFIG = {
    BASE_CLEAR: 60,
    PER_STAR: 20,
    BONUS_3_STARS: 90,
    REPLAY_SCORE: 20,
    PERFECT_BONUS: 20,
    QUEST_REWARD: 100,

    FIRST_WIN_REWARD: 50,
    WPM_MILESTONES: {
        FAST: 30,
        FASTER: 40,
        FASTEST: 50
    },
    WPM_BONUS: {
        FAST: 10,
        FASTER: 20,
        FASTEST: 30
    },
    GRINDER_MILESTONES: {
        LEVEL_1: 5,
        LEVEL_2: 10,
        LEVEL_3: 20
    },
    GRINDER_BONUS: {
        LEVEL_1: 30,
        LEVEL_2: 60,
        LEVEL_3: 100
    },

    MULTIPLIER: {
        beginner: 1.0,
        intermediate: 1.4,
        advanced: 1.8
    }
};

export async function POST(request: Request) {
    try {
        const [session, body] = await Promise.all([
            getServerSession(authOptions),
            request.json()
        ]);
        const { subLessonId, wpm, accuracy, stars, duration, guestContext } = body;

        // 🚨 1. Validation & Anti-Cheat
        if (typeof stars !== 'number' || stars < 0 || stars > 3) return NextResponse.json({ error: "Invalid stars" }, { status: 400 });
        if (typeof accuracy !== 'number' || accuracy > 100 || accuracy < 0) return NextResponse.json({ error: "Invalid accuracy" }, { status: 400 });
        if (typeof wpm !== 'number' || wpm > 250 || (wpm > 40 && (!duration || duration < 3))) {
            return NextResponse.json({ error: "Suspicious activity detected" }, { status: 400 });
        }

        // 🌟 กรณีไม่ได้ล็อกอิน (Guest Mode): ใช้แค่ level (มักได้จาก cache = 0ms)
        if (!session || !session.user?.email) {
            const level = await getSubLessonLevel(subLessonId);
            const difficultyMultiplier = level
                ? (EXP_CONFIG.MULTIPLIER[level as keyof typeof EXP_CONFIG.MULTIPLIER] || 1.0)
                : 1.0;

            const prevStars = Number(guestContext?.prevStars) || 0;
            const prevWpm = Number(guestContext?.prevWpm) || 0;
            const hasExisting = Boolean(guestContext?.hasExisting);
            const prevUpdatedToday = Boolean(guestContext?.prevUpdatedToday);
            const dailyTotalLessons = Number(guestContext?.dailyTotalLessons) || 1;
            const lastPlayedDateKey = typeof guestContext?.lastPlayedDateKey === 'string' ? guestContext.lastPlayedDateKey : null;
            const guestTotalExp = Math.max(0, Number(guestContext?.guestTotalExp) || 0);

            const guestRankInfo = calculateRankInfo(guestTotalExp, false);
            const rankMul = getRankMultiplierConfig(guestRankInfo.rank, guestRankInfo.stars).totalBaseMultiplier;

            let baseLessonExp = 0;
            const isFirstClear = !hasExisting || prevStars === 0;
            let isNewHighScore = false;

            if (isFirstClear) {
                const starBonus = stars === 3 ? EXP_CONFIG.BONUS_3_STARS : stars * EXP_CONFIG.PER_STAR;
                let rawExp = EXP_CONFIG.BASE_CLEAR + starBonus;
                rawExp = Math.round(rawExp * difficultyMultiplier);
                if (accuracy === 100) rawExp += EXP_CONFIG.PERFECT_BONUS;
                baseLessonExp = Math.round(rawExp * rankMul);
                isNewHighScore = true;
            } else if (wpm > prevWpm || stars > prevStars) {
                baseLessonExp = Math.round(EXP_CONFIG.REPLAY_SCORE * rankMul);
                isNewHighScore = true;
            }

            let wpmBonus = 0;
            if (accuracy >= 90) {
                if (wpm >= EXP_CONFIG.WPM_MILESTONES.FASTEST) wpmBonus = Math.round(EXP_CONFIG.WPM_BONUS.FASTEST * rankMul);
                else if (wpm >= EXP_CONFIG.WPM_MILESTONES.FASTER) wpmBonus = Math.round(EXP_CONFIG.WPM_BONUS.FASTER * rankMul);
                else if (wpm >= EXP_CONFIG.WPM_MILESTONES.FAST) wpmBonus = Math.round(EXP_CONFIG.WPM_BONUS.FAST * rankMul);
            }

            let grinderBonus = 0;
            if (!prevUpdatedToday) {
                if (dailyTotalLessons === EXP_CONFIG.GRINDER_MILESTONES.LEVEL_1) grinderBonus = Math.round(EXP_CONFIG.GRINDER_BONUS.LEVEL_1 * rankMul);
                else if (dailyTotalLessons === EXP_CONFIG.GRINDER_MILESTONES.LEVEL_2) grinderBonus = Math.round(EXP_CONFIG.GRINDER_BONUS.LEVEL_2 * rankMul);
                else if (dailyTotalLessons === EXP_CONFIG.GRINDER_MILESTONES.LEVEL_3) grinderBonus = Math.round(EXP_CONFIG.GRINDER_BONUS.LEVEL_3 * rankMul);
            }

            let firstWinBonus = 0;
            const todayDateKey = toDateKey(new Date());
            if (!lastPlayedDateKey || lastPlayedDateKey !== todayDateKey) {
                firstWinBonus = Math.round(EXP_CONFIG.FIRST_WIN_REWARD * rankMul);
            }

            const earnedXP = baseLessonExp + wpmBonus + grinderBonus + firstWinBonus;
            const nextTotalExp = guestTotalExp + earnedXP;

            return NextResponse.json({
                success: true,
                isGuest: true,
                earnedXP,
                xpBreakdown: {
                    base: baseLessonExp,
                    quest: 0,
                    wpm: wpmBonus,
                    grinder: grinderBonus,
                    firstWin: firstWinBonus,
                },
                completedQuest: null,
                completedQuests: [],
                isNewHighScore,
                totalXP: nextTotalExp,
                rank: getRankFromExp(nextTotalExp, false),
            });
        }

        // 🚀 ULTRA-FAST PATH: ลดจาก 14 sequential round-trips เหลือแค่ 2 parallel round-trips!
        const sessionUserId = (session.user as any)?.id as string | undefined;
        const cleanEmail = session.user.email.trim().toLowerCase();
        const today = getStartOfTodayBangkok();

        // Round-trip 1: อ่านข้อมูลทุกอย่างแบบขนานจริง (ไม่ติด interactive transaction serialization)
        let user: { id: string; currentExp: number; rank: number; stars: number; lastPlayedAt: Date | null } | null = null;
        let level: string | null = null;
        let existingProgress: any = null;
        let totalSubLessons = 0;
        let completedLessonsCount = 0;
        let todaysProgress: any[] = [];
        let todaysTests: any[] = [];
        let todaysFarm: any[] = [];

        if (sessionUserId) {
            const [u, lvl, exProg, totSubs, compCount, tProg, tTests, tFarm] = await Promise.all([
                prisma.user.findUnique({
                    where: { id: sessionUserId },
                    select: { id: true, currentExp: true, rank: true, stars: true, lastPlayedAt: true }
                }),
                getSubLessonLevel(subLessonId),
                prisma.lessonProgress.findUnique({
                    where: { userId_subLessonId: { userId: sessionUserId, subLessonId } }
                }),
                getTotalSubLessonsCount(prisma),
                prisma.lessonProgress.count({ where: { userId: sessionUserId } }),
                prisma.lessonProgress.findMany({
                    where: { userId: sessionUserId, updatedAt: { gte: today } },
                    select: { subLessonId: true, duration: true, wpm: true, accuracy: true }
                }),
                prisma.speedTestResult.findMany({
                    where: { userId: sessionUserId, createdAt: { gte: today } },
                    select: { duration: true, wpm: true, accuracy: true }
                }),
                prisma.farmSession.findMany({
                    where: { userId: sessionUserId, createdAt: { gte: today } },
                    select: { duration: true, wpm: true, accuracy: true, wordsCount: true }
                })
            ]);
            user = u;
            level = lvl;
            existingProgress = exProg;
            totalSubLessons = totSubs;
            completedLessonsCount = compCount;
            todaysProgress = tProg;
            todaysTests = tTests;
            todaysFarm = tFarm;
        }

        // Fallback กรณี session ไม่มี id หรือหาไม่เจอด้วย id
        if (!user) {
            const [u, lvl] = await Promise.all([
                prisma.user.findFirst({
                    where: { email: cleanEmail },
                    select: { id: true, currentExp: true, rank: true, stars: true, lastPlayedAt: true }
                }),
                level ? Promise.resolve(level) : getSubLessonLevel(subLessonId)
            ]);
            if (!u) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
            user = u;
            level = lvl;

            const [exProg, totSubs, compCount, tProg, tTests, tFarm] = await Promise.all([
                prisma.lessonProgress.findUnique({
                    where: { userId_subLessonId: { userId: user.id, subLessonId } }
                }),
                getTotalSubLessonsCount(prisma),
                prisma.lessonProgress.count({ where: { userId: user.id } }),
                prisma.lessonProgress.findMany({
                    where: { userId: user.id, updatedAt: { gte: today } },
                    select: { subLessonId: true, duration: true, wpm: true, accuracy: true }
                }),
                prisma.speedTestResult.findMany({
                    where: { userId: user.id, createdAt: { gte: today } },
                    select: { duration: true, wpm: true, accuracy: true }
                }),
                prisma.farmSession.findMany({
                    where: { userId: user.id, createdAt: { gte: today } },
                    select: { duration: true, wpm: true, accuracy: true, wordsCount: true }
                })
            ]);
            existingProgress = exProg;
            totalSubLessons = totSubs;
            completedLessonsCount = compCount;
            todaysProgress = tProg;
            todaysTests = tTests;
            todaysFarm = tFarm;
        }

        const userId = user.id;
        const difficultyMultiplier = level
            ? (EXP_CONFIG.MULTIPLIER[level as keyof typeof EXP_CONFIG.MULTIPLIER] || 1.0)
            : 1.0;

        const prevUpdatedToday = existingProgress
            ? new Date(existingProgress.updatedAt).getTime() >= today.getTime()
            : false;

        // คำนวณทุกอย่างในหน่วยความจำ (0ms!)
        const userRankInfo = calculateRankInfo(user.currentExp || 0, user.rank === 7);
        const rankMul = getRankMultiplierConfig(userRankInfo.rank, userRankInfo.stars).totalBaseMultiplier;

        let baseLessonExp = 0;
        const isFirstClear = !existingProgress || existingProgress.stars === 0;
        let isNewHighScore = false;

        let nextWpm = wpm;
        let nextAccuracy = accuracy;
        let nextStars = stars;
        let nextDuration = duration;

        if (isFirstClear) {
            const starBonus = stars === 3 ? EXP_CONFIG.BONUS_3_STARS : stars * EXP_CONFIG.PER_STAR;
            let rawExp = EXP_CONFIG.BASE_CLEAR + starBonus;
            rawExp = Math.round(rawExp * difficultyMultiplier);
            if (accuracy === 100) rawExp += EXP_CONFIG.PERFECT_BONUS;

            baseLessonExp = Math.round(rawExp * rankMul);
            isNewHighScore = true;
        } else {
            const isBetterScore = wpm > existingProgress.wpm || stars > existingProgress.stars;
            if (isBetterScore) {
                baseLessonExp = Math.round(EXP_CONFIG.REPLAY_SCORE * rankMul);
                isNewHighScore = true;
            }
            nextWpm = Math.max(wpm, existingProgress.wpm);
            nextAccuracy = Math.max(accuracy, existingProgress.accuracy);
            nextStars = Math.max(stars, existingProgress.stars);
            nextDuration = prevUpdatedToday
                ? (existingProgress.duration || 0) + duration
                : duration;
        }

        // จำลองรายการ todaysProgress หลังบันทึก (After) เพื่อคำนวณเควสรายวันและ Grinder Bonus โดยไม่ต้อง query ซ้ำ
        const otherTodayProgress = todaysProgress.filter(p => p.subLessonId !== subLessonId);
        const afterProgress = [
            ...otherTodayProgress,
            { subLessonId, duration: nextDuration, wpm: nextWpm, accuracy: nextAccuracy }
        ];
        const dailyTotalLessons = afterProgress.length;
        const nextCompletedCount = existingProgress ? completedLessonsCount : completedLessonsCount + 1;

        const { newlyCompletedQuests, totalQuestBonusXp, dailyQuests } = evaluateQuestsFromSnapshot({
            userId,
            totalSubLessons,
            completedLessonsCount: nextCompletedCount,
            beforeProgress: todaysProgress,
            afterProgress,
            beforeTests: todaysTests,
            afterTests: todaysTests,
            beforeFarm: todaysFarm,
            afterFarm: todaysFarm
        });

        const questBonus = totalQuestBonusXp;
        const completedQuestInfo = newlyCompletedQuests.length > 0 ? {
            text: newlyCompletedQuests.map(q => q.text).join(" + "),
            xp: questBonus
        } : null;

        let wpmBonus = 0;
        if (accuracy >= 90) {
            if (wpm >= EXP_CONFIG.WPM_MILESTONES.FASTEST) wpmBonus = Math.round(EXP_CONFIG.WPM_BONUS.FASTEST * rankMul);
            else if (wpm >= EXP_CONFIG.WPM_MILESTONES.FASTER) wpmBonus = Math.round(EXP_CONFIG.WPM_BONUS.FASTER * rankMul);
            else if (wpm >= EXP_CONFIG.WPM_MILESTONES.FAST) wpmBonus = Math.round(EXP_CONFIG.WPM_BONUS.FAST * rankMul);
        }

        let grinderBonus = 0;
        if (!prevUpdatedToday) {
            if (dailyTotalLessons === EXP_CONFIG.GRINDER_MILESTONES.LEVEL_1) grinderBonus = Math.round(EXP_CONFIG.GRINDER_BONUS.LEVEL_1 * rankMul);
            else if (dailyTotalLessons === EXP_CONFIG.GRINDER_MILESTONES.LEVEL_2) grinderBonus = Math.round(EXP_CONFIG.GRINDER_BONUS.LEVEL_2 * rankMul);
            else if (dailyTotalLessons === EXP_CONFIG.GRINDER_MILESTONES.LEVEL_3) grinderBonus = Math.round(EXP_CONFIG.GRINDER_BONUS.LEVEL_3 * rankMul);
        }

        let firstWinBonus = 0;
        const userLastPlayedDateKey = user.lastPlayedAt ? toDateKey(user.lastPlayedAt) : null;
        const todayDateKey = toDateKey(new Date());
        if (!userLastPlayedDateKey || userLastPlayedDateKey !== todayDateKey) {
            firstWinBonus = Math.round(EXP_CONFIG.FIRST_WIN_REWARD * rankMul);
        }

        const totalExpGained = baseLessonExp + questBonus + wpmBonus + grinderBonus + firstWinBonus;
        const currentTotalExp = (user.currentExp || 0) + totalExpGained;

        let isTop10 = user.rank === 7;
        if (currentTotalExp >= 234000) {
            const higherCount = await prisma.user.count({
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

        // Round-trip 2: บันทึกข้อมูลทั้งหมดแบบขนานในรอบเดียว!
        const nowDate = new Date();
        const [, updatedUser] = await Promise.all([
            prisma.lessonProgress.upsert({
                where: { userId_subLessonId: { userId, subLessonId } },
                create: {
                    userId,
                    subLessonId,
                    wpm: nextWpm,
                    accuracy: nextAccuracy,
                    stars: nextStars,
                    duration: nextDuration,
                    status: "completed"
                },
                update: {
                    wpm: nextWpm,
                    accuracy: nextAccuracy,
                    stars: nextStars,
                    duration: nextDuration,
                    status: "completed",
                    updatedAt: nowDate
                }
            }),
            prisma.user.update({
                where: { id: userId },
                data: {
                    currentExp: { increment: totalExpGained },
                    rank: newRank,
                    ...(starsToAdd > 0 ? { stars: { increment: starsToAdd } } : {}),
                    lastPlayedAt: nowDate
                },
                select: { currentExp: true, rank: true }
            }),
            recordUserActiveDate(prisma, userId)
        ]);

        return NextResponse.json({
            success: true,
            earnedXP: totalExpGained,
            xpBreakdown: {
                base: baseLessonExp,
                quest: questBonus,
                wpm: wpmBonus,
                grinder: grinderBonus,
                firstWin: firstWinBonus
            },
            completedQuest: completedQuestInfo,
            completedQuests: newlyCompletedQuests,
            dailyQuests,
            isNewHighScore,
            totalXP: updatedUser.currentExp,
            rank: updatedUser.rank
        });

    } catch (error) {
        console.error('Error saving lesson:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
