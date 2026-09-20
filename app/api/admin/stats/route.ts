// app/api/admin/stats/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email || !isAdmin(session.user.email)) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }

        // วันนี้ (00:00:00)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. สถิติผู้ใช้งานรายวัน & ทั้งหมด
        const totalUsers = await prisma.user.count().catch(() => 0);
        const activeUsersToday = await prisma.user.count({
            where: { lastPlayedAt: { gte: today } }
        }).catch(() => 0);
        const newUsersToday = await prisma.user.count({
            where: { createdAt: { gte: today } }
        }).catch(() => 0);
        const lessonsPlayedToday = await prisma.lessonProgress.count({
            where: { updatedAt: { gte: today } }
        }).catch(() => 0);
        const testsPlayedToday = await prisma.speedTestResult.count({
            where: { createdAt: { gte: today } }
        }).catch(() => 0);
        const totalLessonsCompleted = await prisma.lessonProgress.count().catch(() => 0);
        const totalTestsCompleted = await prisma.speedTestResult.count().catch(() => 0);

        let topSpeedToday = null;
        try {
            topSpeedToday = await prisma.speedTestResult.findFirst({
                where: { createdAt: { gte: today } },
                orderBy: { wpm: 'desc' },
                include: {
                    user: { select: { name: true, username: true } }
                }
            });
        } catch (e) {
            console.error("topSpeedToday query error:", e);
        }

        let recentActiveUsers: any[] = [];
        try {
            recentActiveUsers = await prisma.user.findMany({
                where: { lastPlayedAt: { not: null } },
                orderBy: { lastPlayedAt: 'desc' },
                take: 8,
                select: {
                    id: true,
                    name: true,
                    username: true,
                    image: true,
                    currentExp: true,
                    rank: true,
                    lastPlayedAt: true
                }
            });
        } catch (e) {
            console.error("recentActiveUsers query error:", e);
        }

        return NextResponse.json({
            success: true,
            stats: {
                today: {
                    activeUsers: activeUsersToday,
                    newUsers: newUsersToday,
                    lessonsPlayed: lessonsPlayedToday,
                    testsPlayed: testsPlayedToday,
                    totalActions: lessonsPlayedToday + testsPlayedToday,
                    topSpeed: topSpeedToday ? {
                        wpm: topSpeedToday.wpm,
                        accuracy: topSpeedToday.accuracy,
                        duration: topSpeedToday.duration,
                        userName: topSpeedToday.user?.username || topSpeedToday.user?.name || "User"
                    } : null
                },
                overall: {
                    totalUsers,
                    totalLessonsCompleted,
                    totalTestsCompleted,
                    totalPlays: totalLessonsCompleted + totalTestsCompleted
                },
                recentActiveUsers: recentActiveUsers || []
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
