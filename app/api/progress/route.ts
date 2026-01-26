// app/api/progress/route.ts

export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    // 1. ตรวจสอบ Session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. หา User ตัวจริง
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const userId = user.id;

    // =========================================================
    // 1. ดึงข้อมูลจาก Database
    // =========================================================

    // A. ดึงประวัติการเล่นบทเรียน (Lesson Progress)
    const lessonProgress = await prisma.lessonProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { subLesson: { include: { lesson: true } } }
    });

    // B. ดึงประวัติการทดสอบความเร็ว (Speed Test)
    const speedTestResults = await prisma.speedTestResult.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // C. ดึงโครงสร้างบทเรียนทั้งหมด
    const allLessons = await prisma.lesson.findMany({
      include: { subLessons: true },
      orderBy: { order: 'asc' }
    });

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

    // =========================================================
    // 3. เตรียมข้อมูลสำหรับ Graph และ Widgets (อันนี้รวมได้ปกติ)
    // =========================================================

    const allActivities = [
      ...lessonProgress.map(l => ({ ...l, type: 'lesson', date: l.updatedAt })),
      ...speedTestResults.map(s => ({ ...s, type: 'test', date: s.createdAt, stars: 0 }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // วันที่ที่มีกิจกรรม (สำหรับ Activity Graph)
    const activityDates = allActivities.map(item => new Date(item.date).toISOString().split('T')[0]);

    // 5 รายการล่าสุด (สำหรับ Recent Activity Widget)
    const recentActivity = allActivities.slice(0, 5).map(item => {
      let title = "";
      if (item.type === 'lesson') {
        // @ts-ignore
        title = `${item.subLesson.lesson.title} - ${item.subLesson.title}`;
      } else {
        // @ts-ignore
        title = `Speed Test (${Math.ceil(item.duration / 60)} min)`;
      }
      return {
        id: item.id,
        type: item.type,
        title: title,
        wpm: item.wpm,
        accuracy: item.accuracy,
        stars: item.stars,
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
        timeSpent: timeSpentStr // ✅ มาจาก Lesson เท่านั้น
      },
      activityDates,
      recentActivity,
      courseProgress
    });

  } catch (error) {
    console.error('Progress API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}