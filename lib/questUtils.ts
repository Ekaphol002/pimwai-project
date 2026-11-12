import { prisma } from '@/lib/prisma';
import { getStartOfTodayBangkok, toDateKey } from '@/lib/streakUtils';

export interface DailyQuestItem {
  id: number;
  text: string;
  current: number;
  target: number;
  unit: string;
  rewardXp: number;
  isCompleted: boolean;
  tier?: number;
}

export interface CompletedQuestNotification {
  id: number;
  text: string;
  xp: number;
}

export interface DailyQuestStats {
  totalDurationSeconds: number;
  minutes: number;
  dailyAvgWpm: number;
  dailyAvgAcc: number;
  dailyTotalSessions: number;
  todayWordsCount: number;
  isAllLessonsCompleted: boolean;
}

// แคชจำนวน SubLesson ทั้งหมดของระบบไว้ในหน่วยความจำ เพื่อลดการ Query ซ้ำ
const globalSubLessonCountCache = globalThis as unknown as {
  totalSubLessonsCount?: { count: number; fetchedAt: number };
  awardedQuestsByUserDay?: Map<string, Set<number>>;
};

export async function getTotalSubLessonsCount(txOrPrisma: any = prisma): Promise<number> {
  const now = Date.now();
  if (
    globalSubLessonCountCache.totalSubLessonsCount &&
    now - globalSubLessonCountCache.totalSubLessonsCount.fetchedAt < 10 * 60 * 1000
  ) {
    return globalSubLessonCountCache.totalSubLessonsCount.count;
  }
  const count = await txOrPrisma.subLesson.count();
  globalSubLessonCountCache.totalSubLessonsCount = { count, fetchedAt: now };
  return count;
}

/**
 * สร้างรายการเควสรายวันจากสถิติ (ใช้ร่วมกันทั้งหน้าบ้านและ API หลังบ้าน)
 */
export function buildDailyQuests(stats: DailyQuestStats): DailyQuestItem[] {
  const {
    minutes,
    dailyAvgWpm,
    dailyAvgAcc,
    dailyTotalSessions,
    todayWordsCount,
    isAllLessonsCompleted
  } = stats;

  // สำหรับผู้ที่เคลียร์ครบทุกด่านแล้ว (Endgame Quests): รางวัลเควสละ +500 EXP (รวม 1,500 EXP/วัน)
  if (isAllLessonsCompleted) {
    return [
      {
        id: 101,
        tier: 2,
        text: 'พิมพ์สะสมครบ 10 นาที',
        current: minutes,
        target: 10,
        unit: 'นาที',
        rewardXp: 500,
        isCompleted: minutes >= 10
      },
      {
        id: 102,
        tier: 2,
        text: 'พิมพ์สะสมครบ 250 คำ',
        current: todayWordsCount,
        target: 250,
        unit: 'คำ',
        rewardXp: 500,
        isCompleted: todayWordsCount >= 250
      },
      {
        id: 103,
        tier: 2,
        text: 'ทำความเร็วเฉลี่ย 40+ WPM',
        current: dailyAvgWpm,
        target: 40,
        unit: 'WPM',
        rewardXp: 500,
        isCompleted: dailyTotalSessions > 0 && dailyAvgWpm >= 40
      }
    ];
  }

  // สำหรับผู้เล่นทั่วไป (กำลังฝึกบทเรียน): รางวัลเควสละ +150 EXP
  return [
    {
      id: 1,
      tier: 1,
      text: 'พิมพ์ให้ครบ 5 นาที',
      current: minutes,
      target: 5,
      unit: 'นาที',
      rewardXp: 150,
      isCompleted: minutes >= 5
    },
    {
      id: 2,
      tier: 1,
      text: 'ผ่าน 3 บทเรียน / รอบฝึก',
      current: dailyTotalSessions,
      target: 3,
      unit: 'บทเรียน',
      rewardXp: 150,
      isCompleted: dailyTotalSessions >= 3
    },
    {
      id: 3,
      tier: 1,
      text: 'ทำความแม่นยำให้ได้ 95%',
      current: dailyAvgAcc,
      target: 95,
      unit: '%',
      rewardXp: 150,
      isCompleted: dailyTotalSessions > 0 && dailyAvgWpm >= 15 && dailyAvgAcc >= 95
    }
  ];
}

