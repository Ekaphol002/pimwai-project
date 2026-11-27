import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRankFromExp, calculateRankInfo, getRankMultiplierConfig } from '@/lib/rankUtils';
import { getStartOfTodayBangkok, toDateKey } from '@/lib/streakUtils';
import { evaluateQuestsFromSnapshot, getTotalSubLessonsCount } from '@/lib/questUtils';

export const preferredRegion = 'sin1';

// แคชระดับความยากของ SubLesson ในหน่วยความจำ (10 นาที)
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

        // 🌟 กรณีไม่ได้ล็อกอิน (Guest Mode)
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

        // ⚡ ULTRA-FAST SINGLE-QUERY READ: ดึงทุกอย่างที่ต้องใช้ใน SQL เดียว (ใช้ 1 connection, 1 round-trip!)
        const sessionUserId = ((session.user as any)?.id as string) || '';
        const cleanEmail = session.user.email.trim().toLowerCase();
        const today = getStartOfTodayBangkok();

        const [snapshotRows, totalSubLessons] = await Promise.all([
            prisma.$queryRaw<any[]>`
                WITH target_user AS (
                    SELECT id, "currentExp", rank, stars, "lastPlayedAt"
                    FROM "User"
                    WHERE (id = ${sessionUserId} AND ${sessionUserId} <> '')
                       OR LOWER(email) = ${cleanEmail}
                    ORDER BY CASE WHEN id = ${sessionUserId} THEN 0 ELSE 1 END
                    LIMIT 1
                )
                SELECT
                    u.id,
                    u."currentExp",
                    u.rank,
                    u.stars,
                    u."lastPlayedAt",
                    (SELECT l.level FROM "SubLesson" sl JOIN "Lesson" l ON l.id = sl."lessonId" WHERE sl.id = ${subLessonId} LIMIT 1) AS "lessonLevel",
                    (SELECT COUNT(*)::int FROM "LessonProgress" lp WHERE lp."userId" = u.id) AS "completedLessonsCount",
                    (SELECT row_to_json(ep) FROM (
                        SELECT wpm, accuracy, stars, duration, "updatedAt"
                        FROM "LessonProgress"
                        WHERE "userId" = u.id AND "subLessonId" = ${subLessonId}
                        LIMIT 1
                    ) ep) AS "existingProgress",
                    COALESCE((SELECT json_agg(json_build_object('subLessonId', lp."subLessonId", 'duration', lp.duration, 'wpm', lp.wpm, 'accuracy', lp.accuracy))
                        FROM "LessonProgress" lp WHERE lp."userId" = u.id AND lp."updatedAt" >= ${today}), '[]'::json) AS "todaysProgress",
                    COALESCE((SELECT json_agg(json_build_object('duration', st.duration, 'wpm', st.wpm, 'accuracy', st.accuracy))
                        FROM "SpeedTestResult" st WHERE st."userId" = u.id AND st."createdAt" >= ${today}), '[]'::json) AS "todaysTests",
                    COALESCE((SELECT json_agg(json_build_object('duration', fs.duration, 'wpm', fs.wpm, 'accuracy', fs.accuracy, 'wordsCount', fs."wordsCount"))
                        FROM "FarmSession" fs WHERE fs."userId" = u.id AND fs."createdAt" >= ${today}), '[]'::json) AS "todaysFarm"
                FROM target_user u
            `,
            getTotalSubLessonsCount(prisma)
        ]);

        const snap = snapshotRows?.[0];
        if (!snap) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        const userId: string = snap.id;
        const userCurrentExp = Number(snap.currentExp || 0);
        const userRank = Number(snap.rank || 1);
        const existingProgress = snap.existingProgress || null;
        const completedLessonsCount = Number(snap.completedLessonsCount || 0);
        const todaysProgress: any[] = Array.isArray(snap.todaysProgress) ? snap.todaysProgress : [];
        const todaysTests: any[] = Array.isArray(snap.todaysTests) ? snap.todaysTests : [];
        const todaysFarm: any[] = Array.isArray(snap.todaysFarm) ? snap.todaysFarm : [];

        const difficultyMultiplier = snap.lessonLevel
            ? (EXP_CONFIG.MULTIPLIER[snap.lessonLevel as keyof typeof EXP_CONFIG.MULTIPLIER] || 1.0)
            : 1.0;

        const prevUpdatedToday = existingProgress?.updatedAt
            ? new Date(existingProgress.updatedAt).getTime() >= today.getTime()
            : false;

        // คำนวณทุกอย่างในหน่วยความจำ (0ms)
        const userRankInfo = calculateRankInfo(userCurrentExp, userRank === 7);
        const rankMul = getRankMultiplierConfig(userRankInfo.rank, userRankInfo.stars).totalBaseMultiplier;

        let baseLessonExp = 0;
        const isFirstClear = !existingProgress || Number(existingProgress.stars || 0) === 0;
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
            const prevWpm = Number(existingProgress.wpm || 0);
            const prevStars = Number(existingProgress.stars || 0);
            const prevAcc = Number(existingProgress.accuracy || 0);
            const prevDur = Number(existingProgress.duration || 0);

            if (wpm > prevWpm || stars > prevStars) {
                baseLessonExp = Math.round(EXP_CONFIG.REPLAY_SCORE * rankMul);
                isNewHighScore = true;
            }
            nextWpm = Math.max(wpm, prevWpm);
            nextAccuracy = Math.max(accuracy, prevAcc);
            nextStars = Math.max(stars, prevStars);
            nextDuration = prevUpdatedToday ? prevDur + duration : duration;
        }

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
        const todayDateKey = toDateKey(new Date());
        const userLastPlayedDateKey = snap.lastPlayedAt ? toDateKey(new Date(snap.lastPlayedAt)) : null;
        if (!userLastPlayedDateKey || userLastPlayedDateKey !== todayDateKey) {
            firstWinBonus = Math.round(EXP_CONFIG.FIRST_WIN_REWARD * rankMul);
        }

        const totalExpGained = baseLessonExp + questBonus + wpmBonus + grinderBonus + firstWinBonus;
        const currentTotalExp = userCurrentExp + totalExpGained;

        let isTop10 = userRank === 7;
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
        } else if (stars > Number(existingProgress?.stars || 0)) {
            starsToAdd = stars - Number(existingProgress?.stars || 0);
        }

        // ⚡ Round-trip 2: บันทึก LessonProgress + อัปเดต User (รวม activeDates ในคำสั่งเดียว!) แค่ 2 query พร้อมกัน
        const nowDate = new Date();
        await Promise.all([
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
            prisma.$executeRaw`
                UPDATE "User"
                SET "currentExp" = "currentExp" + ${totalExpGained},
                    "rank" = ${newRank},
                    "stars" = "stars" + ${starsToAdd},
                    "lastPlayedAt" = ${nowDate},
                    "activeDates" = CASE
                        WHEN ${todayDateKey} = ANY(COALESCE("activeDates", ARRAY[]::text[]))
                        THEN COALESCE("activeDates", ARRAY[]::text[])
                        ELSE array_append(COALESCE("activeDates", ARRAY[]::text[]), ${todayDateKey})
                    END
                WHERE id = ${userId}
            `
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
            totalXP: currentTotalExp,
            rank: newRank
        });

    } catch (error) {
        console.error('Error saving lesson:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
