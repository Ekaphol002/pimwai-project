// app/lessons/page.tsx
import { getServerSession } from "next-auth"; // ✅ เพิ่ม getServerSession
import { authOptions } from "@/lib/auth"; // ✅ Import จาก @/lib/auth

import LessonMenuBar from '@/components/LessonMenuBar/LessonMenuBar';
import LessonList from '@/components/LessonList/LessonList';
import TodayStats from '@/components/TodayStats/TodayStats';
import WelcomeModal from '@/components/WelcomeModal/WelcomeModal';
import { prisma } from '@/lib/prisma';
import { getStartOfTodayBangkok } from '@/lib/streakUtils';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// แคชโครงสร้างบทเรียน (Static Catalog) ไว้ในหน่วยความจำของเซิร์ฟเวอร์ เพื่อไม่ต้องดึง SubLesson กว่า 231 ด่านซ้ำทุกครั้งที่กดเมนู
const globalLessonCache = globalThis as unknown as {
  lessonsCatalog?: { data: any[]; totalSubLessons: number; fetchedAt: number };
};

async function getCachedLessonsCatalog() {
  const now = Date.now();
  if (
    globalLessonCache.lessonsCatalog &&
    now - globalLessonCache.lessonsCatalog.fetchedAt < 10 * 60 * 1000
  ) {
    return globalLessonCache.lessonsCatalog;
  }

  const allLessons = await prisma.lesson.findMany({
    orderBy: { order: 'asc' },
    include: {
      subLessons: {
        orderBy: { order: 'asc' },
        select: { id: true, title: true, order: true, lessonId: true }
      }
    }
  });

  const totalSubLessons = allLessons.reduce((acc, l) => acc + (l.subLessons?.length || 0), 0);
  globalLessonCache.lessonsCatalog = {
    data: allLessons,
    totalSubLessons,
    fetchedAt: now
  };
  return globalLessonCache.lessonsCatalog;
}

