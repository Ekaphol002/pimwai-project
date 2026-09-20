// app/lessons/page.tsx
import { getServerSession } from "next-auth"; // ✅ เพิ่ม getServerSession
import { authOptions } from "@/lib/auth"; // ✅ Import จาก @/lib/auth

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

  let user: any = null;
  let todaysProgress: any[] = [];
  let todaysSpeedTests: any[] = [];
  let totalSubLessonsCount = 0;
  let userCompletedLessonsCount = 0;
  let higherExpUsersCount = 0;
  let rawLessons: any[] = [];

  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
    }

    const userId = user?.id || null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [prog, tests, subCount, userProgCount, higherCount, lessonsData] = await Promise.all([
      userId ? prisma.lessonProgress.findMany({
        where: { userId: userId, updatedAt: { gte: today } }
      }) : Promise.resolve([]),
      userId ? prisma.speedTestResult.findMany({
        where: { userId: userId, createdAt: { gte: today } }
      }) : Promise.resolve([]),
      prisma.subLesson.count().catch(() => 0),
      userId ? prisma.lessonProgress.count({ where: { userId } }).catch(() => 0) : Promise.resolve(0),
      userId && user ? prisma.user.count({ where: { currentExp: { gt: user.currentExp || 0 } } }).catch(() => 0) : Promise.resolve(0),
      prisma.lesson.findMany({
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
      }).catch(() => [])
    ]);

    todaysProgress = prog || [];
    todaysSpeedTests = tests || [];
    totalSubLessonsCount = subCount || 0;
    userCompletedLessonsCount = userProgCount || 0;
    higherExpUsersCount = higherCount || 0;
    rawLessons = lessonsData || [];
  } catch (error) {
    console.error("LessonsPage data loading error:", error);
  }

  const userId = user?.id || null;

  // คำนวณค่าสถิติจากข้อมูลที่ดึงมา (รวมบทเรียน + โหมดฟาร์ม)
  const dailyTotalLessons = todaysProgress.length + todaysSpeedTests.length;
  const dailyTotalTime = todaysProgress.reduce((sum: number, p: any) => sum + (p.duration || 0), 0) + todaysSpeedTests.reduce((sum: number, t: any) => sum + (t.duration || 0), 0);

  const totalWpmSum = todaysProgress.reduce((sum: number, p: any) => sum + (p.wpm || 0), 0) + todaysSpeedTests.reduce((sum: number, t: any) => sum + (t.wpm || 0), 0);
  const totalAccSum = todaysProgress.reduce((sum: number, p: any) => sum + (p.accuracy || 0), 0) + todaysSpeedTests.reduce((sum: number, t: any) => sum + (t.accuracy || 0), 0);

  const dailyAvgWpm = dailyTotalLessons > 0 ? Math.round(totalWpmSum / dailyTotalLessons) : 0;
  const dailyAvgAcc = dailyTotalLessons > 0 ? Math.round(totalAccSum / dailyTotalLessons) : 0;

  // แปลงเวลาเป็น นาที:วินาที
  const m = Math.floor(dailyTotalTime / 60);
  const s = dailyTotalTime % 60;
  const dailyTimeString = `${m}:${s.toString().padStart(2, '0')}`;

  const isAllLessonsCompleted = userId ? (userCompletedLessonsCount >= totalSubLessonsCount && totalSubLessonsCount > 0) : false;
  const serverRank = userId && user ? higherExpUsersCount + 1 : null;

  // 🌟 เควสรายวัน: ปลดล็อกเควส Tier 2 เมื่อเล่นบทเรียนครบทุกด่าน ทุกระดับ (Beginner, Intermediate, Advanced) แล้ว
  const quests = isAllLessonsCompleted ? [
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
      isCompleted: m >= 5
    },
    {
      id: 2,
      tier: 1,
      text: 'ผ่าน 3 บทเรียน / รอบฝึก',
      current: dailyTotalLessons,
      target: 3,
      unit: 'บทเรียน',
      isCompleted: dailyTotalLessons >= 3
    },
    {
      id: 3,
      tier: 1,
      text: 'ทำความแม่นยำให้ได้ 95%',
      current: dailyAvgAcc,
      target: 95,
      unit: '%',
      isCompleted: dailyTotalLessons > 0 && dailyAvgAcc >= 95
    },
  ];

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
            serverRank={serverRank}
            quests={quests}
            completedQuestsCount={quests.filter(q => q.isCompleted).length}
          />
        </div>

      </div>

    </div>
  );
}