/**
 * คำนวณสถิติรายวันจากรายการ LessonProgress, SpeedTestResult และ FarmSession ของวันนี้
 */
export function computeDailyStatsFromRecords(
  todaysProgress: Array<{ duration?: number; wpm?: number; accuracy?: number }>,
  todaysSpeedTests: Array<{ duration?: number; wpm?: number; accuracy?: number }>,
  todaysFarmSessions: Array<{ duration?: number; wpm?: number; accuracy?: number; wordsCount?: number }>,
  isAllLessonsCompleted: boolean
): DailyQuestStats {
  let totalDurationSeconds = 0;
  let weightedWpmSum = 0;
  let weightedAccSum = 0;
  let todayWordsCount = 0;

  let activeActivitiesCount = 0;

  for (const p of todaysProgress) {
    const dur = p.duration || 1;
    const wpm = p.wpm || 0;
    const acc = p.accuracy !== undefined ? p.accuracy : 100;
    totalDurationSeconds += dur;
    weightedWpmSum += wpm * dur;
    weightedAccSum += acc * dur;
    todayWordsCount += Math.max(0, Math.round((wpm * dur) / 60));
    activeActivitiesCount++;
  }

  for (const t of todaysSpeedTests) {
    // SpeedTestResult เก็บ duration เป็นนาที (เช่น 1, 3, 5) หรือวินาทีถ้า >= 10
    const rawDur = t.duration || 1;
    const durSec = rawDur < 10 ? rawDur * 60 : rawDur;
    const wpm = t.wpm || 0;
    const acc = t.accuracy !== undefined ? t.accuracy : 100;
    // นับเฉพาะรอบที่พิมพ์จริง (wpm >= 10) ป้องกันการ AFK ปั๊มเควส
    if (wpm >= 10) {
      totalDurationSeconds += durSec;
      weightedWpmSum += wpm * durSec;
      weightedAccSum += acc * durSec;
      todayWordsCount += Math.max(0, Math.round((wpm * durSec) / 60));
      activeActivitiesCount++;
    }
  }

  for (const f of todaysFarmSessions) {
    const dur = f.duration || 1;
    const wpm = f.wpm || 0;
    const acc = f.accuracy !== undefined ? f.accuracy : 100;
    if (wpm >= 10 || (f.wordsCount && f.wordsCount > 0)) {
      totalDurationSeconds += dur;
      weightedWpmSum += wpm * dur;
      weightedAccSum += acc * dur;
      todayWordsCount += f.wordsCount && f.wordsCount > 0
        ? f.wordsCount
        : Math.max(0, Math.round((wpm * dur) / 60));
      activeActivitiesCount++;
    }
  }

  const dailyAvgWpm = totalDurationSeconds > 0 ? Math.round(weightedWpmSum / totalDurationSeconds) : 0;
  const dailyAvgAcc = totalDurationSeconds > 0 ? Math.round(weightedAccSum / totalDurationSeconds) : 0;
  const minutes = Math.floor(totalDurationSeconds / 60);

  return {
    totalDurationSeconds,
    minutes,
    dailyAvgWpm,
    dailyAvgAcc,
    dailyTotalSessions: activeActivitiesCount,
    todayWordsCount,
    isAllLessonsCompleted
  };
}

/**
 * ตรวจสอบว่ามีเควสรายวันไหนที่เพิ่งสำเร็จในรอบนี้หรือไม่ (เปรียบเทียบก่อน-หลังการบันทึกกิจกรรมปัจจุบัน)
 * พร้อมแคชป้องกันการแจกซ้ำในวันเดียวกัน
 */
