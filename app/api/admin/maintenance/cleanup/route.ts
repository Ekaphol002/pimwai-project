import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/adminAuth';
import { toDateKey } from '@/lib/streakUtils';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!isAdmin(session?.user?.email)) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Admin only' }, { status: 403 });
        }

        const now = new Date();
        const cutoff30Days = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

        // 🛡️ ป้องกันสถิติดีที่สุด (Best Scores): ค้นหาคะแนนสูงสุดของทุกคนในทุกโหมดเวลา เพื่อล็อกไว้ไม่แตะต้องเด็ดขาด
        const allBestScores = await prisma.speedTestResult.findMany({
            orderBy: [{ wpm: 'desc' }, { accuracy: 'desc' }],
            distinct: ['userId', 'duration'],
            select: { id: true }
        });
        const protectedBestScoreIds = allBestScores.map(b => b.id);

        // 1. จัดการ SpeedTestResult: เคลียร์ mistakes ที่เก่าเกิน 30 วันเป็น {} (ยกเว้น Best Scores ห้ามแตะต้อง)
        const speedUpdateResult = await prisma.speedTestResult.updateMany({
            where: {
                createdAt: { lt: cutoff30Days },
                id: { notIn: protectedBestScoreIds },
                NOT: { mistakes: { equals: {} } }
            },
            data: {
                mistakes: {}
            }
        });

        // 2. จัดการ FarmSession: รวมแถวเก่ากว่า 30 วัน ให้เหลือ 1 แถว/วัน/คน
        const oldSessions = await prisma.farmSession.findMany({
            where: { createdAt: { lt: cutoff30Days } },
            select: {
                id: true,
                userId: true,
                duration: true,
                wordsCount: true,
                expEarned: true,
                wpm: true,
                accuracy: true,
                createdAt: true
            },
            orderBy: { createdAt: 'asc' }
        });

        const grouped = new Map<string, typeof oldSessions>();
        for (const s of oldSessions) {
            const dayKey = `${s.userId}_${toDateKey(s.createdAt)}`;
            if (!grouped.has(dayKey)) {
                grouped.set(dayKey, []);
            }
            grouped.get(dayKey)!.push(s);
        }

        let farmSessionsConsolidatedDays = 0;
        let farmSessionsDeleted = 0;

        for (const [, sessions] of grouped.entries()) {
            if (sessions.length <= 1) continue;

            const primary = sessions[0];
            const otherIds = sessions.slice(1).map(s => s.id);

            let totalDuration = 0;
            let totalWords = 0;
            let totalExp = 0;
            let weightedWpm = 0;
            let weightedAcc = 0;

            for (const s of sessions) {
                const dur = Math.max(1, s.duration || 1);
                totalDuration += (s.duration || 0);
                totalWords += (s.wordsCount || 0);
                totalExp += (s.expEarned || 0);
                weightedWpm += (s.wpm || 0) * dur;
                weightedAcc += (s.accuracy !== undefined ? s.accuracy : 100) * dur;
            }

            const avgWpm = totalDuration > 0 ? Math.round(weightedWpm / totalDuration) : 0;
            const avgAcc = totalDuration > 0 ? Math.round(weightedAcc / totalDuration) : 100;

            await prisma.farmSession.update({
                where: { id: primary.id },
                data: {
                    duration: totalDuration,
                    wordsCount: totalWords,
                    expEarned: totalExp,
                    wpm: avgWpm,
                    accuracy: avgAcc
                }
            });
            farmSessionsConsolidatedDays++;

            const delRes = await prisma.farmSession.deleteMany({
                where: { id: { in: otherIds } }
            });
            farmSessionsDeleted += delRes.count;
        }

        return NextResponse.json({
            success: true,
            summary: {
                speedMistakesCleared: speedUpdateResult.count,
                farmSessionsBeforeCount: oldSessions.length,
                farmSessionsConsolidatedDays,
                farmSessionsDeletedRows: farmSessionsDeleted
            }
        });
    } catch (error: any) {
        console.error('Database cleanup error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
