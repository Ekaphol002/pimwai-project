// app/api/admin/stats/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/adminAuth';
import { getStartOfTodayBangkok } from '@/lib/streakUtils';

export const dynamic = 'force-dynamic';

function formatBangkokDateKey(date: Date): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email || !isAdmin(session.user.email)) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }

        const today = getStartOfTodayBangkok();
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);

        const last7DateKeys: string[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000);
            last7DateKeys.push(formatBangkokDateKey(d));
        }

        // Batch 1: Aggregate queries (5 queries max in parallel to stay well within PgBouncer pool limit)
        const [
            userSummaryRows,
            activitySummaryRows,
            rankRows,
            dailyTrendRows,
            topSpeedToday
        ] = await Promise.all([
            prisma.$queryRaw<any[]>`
                SELECT
                    COUNT(*)::int AS total_users,
                    COUNT(*) FILTER (WHERE "lastPlayedAt" >= ${today})::int AS active_today,
                    COUNT(*) FILTER (WHERE "lastPlayedAt" >= ${yesterday} AND "lastPlayedAt" < ${today})::int AS active_yesterday,
                    COUNT(*) FILTER (WHERE "lastPlayedAt" >= ${sevenDaysAgo})::int AS wau,
                    COUNT(*) FILTER (WHERE "lastPlayedAt" >= ${thirtyDaysAgo})::int AS mau,
                    COUNT(*) FILTER (WHERE "createdAt" >= ${today})::int AS new_today,
                    COUNT(*) FILTER (WHERE "createdAt" >= ${sevenDaysAgo})::int AS new_7d,
                    COUNT(*) FILTER (WHERE "createdAt" >= ${thirtyDaysAgo})::int AS new_30d,
                    COALESCE(SUM("currentExp"), 0)::bigint AS total_exp,
                    COALESCE(SUM("farmTimeSeconds"), 0)::bigint AS total_farm_sec
                FROM "User"
            `,
            prisma.$queryRaw<any[]>`
                SELECT
                    (SELECT COUNT(*)::int FROM "LessonProgress") AS total_lessons,
                    (SELECT COUNT(*)::int FROM "LessonProgress" WHERE "updatedAt" >= ${today}) AS lessons_today,
                    (SELECT COUNT(*)::int FROM "SpeedTestResult") AS total_tests,
                    (SELECT COUNT(*)::int FROM "SpeedTestResult" WHERE "createdAt" >= ${today}) AS tests_today,
                    (SELECT COALESCE(ROUND(AVG("wpm")), 0)::int FROM "SpeedTestResult" WHERE "createdAt" >= ${today}) AS avg_wpm_today,
                    (SELECT COALESCE(ROUND(AVG("accuracy")), 0)::int FROM "SpeedTestResult" WHERE "createdAt" >= ${today}) AS avg_acc_today,
                    (SELECT COUNT(*)::int FROM "FarmSession") AS total_farm_rows,
                    (SELECT COALESCE(SUM("wordsCount"), 0)::bigint FROM "FarmSession") AS total_farm_words,
                    (SELECT COALESCE(SUM("expEarned"), 0)::bigint FROM "FarmSession") AS total_farm_exp,
                    (SELECT COALESCE(SUM("duration"), 0)::int FROM "FarmSession" WHERE "createdAt" >= ${today}) AS farm_sec_today,
                    (SELECT COALESCE(SUM("expEarned"), 0)::bigint FROM "FarmSession" WHERE "createdAt" >= ${today}) AS farm_exp_today,
                    (SELECT COALESCE(SUM("wordsCount"), 0)::bigint FROM "FarmSession" WHERE "createdAt" >= ${today}) AS farm_words_today,
                    (SELECT COUNT(DISTINCT "userId")::int FROM "FarmSession" WHERE "createdAt" >= ${today}) AS farm_users_today,
                    (SELECT COUNT(*)::int FROM "Feedback") AS total_feedbacks,
                    (SELECT COUNT(*)::int FROM "Feedback" WHERE "status" = 'pending') AS pending_feedbacks,
                    (SELECT COUNT(*)::int FROM "Report") AS total_reports,
                    (SELECT COUNT(*)::int FROM "Report" WHERE "status" = 'pending') AS pending_reports,
                    (SELECT COUNT(*)::int FROM "CodeSnippet") AS total_snippets
            `,
            prisma.$queryRaw<{ rank: number; count: number }[]>`
                SELECT "rank"::int AS rank, COUNT(*)::int AS count
                FROM "User"
                GROUP BY "rank"
                ORDER BY "rank" ASC
            `,
            prisma.$queryRaw<any[]>`
                WITH days AS (
                    SELECT unnest(${last7DateKeys}::text[]) AS day
                ),
                nu AS (
                    SELECT TO_CHAR("createdAt" AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD') AS day, COUNT(*)::int AS cnt
                    FROM "User" WHERE "createdAt" >= ${sevenDaysAgo} GROUP BY 1
                ),
                st AS (
                    SELECT TO_CHAR("createdAt" AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD') AS day, COUNT(*)::int AS cnt
                    FROM "SpeedTestResult" WHERE "createdAt" >= ${sevenDaysAgo} GROUP BY 1
                ),
                fs AS (
                    SELECT TO_CHAR("createdAt" AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD') AS day,
                           COALESCE(SUM("duration"), 0)::int AS dur,
                           COALESCE(SUM("expEarned"), 0)::bigint AS exp,
                           COUNT(DISTINCT "userId")::int AS users
                    FROM "FarmSession" WHERE "createdAt" >= ${sevenDaysAgo} GROUP BY 1
                ),
                ad AS (
                    SELECT d AS day, COUNT(*)::int AS cnt
                    FROM "User", UNNEST("activeDates") AS d
                    WHERE d >= ${last7DateKeys[0]}
                    GROUP BY 1
                )
                SELECT
                    days.day,
                    COALESCE(nu.cnt, 0)::int AS new_users,
                    COALESCE(st.cnt, 0)::int AS tests_count,
                    COALESCE(fs.dur, 0)::int AS farm_duration,
                    COALESCE(fs.exp, 0)::bigint AS farm_exp,
                    COALESCE(fs.users, 0)::int AS farm_users,
                    COALESCE(ad.cnt, 0)::int AS active_dates_cnt
                FROM days
                LEFT JOIN nu ON nu.day = days.day
                LEFT JOIN st ON st.day = days.day
                LEFT JOIN fs ON fs.day = days.day
                LEFT JOIN ad ON ad.day = days.day
                ORDER BY days.day ASC
            `,
            prisma.speedTestResult.findFirst({
                where: { createdAt: { gte: today } },
                orderBy: { wpm: 'desc' },
                include: { user: { select: { name: true, username: true } } }
            })
        ]);

        // Batch 2: Lists (5 lightweight queries)
        const [
            recentActiveUsers,
            topExpUsers,
            recentNewUsers,
            recentSpeedTests,
            topSpeedAllTime
        ] = await Promise.all([
            prisma.$queryRaw<any[]>`
                SELECT id, name, username, email, image, "currentExp", rank, stars, "farmTimeSeconds", "lastPlayedAt",
                       COALESCE(array_length("activeDates", 1), 0)::int AS "activeDays"
                FROM "User"
                WHERE "lastPlayedAt" IS NOT NULL
                ORDER BY "lastPlayedAt" DESC
                LIMIT 12
            `,
            prisma.$queryRaw<any[]>`
                SELECT id, name, username, email, image, "currentExp", rank, stars, "farmTimeSeconds", "lastPlayedAt",
                       COALESCE(array_length("activeDates", 1), 0)::int AS "activeDays"
                FROM "User"
                ORDER BY "currentExp" DESC
                LIMIT 10
            `,
            prisma.user.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    name: true,
                    username: true,
                    email: true,
                    image: true,
                    currentExp: true,
                    rank: true,
                    createdAt: true,
                    lastPlayedAt: true,
                    accounts: { select: { provider: true } }
                }
            }),
            prisma.speedTestResult.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    user: { select: { name: true, username: true, image: true } }
                }
            }),
            prisma.speedTestResult.findMany({
                orderBy: { wpm: 'desc' },
                take: 5,
                include: {
                    user: { select: { name: true, username: true, image: true } }
                }
            })
        ]);

        const u = userSummaryRows[0] || {};
        const a = activitySummaryRows[0] || {};

        const totalUsers = Number(u.total_users || 0);
        const activeUsersToday = Number(u.active_today || 0);
        const activeUsersYesterday = Number(u.active_yesterday || 0);
        const wau = Number(u.wau || 0);
        const mau = Number(u.mau || 0);

        const rankCountMap = new Map(rankRows.map(r => [Number(r.rank), Number(r.count)]));
        const rankDistribution = [1, 2, 3, 4, 5, 6, 7].map(rank => {
            const count = rankCountMap.get(rank) || 0;
            return {
                rank,
                count,
                percent: totalUsers > 0 ? Math.round((count / totalUsers) * 1000) / 10 : 0
            };
        });

        const dailyTrend = dailyTrendRows.map((row, idx) => {
            const [, mm, dd] = String(row.day).split('-');
            const activeFromDates = Number(row.active_dates_cnt || 0);
            const farmUsers = Number(row.farm_users || 0);
            const isToday = idx === dailyTrendRows.length - 1;
            const activeCount = isToday
                ? Math.max(activeUsersToday, activeFromDates, farmUsers)
                : Math.max(activeFromDates, farmUsers);
            return {
                date: row.day,
                label: `${Number(dd)}/${Number(mm)}`,
                activeUsers: activeCount,
                newUsers: Number(row.new_users || 0),
                testsCount: Number(row.tests_count || 0),
                farmMinutes: Math.round(Number(row.farm_duration || 0) / 60),
                farmExp: Number(row.farm_exp || 0)
            };
        });

        return NextResponse.json({
            success: true,
            generatedAt: new Date().toISOString(),
            stats: {
                today: {
                    activeUsers: activeUsersToday,
                    activeUsersYesterday,
                    newUsers: Number(u.new_today || 0),
                    lessonsPlayed: Number(a.lessons_today || 0),
                    testsPlayed: Number(a.tests_today || 0),
                    totalActions: Number(a.lessons_today || 0) + Number(a.tests_today || 0),
                    avgSpeedWpm: Number(a.avg_wpm_today || 0),
                    avgSpeedAccuracy: Number(a.avg_acc_today || 0),
                    farmActiveUsers: Number(a.farm_users_today || 0),
                    farmTimeSeconds: Number(a.farm_sec_today || 0),
                    farmExp: Number(a.farm_exp_today || 0),
                    farmWords: Number(a.farm_words_today || 0),
                    topSpeed: topSpeedToday ? {
                        wpm: topSpeedToday.wpm,
                        accuracy: topSpeedToday.accuracy,
                        duration: topSpeedToday.duration,
                        userName: topSpeedToday.user?.username || topSpeedToday.user?.name || "User"
                    } : null
                },
                retention: {
                    dau: activeUsersToday,
                    wau,
                    mau,
                    newUsers7d: Number(u.new_7d || 0),
                    newUsers30d: Number(u.new_30d || 0),
                    stickiness: mau > 0 ? Math.round((activeUsersToday / mau) * 100) : 0
                },
                overall: {
                    totalUsers,
                    totalLessonsCompleted: Number(a.total_lessons || 0),
                    totalTestsCompleted: Number(a.total_tests || 0),
                    totalPlays: Number(a.total_lessons || 0) + Number(a.total_tests || 0),
                    totalFarmTimeSeconds: Number(u.total_farm_sec || 0),
                    totalExpSystem: Number(u.total_exp || 0),
                    totalFarmWords: Number(a.total_farm_words || 0),
                    totalFarmExp: Number(a.total_farm_exp || 0),
                    pendingReports: Number(a.pending_reports || 0),
                    pendingFeedbacks: Number(a.pending_feedbacks || 0)
                },
                dailyTrend,
                rankDistribution,
                databaseTables: {
                    users: totalUsers,
                    farmSessions: Number(a.total_farm_rows || 0),
                    lessonProgress: Number(a.total_lessons || 0),
                    speedTestResults: Number(a.total_tests || 0),
                    feedbacks: Number(a.total_feedbacks || 0),
                    reports: Number(a.total_reports || 0),
                    codeSnippets: Number(a.total_snippets || 0)
                },
                recentActiveUsers: recentActiveUsers.map(row => ({
                    ...row,
                    currentExp: Number(row.currentExp || 0),
                    farmTimeSeconds: Number(row.farmTimeSeconds || 0),
                    activeDays: Number(row.activeDays || 0)
                })),
                topExpUsers: topExpUsers.map(row => ({
                    ...row,
                    currentExp: Number(row.currentExp || 0),
                    farmTimeSeconds: Number(row.farmTimeSeconds || 0),
                    activeDays: Number(row.activeDays || 0)
                })),
                recentNewUsers: recentNewUsers.map(row => ({
                    id: row.id,
                    name: row.username || row.name || "User",
                    email: row.email,
                    image: row.image,
                    currentExp: row.currentExp,
                    rank: row.rank,
                    createdAt: row.createdAt,
                    lastPlayedAt: row.lastPlayedAt,
                    provider: row.accounts?.some(acc => acc.provider === 'google') ? 'Google' : 'Email'
                })),
                recentSpeedTests: recentSpeedTests.map(t => ({
                    id: t.id,
                    wpm: t.wpm,
                    accuracy: t.accuracy,
                    duration: t.duration,
                    createdAt: t.createdAt,
                    userName: t.user?.username || t.user?.name || "User",
                    userImage: t.user?.image || null
                })),
                topSpeedAllTime: topSpeedAllTime.map(t => ({
                    id: t.id,
                    wpm: t.wpm,
                    accuracy: t.accuracy,
                    duration: t.duration,
                    createdAt: t.createdAt,
                    userName: t.user?.username || t.user?.name || "User",
                    userImage: t.user?.image || null
                }))
            }
        });

    } catch (error: any) {
        console.error("Admin stats API error:", error);
        return NextResponse.json({
            success: false,
            error: error?.message || "Internal Server Error"
        }, { status: 500 });
    }
}
