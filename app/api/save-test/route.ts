import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRankFromExp } from '@/lib/rankUtils';
import { evaluateNewlyCompletedQuests } from '@/lib/questUtils';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { duration, wpm, accuracy, mistakes } = body;

    // 🚨 1. ตรวจสอบ Duration & Anti-Cheat
    const numDuration = Number(duration);
    const mins = numDuration < 10 ? numDuration : Math.round(numDuration / 60);
    if (![1, 3, 5].includes(mins)) {
      return NextResponse.json({ success: false, error: "Invalid duration" }, { status: 400 });
    }

    if (typeof wpm !== 'number' || typeof accuracy !== 'number' || wpm > 250 || accuracy > 100 || accuracy < 0) {
      return NextResponse.json({ success: false, error: "Suspicious activity detected" }, { status: 400 });
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

    // 🧮 2. คำนวณ XP
    // A. Base XP: คิดจาก WPM * 1.0 * นาที
    let speedXp = Math.round((wpm * 1.0) * mins);
    
    // B. Accuracy Bonus: ต้องพิมพ์จริงจัง (WPM >= 15) ถึงจะได้โบนัสแม่นยำ
    let accuracyBonus = 0;
    if (wpm >= 15) {
      if (accuracy >= 98) accuracyBonus = 10 * mins;       // แม่นเทพ (+10 ต่อนาที)
      else if (accuracy >= 95) accuracyBonus = 5 * mins;  // แม่นดี (+5 ต่อนาที)
    }
    
    // Penalty: ถ้าแม่นยำต่ำเกินไป หรือ WPM < 10 (AFK / ปั๊มมั่ว) ตัด EXP ทั้งหมด
    let multiplier = 1;
    if (accuracy < 85) multiplier = 0.5;
    if (accuracy < 50 || wpm < 10) multiplier = 0;

    let totalRawXP = Math.round((speedXp + accuracyBonus) * multiplier);

    // C. Endurance Bonus: ต้องพิมพ์จริง (WPM >= 15)
    let enduranceBonus = 0;
    if (wpm >= 15) {
      if (mins >= 3) enduranceBonus = 20;
      if (mins >= 5) enduranceBonus = 50;
    }

    // XP สุทธิ
    let earnedXP = totalRawXP + enduranceBonus;
    if (earnedXP < 0) earnedXP = 0;

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

      const { newlyCompletedQuests, totalQuestBonusXp } = await evaluateNewlyCompletedQuests({
        tx,
        userId: user.id,
        currentActivity: {
          type: 'test',
          recordId: newTestResult.id
        }
      });

      const finalEarnedXP = earnedXP + totalQuestBonusXp;

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

      return { newTestResult, updatedUser, newlyCompletedQuests, totalQuestBonusXp, finalEarnedXP };
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
      xpBreakdown: {
        base: 0, 
        wpm: Math.round(speedXp * multiplier),       // ช่อง "โบนัสความเร็ว"
        grinder: Math.round(accuracyBonus * multiplier), // ช่อง "โบนัสความแม่นยำ" (ใช้ช่อง Grinder เดิม)
        quest: enduranceBonus + result.totalQuestBonusXp, // ช่อง "โบนัสความอึด / เควส"
        firstWin: 0
      }
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}