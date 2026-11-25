// lib/activeDates.ts
import { toDateKey } from '@/lib/streakUtils';

/**
 * บันทึกวันที่เข้าเล่น (เวลาประเทศไทย YYYY-MM-DD) ลงคอลัมน์ User.activeDates แบบถาวร (Atomic, ไม่มีซ้ำ)
 * ทำให้แม้มีการลบประวัติ SpeedTestResult เก่าเกิน 30 วัน หรือเล่น Lesson ซ้ำ ไฟ (Streak) จะไม่มีวันหาย
 */
export async function recordUserActiveDate(
  txOrPrisma: { $executeRaw: any },
  userId: string,
  date: Date | string = new Date()
): Promise<void> {
  if (!userId) return;
  const dateKey = toDateKey(date);
  try {
    await txOrPrisma.$executeRaw`
      UPDATE "User"
      SET "activeDates" = array_append(COALESCE("activeDates", ARRAY[]::text[]), ${dateKey})
      WHERE id = ${userId}
        AND NOT (${dateKey} = ANY(COALESCE("activeDates", ARRAY[]::text[])))
    `;
  } catch (err) {
    console.error('recordUserActiveDate error:', err);
  }
}

/**
 * ดึงรายการวันที่เข้าเล่นแบบถาวร (User.activeDates) ของผู้ใช้
 */
export async function getUserActiveDates(
  txOrPrisma: { $queryRaw: any },
  userId: string
): Promise<string[]> {
  if (!userId) return [];
  try {
    const rows: Array<{ activeDates: string[] | null }> = await txOrPrisma.$queryRaw`
      SELECT "activeDates" FROM "User" WHERE id = ${userId} LIMIT 1
    `;
    return rows?.[0]?.activeDates || [];
  } catch (err) {
    console.error('getUserActiveDates error:', err);
    return [];
  }
}