export async function evaluateNewlyCompletedQuests(params: {
  tx: any;
  userId: string;
  currentActivity: {
    type: 'lesson' | 'test' | 'farm';
    recordId?: string;
    subLessonId?: string;
    prevLessonProgress?: { duration: number; wpm: number; accuracy: number; updatedToday: boolean } | null;
  };
}): Promise<{
  newlyCompletedQuests: CompletedQuestNotification[];
  totalQuestBonusXp: number;
}> {
  const { tx, userId, currentActivity } = params;
  const today = getStartOfTodayBangkok();
  const todayKey = `${userId}:${toDateKey(new Date())}`;

  if (!globalSubLessonCountCache.awardedQuestsByUserDay) {
    globalSubLessonCountCache.awardedQuestsByUserDay = new Map();
  }
  let awardedSet = globalSubLessonCountCache.awardedQuestsByUserDay.get(todayKey);
  if (!awardedSet) {
    awardedSet = new Set<number>();
    globalSubLessonCountCache.awardedQuestsByUserDay.set(todayKey, awardedSet);
  }

  const [totalSubLessons, completedLessonsCount, todaysProgress, todaysTests, todaysFarm] = await Promise.all([
    getTotalSubLessonsCount(tx),
    tx.lessonProgress.count({ where: { userId } }),
    tx.lessonProgress.findMany({ where: { userId, updatedAt: { gte: today } } }),
    tx.speedTestResult.findMany({ where: { userId, createdAt: { gte: today } } }),
    tx.farmSession.findMany({ where: { userId, createdAt: { gte: today } } })
  ]);

  const isAllLessonsCompleted = totalSubLessons > 0 && completedLessonsCount >= totalSubLessons;

  // 1. สถิติหลังบันทึกกิจกรรมนี้ (After)
  const afterStats = computeDailyStatsFromRecords(
    todaysProgress,
    todaysTests,
    todaysFarm,
    isAllLessonsCompleted
  );
  const afterQuests = buildDailyQuests(afterStats);

  // 2. จำลองสถิติก่อนบันทึกกิจกรรมนี้ (Before) เพื่อหาว่าเควสไหนเพิ่งข้ามเส้นสำเร็จในรอบนี้พอดี
  let beforeProgress = [...todaysProgress];
  let beforeTests = [...todaysTests];
  let beforeFarm = [...todaysFarm];

  if (currentActivity.type === 'lesson' && currentActivity.subLessonId) {
    beforeProgress = todaysProgress.filter((p: any) => p.subLessonId !== currentActivity.subLessonId);
    if (currentActivity.prevLessonProgress?.updatedToday) {
      beforeProgress.push({
        duration: currentActivity.prevLessonProgress.duration,
        wpm: currentActivity.prevLessonProgress.wpm,
        accuracy: currentActivity.prevLessonProgress.accuracy
      });
    }
  } else if (currentActivity.type === 'test' && currentActivity.recordId) {
    beforeTests = todaysTests.filter((t: any) => t.id !== currentActivity.recordId);
  } else if (currentActivity.type === 'farm' && currentActivity.recordId) {
    beforeFarm = todaysFarm.filter((f: any) => f.id !== currentActivity.recordId);
  }

  const beforeStats = computeDailyStatsFromRecords(
    beforeProgress,
    beforeTests,
    beforeFarm,
    isAllLessonsCompleted
  );
  const beforeQuests = buildDailyQuests(beforeStats);

  // บันทึกเควสที่สำเร็จไปตั้งแต่ก่อนหน้านี้เข้า Set กันเหนียว (กรณี Server เพิ่งรีสตาร์ท)
  for (const bq of beforeQuests) {
    if (bq.isCompleted) {
      awardedSet.add(bq.id);
    }
  }

  const newlyCompletedQuests: CompletedQuestNotification[] = [];
  let totalQuestBonusXp = 0;

  for (const aq of afterQuests) {
    const bq = beforeQuests.find(q => q.id === aq.id);
    const wasCompletedBefore = bq ? bq.isCompleted : false;

    if (aq.isCompleted && !wasCompletedBefore && !awardedSet.has(aq.id)) {
      awardedSet.add(aq.id);
      newlyCompletedQuests.push({
        id: aq.id,
        text: aq.text,
        xp: aq.rewardXp
      });
      totalQuestBonusXp += aq.rewardXp;
    }
  }

  return {
    newlyCompletedQuests,
    totalQuestBonusXp
  };
}

