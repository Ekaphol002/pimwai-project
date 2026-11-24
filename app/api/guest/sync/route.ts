import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getRankFromExp } from '@/lib/rankUtils';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const rawGuestExp = Number(body?.guestExp) || 0;
    const safeGuestExp = Math.min(Math.max(0, Math.round(rawGuestExp)), 500000);
    const rawLessons = Array.isArray(body?.lessons) ? body.lessons.slice(0, 250) : [];
    const rawTests = Array.isArray(body?.tests) ? body.tests.slice(0, 30) : [];

    if (safeGuestExp <= 0 && rawLessons.length === 0 && rawTests.length === 0) {
      return NextResponse.json({ success: true, synced: false });
    }

    const cleanEmail = session.user.email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...((session.user as any)?.id ? [{ id: (session.user as any).id }] : []),
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userId = user.id;

    const updatedUser = await prisma.$transaction(async (tx) => {
      let starsToAdd = 0;

      // 1. ซิงค์ความคืบหน้าบทเรียนที่เล่นไว้ตอนเป็น Guest
      for (const item of rawLessons) {
        const subLessonId = typeof item?.subLessonId === 'string' ? item.subLessonId : '';
        if (!subLessonId) continue;

        const wpm = Math.min(250, Math.max(0, Math.round(Number(item.wpm) || 0)));
        const accuracy = Math.min(100, Math.max(0, Math.round(Number(item.accuracy) || 0)));
        const stars = Math.min(3, Math.max(0, Math.round(Number(item.stars) || 0)));
        const duration = Math.min(3600, Math.max(1, Math.round(Number(item.duration) || 10)));

        const subExists = await tx.subLesson.findUnique({
          where: { id: subLessonId },
          select: { id: true },
        });
        if (!subExists) continue;

        const existing = await tx.lessonProgress.findUnique({
          where: { userId_subLessonId: { userId, subLessonId } },
        });

        if (!existing) {
          await tx.lessonProgress.create({
            data: {
              userId,
              subLessonId,
              wpm,
              accuracy,
              stars,
              duration,
              status: 'completed',
            },
          });
          starsToAdd += stars;
        } else {
          if (stars > (existing.stars || 0)) {
            starsToAdd += stars - (existing.stars || 0);
          }
          await tx.lessonProgress.update({
            where: { userId_subLessonId: { userId, subLessonId } },
            data: {
              wpm: Math.max(existing.wpm || 0, wpm),
              accuracy: Math.max(existing.accuracy || 0, accuracy),
              stars: Math.max(existing.stars || 0, stars),
              duration: Math.max(existing.duration || 0, duration),
              status: 'completed',
              updatedAt: new Date(),
            },
          });
        }
      }

      // 2. ซิงค์ประวัติทดสอบความเร็ว (Speed Test) ที่เล่นไว้ตอนเป็น Guest
      for (const t of rawTests) {
        const mins = Number(t?.duration);
        if (![1, 3, 5].includes(mins)) continue;
        const wpm = Math.min(250, Math.max(0, Math.round(Number(t.wpm) || 0)));
        const accuracy = Math.min(100, Math.max(0, Math.round(Number(t.accuracy) || 0)));
        const mistakes = t?.mistakes && typeof t.mistakes === 'object' ? t.mistakes : {};

        await tx.speedTestResult.create({
          data: {
            userId,
            duration: mins,
            wpm,
            accuracy,
            mistakes,
          },
        });
      }

      // 3. ซิงค์ค่า EXP ให้ตรงกับที่สะสมไว้ก่อนล็อกอิน (หรือบวกเพิ่มเข้าบัญชีเดิมหากเคยมีแต้มอยู่แล้ว)
      const currentDbExp = user.currentExp || 0;
      const nextTotalExp = currentDbExp === 0 ? safeGuestExp : currentDbExp + safeGuestExp;

      let isTop10 = false;
      if (nextTotalExp >= 234000) {
        const higherCount = await tx.user.count({
          where: {
            id: { not: userId },
            currentExp: { gt: nextTotalExp },
          },
        });
        isTop10 = higherCount < 10;
      }

      const newRank = getRankFromExp(nextTotalExp, isTop10);

      return tx.user.update({
        where: { id: userId },
        data: {
          currentExp: nextTotalExp,
          rank: newRank,
          ...(starsToAdd > 0 ? { stars: { increment: starsToAdd } } : {}),
          lastPlayedAt: new Date(),
        },
        select: {
          id: true,
          currentExp: true,
          rank: true,
          stars: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      synced: true,
      updatedUser,
    });
  } catch (error) {
    console.error('Error syncing guest progress:', error);
    return NextResponse.json({ success: false, error: 'Failed to sync guest progress' }, { status: 500 });
  }
}
