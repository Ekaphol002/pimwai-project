// app/lessons/page.tsx
import { getServerSession } from "next-auth"; // ✅ เพิ่ม getServerSession
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // ✅ ต้อง Import authOptions ให้ถูก path

import LessonMenuBar from '@/components/LessonMenuBar/LessonMenuBar';
import LessonList from '@/components/LessonList/LessonList';
import TodayStats from '@/components/TodayStats/TodayStats';
import WelcomeModal from '@/components/WelcomeModal/WelcomeModal';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LessonsPage({ searchParams }: PageProps) {
  // 1. รอรับค่า level จาก URL
  const resolvedSearchParams = await searchParams;
  const selectedLevel = (resolvedSearchParams?.level as string) || 'beginner';

  // =========================================================
  // ✅ ส่วนที่แก้ไข: ดึง User ID จริงจาก Session
  // =========================================================

  // 1. เช็ค Session
  const session = await getServerSession(authOptions);
  let user = null;
  if (session?.user?.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
  }

  // ID จริงของผู้ใช้ หรือ null สำหรับ Guest/Googlebot
  const userId = user?.id || null;

  // =========================================================
  // ส่วนคำนวณสถิติ (สำหรับคนที่ล็อกอินแล้ว)
  // =========================================================

  // 2. ดึงสถิติวันนี้ (รวมทั้งบทเรียน และโหมดฟาร์ม/ทดสอบความเร็ว)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todaysProgress, todaysSpeedTests] = await Promise.all([
    userId ? prisma.lessonProgress.findMany({
      where: { userId: userId, updatedAt: { gte: today } }
    }) : [],
    userId ? prisma.speedTestResult.findMany({
      where: { userId: userId, createdAt: { gte: today } }
    }) : []
  ]);

  // คำนวณค่าสถิติจากข้อมูลที่ดึงมา (รวมบทเรียน + โหมดฟาร์ม)
  const dailyTotalLessons = todaysProgress.length + todaysSpeedTests.length;
  const dailyTotalTime = todaysProgress.reduce((sum, p) => sum + p.duration, 0) + todaysSpeedTests.reduce((sum, t) => sum + t.duration, 0);

  const totalWpmSum = todaysProgress.reduce((sum, p) => sum + p.wpm, 0) + todaysSpeedTests.reduce((sum, t) => sum + t.wpm, 0);
  const totalAccSum = todaysProgress.reduce((sum, p) => sum + p.accuracy, 0) + todaysSpeedTests.reduce((sum, t) => sum + t.accuracy, 0);

  const dailyAvgWpm = dailyTotalLessons > 0 ? Math.round(totalWpmSum / dailyTotalLessons) : 0;
  const dailyAvgAcc = dailyTotalLessons > 0 ? Math.round(totalAccSum / dailyTotalLessons) : 0;

  // แปลงเวลาเป็น นาที:วินาที
  const m = Math.floor(dailyTotalTime / 60);
  const s = dailyTotalTime % 60;
  const dailyTimeString = `${m}:${s.toString().padStart(2, '0')}`;

  // 🎯 ตรวจสอบว่าสำเร็จเควส Tier 1 ทั้งหมดหรือยัง (พิมพ์ 5 นาที, 3 รอบฝึก, แม่นยำ 95%)
  const isTier1_TimeDone = m >= 5;
  const isTier1_LessonsDone = dailyTotalLessons >= 3;
  const isTier1_AccDone = dailyTotalLessons > 0 && dailyAvgAcc >= 95;
  const isTier1Completed = isTier1_TimeDone && isTier1_LessonsDone && isTier1_AccDone;

  // 🌟 ถ้าสำเร็จ Tier 1 ครบทุกข้อ ➔ ปลดล็อกเควสระดับ 2 (Tier 2 Quests) ทันที!
  const quests = isTier1Completed ? [
    {
      id: 101,
      tier: 2,
      text: 'พิมพ์สะสมครบ 10 นาที',
      current: m,
      target: 10,
      unit: 'นาที',
      isCompleted: m >= 10
    },
    {
      id: 102,
      tier: 2,
      text: 'ผ่าน 5 บทเรียน / รอบฝึก',
      current: dailyTotalLessons,
      target: 5,
      unit: 'รอบ',
      isCompleted: dailyTotalLessons >= 5
    },
    {
      id: 103,
      tier: 2,
      text: 'ทำความเร็วให้ได้ 25+ WPM',
      current: dailyAvgWpm,
      target: 25,
      unit: 'WPM',
      isCompleted: dailyAvgWpm >= 25
    }
  ] : [
    {
      id: 1,
      tier: 1,
      text: 'พิมพ์ให้ครบ 5 นาที',
      current: m,
      target: 5,
      unit: 'นาที',
      isCompleted: isTier1_TimeDone
    },
    {
      id: 2,
      tier: 1,
      text: 'ผ่าน 3 บทเรียน',
      current: dailyTotalLessons,
      target: 3,
      unit: 'บทเรียน',
      isCompleted: isTier1_LessonsDone
    },
    {
      id: 3,
      tier: 1,
      text: 'ทำความแม่นยำให้ได้ 95%',
      current: dailyAvgAcc,
      target: 95,
      unit: '%',
      isCompleted: isTier1_AccDone
    },
  ];

  // =========================================================
  // ส่วนเดิมของคุณ (ดึงบทเรียน)
  // =========================================================

  // ดึงข้อมูลบทเรียน + userProgress
  const rawLessons = await prisma.lesson.findMany({
    where: { level: selectedLevel },
    orderBy: { order: 'asc' },
    include: {
      subLessons: {
        orderBy: { order: 'asc' },
        include: {
          userProgress: userId ? {
            where: { userId: userId }
          } : false
        }
      }
    }
  });

  // แปลงข้อมูล (Transform Data)
  const lessons = rawLessons.map(lesson => {
    const transformedSubLessons = lesson.subLessons.map(sub => {
      const progress = sub.userProgress?.[0];

      return {
        id: sub.id,
        title: sub.title,
        status: progress ? 'completed' : 'not_started',
        stars: progress?.stars || 0,
        wpm: progress?.wpm || 0,
        acc: progress?.accuracy || 0,
        duration: progress?.duration || 0
      };
    });

    const isAllCompleted = transformedSubLessons.every(s => s.status === 'completed');
    const isSomeCompleted = transformedSubLessons.some(s => s.status === 'completed');

    let unitStatus = 'start';
    if (isAllCompleted) unitStatus = 'completed';
    else if (isSomeCompleted) unitStatus = 'resume';

    const playedSubLessons = transformedSubLessons.filter(s => s.status === 'completed');

    const avgSpeed = playedSubLessons.length > 0
      ? Math.round(playedSubLessons.reduce((sum, s) => sum + s.wpm, 0) / playedSubLessons.length)
      : 0;

    const avgAcc = playedSubLessons.length > 0
      ? Math.round(playedSubLessons.reduce((sum, s) => sum + s.acc, 0) / playedSubLessons.length)
      : 0;

    const totalSeconds = playedSubLessons.reduce((sum, s) => sum + s.duration, 0);

    let timeString = undefined;
    if (totalSeconds > 0) {
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;
      timeString = m > 0 ? `${m}m ${s}s` : `${s}s`;
    }

    return {
      id: lesson.id,
      order: lesson.order,
      title: lesson.title,
      status: unitStatus,
      avgSpeed: avgSpeed > 0 ? `${avgSpeed}` : undefined,
      avgAcc: avgAcc > 0 ? `${avgAcc}%` : undefined,
      time: timeString,
      subLessons: transformedSubLessons
    };
  });

  // =========================================================
  // ✅ ตรวจสอบว่าเป็น user ใหม่หรือไม่ (ไม่เคยเล่นเลย)
  // =========================================================
  const isNewUser = user ? user.lastPlayedAt === null : false;

  // หา URL ด่านแรก (beginner lesson 1, sub-lesson แรก)
  const firstLesson = rawLessons[0];
  const firstSubLesson = firstLesson?.subLessons[0];
  const firstLessonUrl = firstSubLesson
    ? `/lesson/${firstLesson.id}/${firstSubLesson.id}`
    : '/lessons';

  return (
    <div className="flex flex-col w-full max-w-screen-2xl mx-auto mb-10">

      {/* Welcome Modal สำหรับ user ใหม่ */}
      {isNewUser && (
        <WelcomeModal
          userName={user?.name || undefined}
          firstLessonUrl={firstLessonUrl}
        />
      )}

      <LessonMenuBar
        selectedLevel={selectedLevel}
        quests={quests}
      />

      <div className="flex">

        <div className="container mx-auto space-y-8">
          <LessonList
            title={`แบบฝึกหัด - ${selectedLevel === 'beginner' ? 'ระดับเริ่มต้น' : selectedLevel === 'intermediate' ? 'ระดับกลาง' : 'ระดับสูง'}`}
            lessons={lessons} // TypeScript อาจจะบ่นตรงนี้ ถ้า Type ไม่ตรงเป๊ะ แต่ Logic ถูกแล้ว
          />
        </div>

        <div className="w-120 flex-shrink-0 hidden lg:block mr-6">
          <TodayStats
            rank={user?.rank || 1}
            exp={user?.currentExp || 0}
            dailyWpm={dailyAvgWpm}
            dailyAcc={dailyAvgAcc}
            dailyTime={dailyTimeString}
            quests={quests}
            completedQuestsCount={quests.filter(q => q.isCompleted).length}
          />
        </div>

      </div>

    </div>
  );
}