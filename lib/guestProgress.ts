// lib/guestProgress.ts

export interface GuestLessonRecord {
  subLessonId: string;
  wpm: number;
  accuracy: number;
  stars: number;
  duration: number;
  updatedAt: string;
}

export interface GuestTestRecord {
  id: string;
  duration: number;
  wpm: number;
  accuracy: number;
  mistakes: Record<string, number>;
  createdAt: string;
}

const KEY_GUEST_EXP = 'pimwai_guest_exp';
const KEY_GUEST_LESSONS = 'pimwai_guest_lessons';
const KEY_GUEST_TESTS = 'pimwai_guest_tests';
const KEY_GUEST_LAST_DATE = 'pimwai_guest_last_played_date';

export function getBangkokDateKey(date: Date = new Date()): string {
  const bkk = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return bkk.toISOString().split('T')[0];
}

export function getGuestExp(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(KEY_GUEST_EXP);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return !isNaN(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export function setGuestExp(exp: number): void {
  if (typeof window === 'undefined') return;
  try {
    const safe = Math.max(0, Math.round(exp));
    localStorage.setItem(KEY_GUEST_EXP, String(safe));
  } catch {
    // ignore
  }
}

export function getGuestLessonsMap(): Record<string, GuestLessonRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KEY_GUEST_LESSONS);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getGuestTestsList(): GuestTestRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY_GUEST_TESTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getGuestLessonMetaForSave(subLessonId: string) {
  const guestTotalExp = getGuestExp();
  const lessonsMap = getGuestLessonsMap();
  const prev = lessonsMap[subLessonId] || null;
  const todayKey = getBangkokDateKey();

  let dailyTotalLessons = 0;
  for (const rec of Object.values(lessonsMap)) {
    if (rec?.updatedAt && getBangkokDateKey(new Date(rec.updatedAt)) === todayKey) {
      dailyTotalLessons++;
    }
  }

  const prevUpdatedToday = Boolean(
    prev?.updatedAt && getBangkokDateKey(new Date(prev.updatedAt)) === todayKey
  );
  if (!prevUpdatedToday) {
    dailyTotalLessons += 1;
  }

  let lastPlayedDateKey: string | null = null;
  try {
    lastPlayedDateKey = localStorage.getItem(KEY_GUEST_LAST_DATE);
  } catch {
    // ignore
  }

  return {
    guestTotalExp,
    prevStars: prev?.stars ?? 0,
    prevWpm: prev?.wpm ?? 0,
    hasExisting: Boolean(prev),
    prevUpdatedToday,
    dailyTotalLessons,
    lastPlayedDateKey,
  };
}

function updateGuestTodayStats(wpm: number, accuracy: number, durationSeconds: number) {
  if (typeof window === 'undefined') return;
  try {
    const todayIso = new Date().toISOString().split('T')[0];
    const todayKey = 'pimwai_guest_today_' + todayIso;
    const raw = localStorage.getItem(todayKey);
    let prevCount = 0;
    let prevTotalWpm = 0;
    let prevTotalAcc = 0;
    let prevTotalSec = 0;

    if (raw) {
      const parsed = JSON.parse(raw);
      prevCount = Number(parsed.count) || 1;
      prevTotalWpm = (Number(parsed.wpm) || 0) * prevCount;
      prevTotalAcc = (Number(parsed.acc) || 0) * prevCount;
      prevTotalSec = Number(parsed.totalSeconds) || 0;
    }

    const nextCount = prevCount + 1;
    const avgWpm = Math.round((prevTotalWpm + wpm) / nextCount);
    const avgAcc = Math.round((prevTotalAcc + accuracy) / nextCount);
    const totalSeconds = prevTotalSec + Math.max(1, Math.round(durationSeconds));
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const timeStr = `${m}:${s.toString().padStart(2, '0')}`;

    localStorage.setItem(
      todayKey,
      JSON.stringify({
        wpm: avgWpm,
        acc: avgAcc,
        time: timeStr,
        totalSeconds,
        count: nextCount,
      })
    );
  } catch {
    // ignore
  }
}

export function recordGuestLessonResult(params: {
  subLessonId: string;
  wpm: number;
  accuracy: number;
  stars: number;
  duration: number;
  totalXP: number;
}) {
  if (typeof window === 'undefined') return;
  try {
    const { subLessonId, wpm, accuracy, stars, duration, totalXP } = params;
    setGuestExp(totalXP);

    const map = getGuestLessonsMap();
    const prev = map[subLessonId];
    const todayKey = getBangkokDateKey();
    const prevUpdatedToday = Boolean(
      prev?.updatedAt && getBangkokDateKey(new Date(prev.updatedAt)) === todayKey
    );

    map[subLessonId] = {
      subLessonId,
      wpm: prev ? Math.max(prev.wpm, wpm) : wpm,
      accuracy: prev ? Math.max(prev.accuracy, accuracy) : accuracy,
      stars: prev ? Math.max(prev.stars, stars) : stars,
      duration: prevUpdatedToday ? (prev?.duration || 0) + duration : duration,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(KEY_GUEST_LESSONS, JSON.stringify(map));
    localStorage.setItem(KEY_GUEST_LAST_DATE, todayKey);
    updateGuestTodayStats(wpm, accuracy, duration);
    window.dispatchEvent(new Event('storage'));
  } catch {
    // ignore
  }
}

export function recordGuestTestResult(params: {
  duration: number;
  wpm: number;
  accuracy: number;
  mistakes: Record<string, number>;
  totalXP: number;
}) {
  if (typeof window === 'undefined') return;
  try {
    const { duration, wpm, accuracy, mistakes, totalXP } = params;
    setGuestExp(totalXP);

    const list = getGuestTestsList();
    list.unshift({
      id: `guest-test-${Date.now()}`,
      duration,
      wpm,
      accuracy,
      mistakes: mistakes || {},
      createdAt: new Date().toISOString(),
    });

    localStorage.setItem(KEY_GUEST_TESTS, JSON.stringify(list.slice(0, 30)));
    localStorage.setItem(KEY_GUEST_LAST_DATE, getBangkokDateKey());
    updateGuestTodayStats(wpm, accuracy, duration * 60);
    window.dispatchEvent(new Event('storage'));
  } catch {
    // ignore
  }
}

export function peekGuestDataForSync(): {
  hasData: boolean;
  guestExp: number;
  lessons: GuestLessonRecord[];
  tests: GuestTestRecord[];
} {
  const guestExp = getGuestExp();
  const lessons = Object.values(getGuestLessonsMap());
  const tests = getGuestTestsList();
  const hasData = guestExp > 0 || lessons.length > 0 || tests.length > 0;
  return { hasData, guestExp, lessons, tests };
}

export function clearGuestDataAfterSync(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(KEY_GUEST_EXP);
    localStorage.removeItem(KEY_GUEST_LESSONS);
    localStorage.removeItem(KEY_GUEST_TESTS);
    localStorage.removeItem(KEY_GUEST_LAST_DATE);
  } catch {
    // ignore
  }
}

export interface GuestDailyQuestItem {
  id: number;
  text: string;
  current: number;
  target: number;
  unit: string;
  rewardXp: number;
  isCompleted: boolean;
  tier?: number;
}

export function computeGuestDailyQuests(): GuestDailyQuestItem[] {
  const todayKey = getBangkokDateKey();
  const lessons = Object.values(getGuestLessonsMap()).filter(
    (l) => l?.updatedAt && getBangkokDateKey(new Date(l.updatedAt)) === todayKey
  );
  const tests = getGuestTestsList().filter(
    (t) => t?.createdAt && getBangkokDateKey(new Date(t.createdAt)) === todayKey
  );

  let totalDurationSeconds = 0;
  let weightedWpmSum = 0;
  let weightedAccSum = 0;
  let activeActivitiesCount = 0;

  for (const p of lessons) {
    const dur = p.duration || 1;
    const wpm = p.wpm || 0;
    const acc = p.accuracy !== undefined ? p.accuracy : 100;
    totalDurationSeconds += dur;
    weightedWpmSum += wpm * dur;
    weightedAccSum += acc * dur;
    activeActivitiesCount++;
  }

  for (const t of tests) {
    const rawDur = t.duration || 1;
    const durSec = rawDur < 10 ? rawDur * 60 : rawDur;
    const wpm = t.wpm || 0;
    const acc = t.accuracy !== undefined ? t.accuracy : 100;
    if (wpm >= 10) {
      totalDurationSeconds += durSec;
      weightedWpmSum += wpm * durSec;
      weightedAccSum += acc * durSec;
      activeActivitiesCount++;
    }
  }

  const dailyAvgWpm = totalDurationSeconds > 0 ? Math.round(weightedWpmSum / totalDurationSeconds) : 0;
  const dailyAvgAcc = totalDurationSeconds > 0 ? Math.round(weightedAccSum / totalDurationSeconds) : 0;
  const minutes = Math.floor(totalDurationSeconds / 60);

  return [
    {
      id: 1,
      tier: 1,
      text: 'พิมพ์ให้ครบ 5 นาที',
      current: minutes,
      target: 5,
      unit: 'นาที',
      rewardXp: 150,
      isCompleted: minutes >= 5,
    },
    {
      id: 2,
      tier: 1,
      text: 'ผ่าน 3 บทเรียน / รอบฝึก',
      current: activeActivitiesCount,
      target: 3,
      unit: 'บทเรียน',
      rewardXp: 150,
      isCompleted: activeActivitiesCount >= 3,
    },
    {
      id: 3,
      tier: 1,
      text: 'ทำความแม่นยำให้ได้ 95%',
      current: dailyAvgAcc,
      target: 95,
      unit: '%',
      rewardXp: 150,
      isCompleted: activeActivitiesCount > 0 && dailyAvgWpm >= 15 && dailyAvgAcc >= 95,
    },
  ];
}

