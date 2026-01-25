// app/api/save-test/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { duration, wpm, accuracy, mistakes } = body;

    // 🚨 1. Anti-Cheat
    if (wpm > 300 || accuracy > 100 || accuracy < 0) {
        return NextResponse.json({ error: "Suspicious activity detected" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    // 🧮 2. คำนวณ XP (สูตร Balance ใหม่)
    
    // duration ที่ส่งมาหน่วยเป็น "วินาที" (เช่น 60, 180, 300) ต้องแปลงเป็นนาทีก่อน
    // แต่ถ้า Frontend ส่งมาเป็น 1, 3, 5 อยู่แล้วก็ใช้ได้เลย (เช็ค Frontend ดีๆ นะครับ)
    // สมมติ Frontend ส่งมาเป็น 60, 180, 300
    const mins = duration < 10 ? duration : duration / 60;

    // A. Base XP: คิดจาก WPM * 1.0 * นาที (ปรับขึ้นจาก 0.5 เพื่อให้คุ้มค่าเหนื่อย)
    // เช่น พิมพ์ 40 WPM นาน 1 นาที = 40 XP
    let speedXp = Math.round((wpm * 1.0) * mins);
    
    // B. Accuracy Bonus: แม่นยำต้องได้รางวัล
    let accuracyBonus = 0;
    if (accuracy >= 98) accuracyBonus = 10 * mins;       // แม่นเทพ (+10 ต่อนาที)
    else if (accuracy >= 95) accuracyBonus = 5 * mins;  // แม่นดี (+5 ต่อนาที)
    
    // Penalty: ถ้าแม่นยำต่ำเกินไป ต้องโดนหัก (เพื่อให้คนเน้นแม่น ไม่ใช่เน้นมั่ว)
    let multiplier = 1;
    if (accuracy < 85) multiplier = 0.5; // หายครึ่ง
    if (accuracy < 50) multiplier = 0;   // ไม่ได้เลย

    // รวมคะแนนดิบ
    let totalRawXP = Math.round((speedXp + accuracyBonus) * multiplier);

    // C. Endurance Bonus (รางวัลความอึด)
    // ยิ่งเล่นนาน ยิ่งได้แถม (กระตุ้นให้คนเล่น 3-5 นาที)
    let enduranceBonus = 0;
    if (mins >= 3) enduranceBonus = 20;  // เล่น 3 นาที แจกเพิ่ม 20
    if (mins >= 5) enduranceBonus = 50;  // เล่น 5 นาที แจกเพิ่ม 50 (เยอะหน่อยเพราะเหนื่อยจริง)

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

      // 3.2 อัปเดต User
      let updatedUser = user;
      if (earnedXP > 0) {
        const currentTotalExp = (user.currentExp || 0) + earnedXP;
        
        // Logic Rank
        const RANK_1_CAP = 2500;
        const RANK_2_CAP = 8500;
        let newRank = 1;
        if (currentTotalExp >= RANK_2_CAP) newRank = 3;
        else if (currentTotalExp >= RANK_1_CAP) newRank = 2;

        updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            currentExp: currentTotalExp,
            rank: newRank,
            lastPlayedAt: new Date()
          }
        });
      }
      return { newTestResult, updatedUser };
    });

    // 📤 4. ส่ง Breakdown กลับไปโชว์
    // Map ให้เข้ากับ UI เดิมที่เราทำไว้ (PracticeResultModal)
    // wpm -> โบนัสความเร็ว
    // grinder -> โบนัสความแม่น (ยืมช่องมาใช้)
    // quest -> โบนัสความอึด (ยืมช่องมาใช้)
    return NextResponse.json({
      success: true,
      earnedXP,
      totalXP: result.updatedUser.currentExp,
      xpBreakdown: {
        base: 0, 
        wpm: Math.round(speedXp * multiplier),       // ช่อง "โบนัสความเร็ว"
        grinder: Math.round(accuracyBonus * multiplier), // ช่อง "โบนัสความแม่นยำ" (ใช้ช่อง Grinder เดิม)
        quest: enduranceBonus,                       // ช่อง "โบนัสความอึด" (ใช้ช่อง Quest เดิม)
        firstWin: 0
      }
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}