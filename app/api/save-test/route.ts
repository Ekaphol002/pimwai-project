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
    const durationInMinutes = duration;

    let baseXp = wpm * 0.6;
    let accuracyMultiplier = 1;
    if (accuracy < 85) accuracyMultiplier = 0.5;
    if (accuracy < 50) accuracyMultiplier = 0;

    let earnedXP = Math.round((baseXp * durationInMinutes) * accuracyMultiplier);
    if (isNaN(earnedXP) || earnedXP < 0) earnedXP = 0;
    if (wpm > 100 && accuracy > 95) earnedXP += 10;

    // 💾 บันทึก
    const result = await prisma.$transaction(async (tx) => {
      const newTestResult = await tx.speedTestResult.create({
        data: {
          userId: user.id,
          duration, // ✅ เก็บเลข 1, 3, 5 ลง DB (ตรงกับวงสีเขียว)
          wpm,
          accuracy,
          mistakes // ✅ เก็บ JSON ลง DB (ตรงกับวงสีเขียว)
        }
      });

      let updatedUser = user;
      if (earnedXP > 0) {
        const currentTotalExp = (user.currentExp || 0) + earnedXP;
        const newRank = Math.floor(currentTotalExp / 6000) + 1;

        updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            currentExp: currentTotalExp,
            rank: newRank
          }
        });
      }
      return { newTestResult, updatedUser };
    });

    return NextResponse.json({
      success: true,
      earnedXP,
      totalXP: result.updatedUser.currentExp
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}