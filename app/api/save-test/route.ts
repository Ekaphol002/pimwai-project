import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRankFromExp, calculateRankInfo, getRankMultiplierConfig } from '@/lib/rankUtils';
import { evaluateNewlyCompletedQuests } from '@/lib/questUtils';
import { recordUserActiveDate } from '@/lib/activeDates';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { duration, wpm, accuracy, mistakes, guestTotalExp } = body;

    // 🚨 1. ตรวจสอบ Duration & Anti-Cheat
    const numDuration = Number(duration);
    const mins = numDuration < 10 ? numDuration : Math.round(numDuration / 60);
    if (![1, 3, 5].includes(mins)) {
      return NextResponse.json({ success: false, error: "Invalid duration" }, { status: 400 });
    }

    if (typeof wpm !== 'number' || typeof accuracy !== 'number' || wpm > 250 || accuracy > 100 || accuracy < 0) {
      return NextResponse.json({ success: false, error: "Suspicious activity detected" }, { status: 400 });
    }

    // 🧮 2. ฟังก์ชันคำนวณ XP ให้สมดุลและสู้โหมดพิมพ์ด่วน (Farm Mode) ได้ในทุกแรงค์
    const computeTestXp = (currentExpForRank: number, isRank7: boolean = false) => {
      const rankInfo = calculateRankInfo(currentExpForRank, isRank7);
      const rankMul = getRankMultiplierConfig(rankInfo.rank, rankInfo.stars).totalBaseMultiplier;

      // A. Speed XP: 5 ตัวอักษร/คำ × 1 XP × ตัวคูณแรงค์ (เทียบเท่าฐาน Farm Mode)
      const speedXp = Math.round(wpm * 5.0 * mins * rankMul);

      // B. Accuracy Bonus: ต้องพิมพ์จริงจัง (WPM >= 15) ถึงจะได้โบนัสแม่นยำ
      let accuracyBonus = 0;
      if (wpm >= 15) {
        if (accuracy >= 98) accuracyBonus = Math.round(80 * mins * rankMul);      // แม่นเทพ (+80 ต่อนาที × ตัวคูณแรงค์)
        else if (accuracy >= 95) accuracyBonus = Math.round(40 * mins * rankMul); // แม่นดี (+40 ต่อนาที × ตัวคูณแรงค์)
      }

      // Penalty: ถ้าแม่นยำต่ำเกินไป หรือ WPM < 10 (AFK / ปั๊มมั่ว) ตัด EXP
      let multiplier = 1;
      if (accuracy < 85) multiplier = 0.5;
      if (accuracy < 50 || wpm < 10) multiplier = 0;

      const totalRawXP = Math.round((speedXp + accuracyBonus) * multiplier);

      // C. Endurance Bonus: โบนัสความอึดสำหรับ 3 นาที และ 5 นาที
      let enduranceBonus = 0;
      if (wpm >= 15 && accuracy >= 50) {
        if (mins >= 5) enduranceBonus = Math.round(400 * rankMul);
        else if (mins >= 3) enduranceBonus = Math.round(150 * rankMul);
      }

      const earnedXP = Math.max(0, totalRawXP + enduranceBonus);
      return {
        earnedXP,
        wpmXp: Math.round(speedXp * multiplier),
        accuracyXp: Math.round(accuracyBonus * multiplier),
        enduranceBonus,
      };
    };

    // 🌟 กรณีไม่ได้ล็อกอิน (Guest Mode): คืนค่า EXP และ Breakdown ให้สะสมไว้ซิงค์ตอนล็อกอิน
    if (!session || !session.user?.email) {
      const prevGuestExp = Math.max(0, Number(guestTotalExp) || 0);
      const xp = computeTestXp(prevGuestExp, false);
      const nextTotalExp = prevGuestExp + xp.earnedXP;
      return NextResponse.json({
        success: true,
        isGuest: true,
        earnedXP: xp.earnedXP,
        totalXP: nextTotalExp,
        completedQuests: [],
        xpBreakdown: {
          base: 0,
          wpm: xp.wpmXp,
          grinder: xp.accuracyXp,
          quest: xp.enduranceBonus,
          firstWin: 0,
        },
      });
    }

    const cleanEmail = session.user.email?.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...((session.user as any)?.id ? [{ id: (session.user as any).id }] : []),
          ...(cleanEmail ? [{ email: cleanEmail }] : [])
        ]
      }
    });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    // ⏱️ Rate Limiting: ป้องกันการยิงบันทึกผลถี่ผิดปกติ
    const lastTest = await prisma.speedTestResult.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });
    if (lastTest) {
      const timeSinceLastMs = Date.now() - new Date(lastTest.createdAt).getTime();
      if (timeSinceLastMs < 20000) {
        return NextResponse.json({ success: false, error: "กรุณารอสักครู่ก่อนบันทึกผลการทดสอบถัดไป" }, { status: 429 });
      }
    }

    // คำนวณ XP ตามแรงค์จริงของผู้เล่น
    const xp = computeTestXp(user.currentExp || 0, user.rank === 7);

    // 💾 3. บันทึกและอัปเดต
    const result = await prisma.$transaction(async (tx) => {
      // 3.1 บันทึกผล
      const newTestResult = await tx.speedTestResult.create({
        data: {
          userId: user.id,
          duration, 
          wpm,
          accuracy,
          mistakes 
        }
      });

      const { newlyCompletedQuests, totalQuestBonusXp, dailyQuests } = await evaluateNewlyCompletedQuests({
        tx,
        userId: user.id,
        currentActivity: {
          type: 'test',
          recordId: newTestResult.id
        }
      });

      const finalEarnedXP = xp.earnedXP + totalQuestBonusXp;

      // 3.2 อัปเดต User
      let updatedUser = user;
      if (finalEarnedXP > 0) {
        const currentTotalExp = (user.currentExp || 0) + finalEarnedXP;
        let isTop10 = false;
        if (currentTotalExp >= 234000) {
          const higherCount = await tx.user.count({
            where: {
              id: { not: user.id },
              currentExp: { gt: currentTotalExp }
            }
          });
          isTop10 = higherCount < 10;
        }
        const newRank = getRankFromExp(currentTotalExp, isTop10);

        updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            currentExp: currentTotalExp,
            rank: newRank,
            lastPlayedAt: new Date()
          }
        });
      }

      // บันทึกวันที่เข้าเล่นแบบถาวร (ไฟไม่หายแม้ลบประวัติ SpeedTest เก่าเกิน 30 วัน)
      await recordUserActiveDate(tx, user.id);

      // 3.3 Auto-cleanup: ลบประวัติ speed test เก่าเกิน 30 วันอัตโนมัติ (ยกเว้น Best Scores ของแต่ละ duration)
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const bestScores = await tx.speedTestResult.findMany({
          where: { userId: user.id },
          orderBy: [
            { wpm: 'desc' },
            { accuracy: 'desc' },
            { createdAt: 'desc' }
          ],
          distinct: ['duration'],
          select: { id: true }
        });
        const keepIds = bestScores.map(b => b.id);
        if (keepIds.length > 0) {
          await tx.speedTestResult.deleteMany({
            where: {
              userId: user.id,
              createdAt: { lt: thirtyDaysAgo },
              id: { notIn: keepIds }
            }
          });
        }
      } catch (cleanupErr) {
        console.error("Auto cleanup speed test in save-test error:", cleanupErr);
      }

      return { newTestResult, updatedUser, newlyCompletedQuests, totalQuestBonusXp, finalEarnedXP, dailyQuests };
    });

    // 📤 4. ส่ง Breakdown กลับไปโชว์
    // Map ให้เข้ากับ UI เดิมที่เราทำไว้ (PracticeResultModal)
    // wpm -> โบนัสความเร็ว
    // grinder -> โบนัสความแม่น (ยืมช่องมาใช้)
    // quest -> โบนัสความอึด + รางวัลเควสรายวัน
    return NextResponse.json({
      success: true,
      earnedXP: result.finalEarnedXP,
      totalXP: result.updatedUser.currentExp,
      completedQuests: result.newlyCompletedQuests,
      dailyQuests: result.dailyQuests,
      xpBreakdown: {
        base: 0, 
        wpm: xp.wpmXp,                                       // ช่อง "โบนัสความเร็ว"
        grinder: xp.accuracyXp,                              // ช่อง "โบนัสความแม่นยำ" (ใช้ช่อง Grinder เดิม)
        quest: xp.enduranceBonus + result.totalQuestBonusXp, // ช่อง "โบนัสความอึด / เควส"
        firstWin: 0
      }
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}