export default async function LessonsPage({ searchParams }: PageProps) {
  const [session, resolvedSearchParams, catalog] = await Promise.all([
    getServerSession(authOptions).catch(() => null),
    searchParams,
    getCachedLessonsCatalog().catch(() => ({ data: [], totalSubLessons: 0 }))
  ]);

  // 1. ดึง User อย่างรวดเร็ว
  let user: any = null;
  let userId: string | null = (session?.user as any)?.id || null;

  try {
    const sessionEmail = session?.user?.email;
    const sessionName = session?.user?.name;

    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }
    if (!user && (sessionEmail || sessionName)) {
      const searchConditions = [];
      if (sessionEmail) searchConditions.push({ email: sessionEmail });
      if (sessionName) searchConditions.push({ username: sessionName }, { name: sessionName });
      if (searchConditions.length > 0) {
        user = await prisma.user.findFirst({ where: { OR: searchConditions } });
      }
    }
    userId = user?.id || userId || null;
  } catch (err) {
    console.error("Session lookup error in LessonsPage:", err);
  }

  // 2. ดึงความคืบหน้าและสถิติทั้งหมดของผู้ใช้ในครั้งเดียว (1 Parallel Batch แทนที่จะรอ 4 รอบ)
  let allUserProgress: any[] = [];
  let todaysSpeedTests: any[] = [];
  let todaysFarmSessions: any[] = [];
  let higherExpUsersCount = 0;
  const today = getStartOfTodayBangkok();

  if (userId) {
    try {
      const [userProgList, tests, farm, higherCount] = await Promise.all([
        prisma.lessonProgress.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' }
        }).catch(() => []),
        prisma.speedTestResult.findMany({
          where: { userId, createdAt: { gte: today } }
        }).catch(() => []),
        prisma.farmSession.findMany({
          where: { userId, createdAt: { gte: today } }
        }).catch(() => []),
        user?.currentExp !== undefined
          ? prisma.user.count({ where: { currentExp: { gt: user.currentExp || 0 } } }).catch(() => 0)
          : Promise.resolve(0)
      ]);

      allUserProgress = userProgList || [];
      todaysSpeedTests = tests || [];
      todaysFarmSessions = farm || [];
      higherExpUsersCount = higherCount || 0;
    } catch (err) {
      console.error("Stats lookup error in LessonsPage:", err);
    }
  }

  // สร้าง Map ของความคืบหน้าแต่ละด่านย่อย และหาด่านล่าสุดที่เล่น
  const progressBySubLessonId = new Map<string, any>();
  for (const p of allUserProgress) {
    progressBySubLessonId.set(p.subLessonId, p);
  }

  // ตรวจสอบระดับที่ผู้ใช้เล่นค้างไว้อัตโนมัติ (Auto-detect level) โดยไม่ต้องยิง Query ซ้ำ
  let selectedLevel = (resolvedSearchParams?.level as string) || null;
  if (!selectedLevel) {
    if (allUserProgress.length > 0 && catalog.data.length > 0) {
      const latestSubId = allUserProgress[0].subLessonId;
      const matchedLesson = catalog.data.find((l: any) =>
        l.subLessons?.some((s: any) => s.id === latestSubId)
      );
      if (matchedLesson?.level && ['beginner', 'intermediate', 'advanced'].includes(matchedLesson.level)) {
        selectedLevel = matchedLesson.level;
      }
    }
    if (!selectedLevel) {
      selectedLevel = 'beginner';
    }
  }

  // 3. ประกอบข้อมูลบทเรียนของระดับที่เลือกจาก Cache + Progress Map
  const rawLessons = catalog.data
    .filter((l: any) => l.level === selectedLevel)
    .map((l: any) => ({
      ...l,
      subLessons: (l.subLessons || []).map((s: any) => {
        const prog = progressBySubLessonId.get(s.id);
        return {
          ...s,
          userProgress: prog ? [prog] : []
        };
      })
    }));

  // 4. กรองสถิติรายวันจากข้อมูลที่ดึงมาแล้ว
  const todaysProgress = allUserProgress.filter(
    (p: any) => new Date(p.updatedAt).getTime() >= today.getTime()
  );
  const totalSubLessonsCount = catalog.totalSubLessons;
  const userCompletedLessonsCount = allUserProgress.length;

  // คำนวณค่าสถิติจากข้อมูลที่ดึงมา (รวมบทเรียน + โหมดฟาร์ม โดยไม่รบกวนประวัติทดสอบ)
  let totalDuration = 0;
  let weightedWpmSum = 0;
  let weightedAccSum = 0;
  let activeActivitiesCount = todaysProgress.length + todaysSpeedTests.length;

  for (const p of todaysProgress) {
    const dur = p.duration || 1;
    totalDuration += dur;
    weightedWpmSum += (p.wpm || 0) * dur;
    weightedAccSum += (p.accuracy !== undefined ? p.accuracy : 100) * dur;
  }

  for (const t of todaysSpeedTests) {
    const dur = t.duration || 1;
    totalDuration += dur;
    weightedWpmSum += (t.wpm || 0) * dur;
    weightedAccSum += (t.accuracy !== undefined ? t.accuracy : 100) * dur;
  }

  for (const f of todaysFarmSessions) {
    const dur = f.duration || 1;
    totalDuration += dur;
    weightedWpmSum += (f.wpm || 0) * dur;
    weightedAccSum += (f.accuracy !== undefined ? f.accuracy : 100) * dur;
  }

  if (todaysFarmSessions.length > 0) {
    activeActivitiesCount += 1;
  }

  const dailyAvgWpm = totalDuration > 0 ? Math.round(weightedWpmSum / totalDuration) : 0;
  const dailyAvgAcc = totalDuration > 0 ? Math.round(weightedAccSum / totalDuration) : 0;
  const dailyTotalTime = totalDuration;
  const dailyTotalLessons = activeActivitiesCount;

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
  const lessons = rawLessons.map((lesson: any) => {
    const transformedSubLessons = (lesson.subLessons || []).map((sub: any) => {
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

    const isAllCompleted = transformedSubLessons.every((s: any) => s.status === 'completed');
    const isSomeCompleted = transformedSubLessons.some((s: any) => s.status === 'completed');

    let unitStatus = 'start';
    if (isAllCompleted) unitStatus = 'completed';
    else if (isSomeCompleted) unitStatus = 'resume';

    const playedSubLessons = transformedSubLessons.filter((s: any) => s.status === 'completed');

    const avgSpeed = playedSubLessons.length > 0
      ? Math.round(playedSubLessons.reduce((sum: number, s: any) => sum + s.wpm, 0) / playedSubLessons.length)
      : 0;

    const avgAcc = playedSubLessons.length > 0
      ? Math.round(playedSubLessons.reduce((sum: number, s: any) => sum + s.acc, 0) / playedSubLessons.length)
      : 0;

    const totalSeconds = playedSubLessons.reduce((sum: number, s: any) => sum + s.duration, 0);

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