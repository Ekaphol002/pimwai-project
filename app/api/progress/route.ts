// app/api/progress/route.ts

export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { toDateKey } from '@/lib/streakUtils';
import { getUserActiveDates } from '@/lib/activeDates';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isSummaryOnly = searchParams.get('summary') === '1';

    // 1. ตรวจสอบ Session
    const session = await getServerSession(authOptions);

    if (!session || (!session.user?.email && !(session.user as any)?.id)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. หา User ตัวจริง (ค้นหาจาก id หรือ email เท่านั้น ป้องกันการแอบอ้าง)
    const userIdFromSession = (session.user as any)?.id;
    const emailFromSession = session.user?.email?.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(userIdFromSession ? [{ id: userIdFromSession }] : []),
          ...(emailFromSession ? [{ email: emailFromSession }] : []),
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const userId = user.id;

    // โหมดดึงเฉพาะวันที่ทำกิจกรรมอย่างรวดเร็วสำหรับ Navbar Streak (อ่านจาก User.activeDates ถาวรเป็นหลัก)
    if (isSummaryOnly) {
      const savedActiveDates = await getUserActiveDates(prisma, userId);
      const dateSet = new Set<string>(savedActiveDates);
      if (user.lastPlayedAt) dateSet.add(toDateKey(user.lastPlayedAt));

      return NextResponse.json({
        success: true,
        activityDates: Array.from(dateSet),
      });
    }

    // =========================================================
    // 1. ดึงข้อมูลจาก Database แบบขนาน (Parallel) และรวม FarmSession ในระดับ SQL เพื่อความเร็วสูงสุด
    // =========================================================
    interface FarmDailyRow {
      d: string;
      total_dur: number;
      weighted_wpm: number;
      weighted_acc: number;
      cnt: number;
    }

    const [lessonProgress, speedTestResults, recentFarmSessions, farmDailyRows, allLessons] = await Promise.all([
      // A. ดึงประวัติการเล่นบทเรียน (Lesson Progress)
      prisma.lessonProgress.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: { subLesson: { include: { lesson: true } } }
      }),
      // B. ดึงประวัติการทดสอบความเร็ว (Speed Test)
      prisma.speedTestResult.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 200
      }),
      // C1. ดึงประวัติฟาร์มล่าสุดแค่ 5 รายการสำหรับ Recent Activity
      prisma.farmSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      // C2. รวมสถิติรายวันของ FarmSession ใน PostgreSQL โดยตรง (ไม่ต้องโหลดหลายพันแถวเข้า Node.js)
      prisma.$queryRaw<FarmDailyRow[]>`
        SELECT
          TO_CHAR((("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bangkok')::date, 'YYYY-MM-DD') AS d,
          COALESCE(SUM(GREATEST(COALESCE(duration, 1), 1)), 0)::int AS total_dur,
          COALESCE(SUM(COALESCE(wpm, 0) * GREATEST(COALESCE(duration, 1), 1)), 0)::double precision AS weighted_wpm,
          COALESCE(SUM(COALESCE(accuracy, 100) * GREATEST(COALESCE(duration, 1), 1)), 0)::double precision AS weighted_acc,
          COUNT(*)::int AS cnt
        FROM "FarmSession"
        WHERE "userId" = ${userId}
        GROUP BY 1
      `,
      // D. ดึงโครงสร้างบทเรียนทั้งหมด
      prisma.lesson.findMany({
        include: { subLessons: true },
        orderBy: { order: 'asc' }
      })
    ]);

    // =========================================================
    // 2. คำนวณ Global Stats (✅ แก้ตรงนี้: เอาเฉพาะ Lesson)
    // =========================================================

    // คำนวณเฉพาะจาก "บทเรียน" (ไม่รวม Speed Test)
    const totalLessonItems = lessonProgress.length;

    const totalStars = lessonProgress.reduce((sum, item) => sum + item.stars, 0);

    // ✅ คำนวณเวลาเฉพาะที่เล่นบทเรียน
    const totalDurationSeconds = lessonProgress.reduce((sum, item) => sum + item.duration, 0);

    // ✅ คำนวณความเร็วเฉลี่ยเฉพาะบทเรียน
    const avgSpeed = totalLessonItems > 0
      ? Math.round(lessonProgress.reduce((sum, item) => sum + item.wpm, 0) / totalLessonItems)
      : 0;

    // ✅ คำนวณความแม่นยำเฉลี่ยเฉพาะบทเรียน
    const avgAccuracy = totalLessonItems > 0
      ? Math.round(lessonProgress.reduce((sum, item) => sum + item.accuracy, 0) / totalLessonItems)
      : 0;

    // แปลงเวลาเป็น String (เช่น "12h 45m")
    const hours = Math.floor(totalDurationSeconds / 3600);
    const minutes = Math.floor((totalDurationSeconds % 3600) / 60);
    // ถ้าเวลาน้อยกว่า 1 นาที ให้โชว์วินาที หรือ < 1m
    let timeSpentStr = "0m";
    if (hours > 0) timeSpentStr = `${hours}h ${minutes}m`;
    else if (minutes > 0) timeSpentStr = `${minutes}m`;
    else if (totalDurationSeconds > 0) timeSpentStr = `< 1m`;

    // คำนวณเวลาฟาร์มสะสม (Farm Playtime)
    const farmSeconds = user.farmTimeSeconds || 0;
    const farmHours = Math.floor(farmSeconds / 3600);
    const farmMinutes = Math.floor((farmSeconds % 3600) / 60);
    let farmTimeStr = "0m";
    if (farmHours > 0) farmTimeStr = `${farmHours}h ${farmMinutes}m`;
    else if (farmMinutes > 0) farmTimeStr = `${farmMinutes}m`;
    else if (farmSeconds > 0) farmTimeStr = `< 1m`;

    // =========================================================
    // 3. เตรียมข้อมูลสำหรับ Graph และ Widgets (รวมทั้ง Lesson, Speed Test และ Farm)
    // =========================================================

    const recentCandidates = [
      ...lessonProgress.slice(0, 5).map(l => ({ ...l, type: 'lesson', date: l.updatedAt })),
      ...speedTestResults.slice(0, 5).map(s => ({ ...s, type: 'test', date: s.createdAt, stars: 0 })),
      ...recentFarmSessions.map(f => ({ ...f, type: 'farm', date: f.createdAt, stars: 0 }))
    ];
    recentCandidates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // วันที่ที่มีกิจกรรม (สำหรับ Activity Graph และระบบ Streak / ไฟ 🔥) รวม User.activeDates ถาวรและ lastPlayedAt เสมอ
    const savedActiveDates = await getUserActiveDates(prisma, userId);
    const activityDateSet = new Set<string>(savedActiveDates);
    const dailyStatsMap: Record<string, { duration: number; weightedWpm: number; weightedAcc: number; count: number }> = {};

    const addDailyPoint = (dKey: string, dur: number, wpm: number, acc: number, cnt: number = 1) => {
      if (!dKey) return;
      activityDateSet.add(dKey);
      if (!dailyStatsMap[dKey]) {
        dailyStatsMap[dKey] = { duration: 0, weightedWpm: 0, weightedAcc: 0, count: 0 };
      }
      dailyStatsMap[dKey].duration += dur;
      dailyStatsMap[dKey].weightedWpm += wpm * dur;
      dailyStatsMap[dKey].weightedAcc += acc * dur;
      dailyStatsMap[dKey].count += cnt;
    };

    for (const l of lessonProgress) {
      addDailyPoint(toDateKey(l.updatedAt), l.duration || 1, l.wpm || 0, l.accuracy !== undefined ? l.accuracy : 100);
    }
    for (const s of speedTestResults) {
      const durSec = (s.duration || 1) < 10 ? (s.duration || 1) * 60 : (s.duration || 1);
      addDailyPoint(toDateKey(s.createdAt), durSec, s.wpm || 0, s.accuracy !== undefined ? s.accuracy : 100);
    }
    for (const f of farmDailyRows) {
      if (!f.d) continue;
      activityDateSet.add(f.d);
      if (!dailyStatsMap[f.d]) {
        dailyStatsMap[f.d] = { duration: 0, weightedWpm: 0, weightedAcc: 0, count: 0 };
      }
      dailyStatsMap[f.d].duration += Number(f.total_dur) || 0;
      dailyStatsMap[f.d].weightedWpm += Number(f.weighted_wpm) || 0;
      dailyStatsMap[f.d].weightedAcc += Number(f.weighted_acc) || 0;
      dailyStatsMap[f.d].count += Number(f.cnt) || 1;
    }

    if (user.lastPlayedAt) {
      activityDateSet.add(toDateKey(user.lastPlayedAt));
    }
    const activityDates = Array.from(activityDateSet);

    const dailyStats: Record<string, { wpm: number; accuracy: number; duration: number }> = {};
    for (const [dKey, val] of Object.entries(dailyStatsMap)) {
      dailyStats[dKey] = {
        wpm: val.duration > 0 ? Math.round(val.weightedWpm / val.duration) : 0,
        accuracy: val.duration > 0 ? Math.round(val.weightedAcc / val.duration) : 100,
        duration: val.duration
      };
    }

    // 5 รายการล่าสุด (สำหรับ Recent Activity Widget)
    const recentActivity = recentCandidates.slice(0, 5).map(item => {
      let title = "";
      if (item.type === 'lesson') {
        const lessonTitle = (item as any)?.subLesson?.lesson?.title || 'บทเรียน';
        const subTitle = (item as any)?.subLesson?.title || '';
        title = subTitle ? `${lessonTitle} - ${subTitle}` : lessonTitle;
      } else if (item.type === 'farm') {
        title = `โหมดฟาร์ม (Farm Mode)`;
      } else {
        title = `Speed Test (${Math.ceil(((item as any)?.duration || 60) / 60)} min)`;
      }
      return {
        id: item.id,
        type: item.type,
        title: title,
        wpm: (item as any).wpm || 0,
        accuracy: (item as any).accuracy || 100,
        stars: (item as any).stars || 0,
        date: item.date
      };
    });

    // =========================================================
    // 4. คำนวณ Course Progress (สำหรับ LessonList)
    // =========================================================

    const completedSubLessonIds = new Set(lessonProgress.map(p => p.subLessonId));

    const courseProgress = allLessons.map(lesson => {
      const relevantProgress = lessonProgress.filter(p =>
        lesson.subLessons.some(sub => sub.id === p.subLessonId)
      );

      const totalSubLessons = lesson.subLessons.length;
      const completedCount = lesson.subLessons.filter(sub => completedSubLessonIds.has(sub.id)).length;

      let totalLessonWpm = 0;
      let totalLessonAcc = 0;
      let totalLessonTime = 0;

      if (relevantProgress.length > 0) {
        totalLessonWpm = relevantProgress.reduce((sum, p) => sum + p.wpm, 0);
        totalLessonAcc = relevantProgress.reduce((sum, p) => sum + p.accuracy, 0);
        totalLessonTime = relevantProgress.reduce((sum, p) => sum + p.duration, 0);
      }

      const avgLessonSpeed = relevantProgress.length > 0 ? Math.round(totalLessonWpm / relevantProgress.length) : 0;
      const avgLessonAcc = relevantProgress.length > 0 ? Math.round(totalLessonAcc / relevantProgress.length) : 0;
      const totalLessonStars = relevantProgress.reduce((sum, p) => sum + p.stars, 0);

      return {
        id: lesson.id,
        title: lesson.title,
        level: lesson.level,
        completedCount,
        totalSubLessons,
        avgSpeed: avgLessonSpeed,
        avgAcc: avgLessonAcc,
        time: totalLessonTime,
        stars: totalLessonStars
      };
    });

    // =========================================================
    // 5. ส่ง Response กลับไป
    // =========================================================
    return NextResponse.json({
      success: true,
      stats: {
        totalStars,
        avgSpeed,    // ✅ มาจาก Lesson เท่านั้น
        avgAccuracy, // ✅ มาจาก Lesson เท่านั้น
        timeSpent: timeSpentStr, // ✅ มาจาก Lesson เท่านั้น
        farmTimeSeconds: farmSeconds, // ✅ เวลาฟาร์ม (วินาที)
        farmTimeSpent: farmTimeStr // ✅ เวลาฟาร์มในรูปแบบ String เช่น "1h 25m"
      },
      activityDates,
      dailyStats,
      recentActivity,
      courseProgress
    });

  } catch (error) {
    console.error('Progress API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}