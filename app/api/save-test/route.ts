// app/api/save-test/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    // 1. ตรวจสอบสถานะล็อกอิน
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    // หมายเหตุ: duration ควรส่งมาเป็น "วินาที" (เช่น 60, 180, 300)
    const { duration, wpm, accuracy, mistakes } = body;

    // 2. หา User ตัวจริง
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const userId = user.id;

    // 3. 🧮 คำนวณ XP (สูตรใหม่: สมดุลกับ Lesson)
    // แปลงเวลาเป็นนาที (เช่น 60วิ = 1นาที)
    const durationInMinutes = duration / 60; 
    
    // Base XP: คิดจาก 60% ของ WPM (เช่นพิมพ์ 100 คำ ได้ base 60 xp)
    let baseXp = wpm * 0.6; 

    // Penalty: ถ้าความแม่นยำต่ำกว่า 85% ให้ XP ลดฮวบ (ป้องกันการกดมั่ว)
    let accuracyMultiplier = 1;
    if (accuracy < 85) accuracyMultiplier = 0.5; // หายไปครึ่งนึง
    if (accuracy < 50) accuracyMultiplier = 0;   // ไม่ได้เลย

    // สูตร Final: Base * เวลา * ความแม่นยำ
    let earnedXP = Math.round((baseXp * durationInMinutes) * accuracyMultiplier);

    // กันเหนียว: ถ้าคำนวณออกมาติดลบ หรือ NaN ให้เป็น 0
    if (isNaN(earnedXP) || earnedXP < 0) earnedXP = 0;

    // (Option) Bonus: ถ้าพิมพ์เร็วมาก (>100 WPM) แถมให้อีกนิดหน่อย
    if (wpm > 100 && accuracy > 95) earnedXP += 10;

    console.log(`🧮 SpeedTest XP: WPM ${wpm} | Time ${durationInMinutes}m | Acc ${accuracy}% -> Earned ${earnedXP} XP`);

    // 4. บันทึกและอัปเดต (Transaction)
    const result = await prisma.$transaction(async (tx) => {
      // บันทึกผลการทดสอบ
      const newTestResult = await tx.speedTestResult.create({
        data: { 
            userId, 
            duration, 
            wpm, 
            accuracy, 
            mistakes 
        }
      });

      // อัปเดต User XP
      let updatedUser = user;
      if (earnedXP > 0) {
          const currentTotalExp = (user.currentExp || 0) + earnedXP;
          // สูตร Rank เดิม: 6000 XP ต่อเลเวล
          const newRank = Math.floor(currentTotalExp / 6000) + 1;

          updatedUser = await tx.user.update({
            where: { id: userId },
            data: { 
                currentExp: currentTotalExp, 
                rank: newRank 
            }
          });
      }

      return { newTestResult, updatedUser };
    });

    // 5. ส่งผลลัพธ์กลับ
    return NextResponse.json({ 
      success: true, 
      earnedXP, 
      totalXP: result.updatedUser.currentExp,
      level: result.updatedUser.rank
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}