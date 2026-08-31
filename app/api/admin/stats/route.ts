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
        const [
            totalUsers,
            activeUsersToday,
            newUsersToday,
            lessonsPlayedToday,
            testsPlayedToday,
            totalLessonsCompleted,
            totalTestsCompleted,
            topSpeedToday,
            recentActiveUsers
        ] = await Promise.all([
            // ผู้ใช้ทั้งหมด
            prisma.user.count(),

            // คนเล่นวันนี้ (active วันนี้)
            prisma.user.count({
                where: {
                    lastPlayedAt: { gte: today }
                }
            }),

            // ผู้ใช้ใหม่ที่สมัครวันนี้
            prisma.user.count({
                where: {
                    createdAt: { gte: today }
                }
            }),

            // จำนวนบทเรียนที่ถูกเล่นวันนี้
            prisma.lessonProgress.count({
                where: {
                    updatedAt: { gte: today }
                }
            }),

            // จำนวนการทดสอบ Speed Test วันนี้
            prisma.speedTestResult.count({
                where: {
                    createdAt: { gte: today }
                }
            }),

            // บทเรียนที่เคยเล่นทั้งหมด
            prisma.lessonProgress.count(),

            // Speed Test ที่เคยเล่นทั้งหมด
            prisma.speedTestResult.count(),

            // WPM สูงสุดวันนี้
            prisma.speedTestResult.findFirst({
                where: { createdAt: { gte: today } },
                orderBy: { wpm: 'desc' },
                select: {
                    wpm: true,
                    accuracy: true,
                    duration: true,
                    user: { select: { name: true, username: true } }
                }
            }),

            // ผู้ใช้ที่เข้าเล่นล่าสุด 8 คน
            prisma.user.findMany({
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
            })
        ]);

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
                        userName: topSpeedToday.user.username || topSpeedToday.user.name || "User"
                    } : null
                },
                overall: {
                    totalUsers,
                    totalLessonsCompleted,
                    totalTestsCompleted,
                    totalPlays: totalLessonsCompleted + totalTestsCompleted
                },
                recentActiveUsers
            }
        });

    } catch (error) {
        console.error("Admin stats API error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
