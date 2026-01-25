// app/lessons/page.tsx
import { getServerSession } from "next-auth"; // ✅ เพิ่ม getServerSession
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // ✅ ต้อง Import authOptions ให้ถูก path

import LessonMenuBar from '@/components/LessonMenuBar/LessonMenuBar';
import LessonList from '@/components/LessonList/LessonList';
import TodayStats from '@/components/TodayStats/TodayStats';
import { prisma } from '@/lib/prisma';

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

  // 2. เอา Email ไปหา User ID ใน Database
  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email! }
  });

  if (!user) {
    return <div>ไม่พบข้อมูลผู้ใช้</div>;
  }

  // ✅ ได้ ID จริงมาใช้งานแล้ว!
  const userId = user.id;

  // =========================================================
  // ส่วนคำนวณสถิติ (ปรับปรุงเล็กน้อยเพราะเราได้ตัวแปร user มาแล้วข้างบน)
  // =========================================================

  // 2. ดึงสถิติวันนี้
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysProgress = await prisma.lessonProgress.findMany({
    where: { userId: userId, updatedAt: { gte: today } }
  });

  // คำนวณค่าสถิติจากข้อมูลที่ดึงมา
  const dailyTotalLessons = todaysProgress.length;
  const dailyTotalTime = todaysProgress.reduce((sum, p) => sum + p.duration, 0);

  const dailyAvgWpm = dailyTotalLessons > 0
    ? Math.round(todaysProgress.reduce((sum, p) => sum + p.wpm, 0) / dailyTotalLessons)
    : 0;

  const dailyAvgAcc = dailyTotalLessons > 0
    ? Math.round(todaysProgress.reduce((sum, p) => sum + p.accuracy, 0) / dailyTotalLessons)
    : 0;

  // แปลงเวลาเป็น นาที:วินาที
  const m = Math.floor(dailyTotalTime / 60);
  const s = dailyTotalTime % 60;
  const dailyTimeString = `${m}:${s.toString().padStart(2, '0')}`;

  const quests = [
    {
      id: 1,
      text: 'พิมพ์ให้ครบ 5 นาที',
      current: m,
      target: 5,
      unit: 'นาที',
      isCompleted: m >= 5
    },
    {
      id: 2,
      text: 'ผ่าน 3 บทเรียน',
      current: dailyTotalLessons,
      target: 3,
      unit: 'บทเรียน',
      isCompleted: dailyTotalLessons >= 3
    },
    {
      id: 3,
      text: 'ทำความแม่นยำให้ได้ 95%',
      current: dailyAvgAcc,
      target: 95,
      unit: '%',
      isCompleted: dailyTotalLessons > 0 && dailyAvgAcc >= 95
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
          userProgress: {
            where: { userId: userId } // ใช้ userId ของจริงที่ได้มา
          }
        }
      }
    }
  });

  // แปลงข้อมูล (Transform Data)
  const lessons = rawLessons.map(lesson => {
    const transformedSubLessons = lesson.subLessons.map(sub => {
      const progress = sub.userProgress[0];

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

  return (
    <div className="flex flex-col w-full max-w-screen-2xl mx-auto mb-10">

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
            rank={user.rank} // ใช้ user ตัวจริงที่ดึงมาด้านบน
            exp={user.currentExp}
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