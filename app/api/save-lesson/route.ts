// app/api/save-lesson/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    // 1. ตรวจสอบ Session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subLessonId, wpm, accuracy, stars, duration } = body;

    // 2. หา User ตัวจริง
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const userId = user.id;

    // 3. เริ่ม Transaction
    const result = await prisma.$transaction(async (tx) => {
        // หาประวัติการเล่นเดิม
        const existingProgress = await tx.lessonProgress.findUnique({
            where: { userId_subLessonId: { userId, subLessonId } },
        });

        let expGained = 0;
        const starBonus = stars === 3 ? 40 : stars * 10;
        const baseExp = 20 + starBonus; 
        let isNewHighScore = false;
        
        // ✅ [แก้จุดที่ 1]: เช็คว่า "เคยเล่นผ่านจริงไหม" (ไม่ใช่แค่เช็คว่ามี record ไหม)
        // ถ้าไม่มี record เลย หรือ มี record แต่ดาวเป็น 0 (คือเคยเข้ามาแล้วออก หรือเล่นไม่ผ่าน) ให้ถือว่าเป็น "ครั้งแรก"
        const isFirstClear = !existingProgress || existingProgress.stars === 0;

        if (isFirstClear) {
            // === กรณีเล่นผ่านครั้งแรก (หรือแก้ตัวจากที่เคยได้ 0 ดาว) ===
            expGained = baseExp; // ได้ EXP เต็ม
            isNewHighScore = true;

            if (!existingProgress) {
                // ถ้าไม่เคยมี record เลย -> Create
                await tx.lessonProgress.create({
                    data: { userId, subLessonId, wpm, accuracy, stars, duration, status: "completed" },
                });
            } else {
                // ✅ [แก้จุดที่ 2]: ถ้ามี record (แต่เป็น 0 ดาว) -> ต้อง Update แทน Create
                await tx.lessonProgress.update({
                    where: { userId_subLessonId: { userId, subLessonId } },
                    data: { wpm, accuracy, stars, duration, status: "completed", updatedAt: new Date() },
                });
            }

        } else {
            // === กรณีเล่นซ้ำ (เคยได้ดาวมาก่อนแล้ว) ===
            // เช็คว่าทำลายสถิติไหม
            const isBetterScore = wpm > existingProgress.wpm || stars > existingProgress.stars;
            
            if (isBetterScore) {
                expGained = 15; // ได้ EXP น้อยเพราะเล่นซ้ำ
                isNewHighScore = true;
                await tx.lessonProgress.update({
                    where: { userId_subLessonId: { userId, subLessonId } },
                    data: { wpm, accuracy, stars, duration, status: "completed", updatedAt: new Date() },
                });
            } else {
                // ถ้าคะแนนไม่ดีขึ้น ไม่ต้องทำอะไรกับ DB แค่คืนค่าเดิมกลับไป
                // หรืออาจจะแค่อัปเดต Last Played ก็ได้ถ้าต้องการ
            }
        }

        // --- ส่วน Quest Bonus (เหมือนเดิม) ---
        let questBonus = 0;
        const QUEST_REWARD = 100;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaysProgress = await tx.lessonProgress.findMany({
            where: { userId: userId, updatedAt: { gte: today } }
        });

        const dailyTotalLessons = todaysProgress.length;
        const dailyTotalTime = todaysProgress.reduce((sum, p) => sum + p.duration, 0);
        
        // Quest 1: เล่นครบ 15 นาที
        const prevTotalTime = dailyTotalTime - duration;
        if (dailyTotalTime >= 900 && prevTotalTime < 900) questBonus += QUEST_REWARD;
        
        // Quest 2: เล่นครบ 3 ด่าน
        // ✅ [ปรับ Logic Quest นิดหน่อย]: ให้นับเฉพาะถ้าเล่นผ่านครั้งแรกในวันนี้
        if (dailyTotalLessons === 3 && isFirstClear) questBonus += QUEST_REWARD;

        expGained += questBonus;

        // บังคับแจก 10 XP ขั้นต่ำ
        if (expGained < 10) expGained = 10;

        // อัปเดต User
        let updatedUser = user;
        const currentTotalExp = (user.currentExp || 0) + expGained;
        const newRank = Math.floor(currentTotalExp / 6000) + 1;
        
        let starsToAdd = stars;
        if (existingProgress) {
            // ถ้ามีของเก่า ให้บวกเพิ่มแค่ส่วนต่าง (เฉพาะกรณีได้ดาวเยอะขึ้น)
            if (stars > existingProgress.stars) {
                starsToAdd = stars - existingProgress.stars;
            } else {
                starsToAdd = 0;
            }
        }

        updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
                currentExp: currentTotalExp,
                rank: newRank,
                stars: { increment: starsToAdd }
            }
        });

        return { expGained, questBonus, isNewHighScore, updatedUser };
    });

    // 4. ส่งค่ากลับไปหน้าบ้าน
    return NextResponse.json({ 
      success: true, 
      earnedXP: result.expGained, 
      questBonus: result.questBonus,
      isNewHighScore: result.isNewHighScore,
      totalXP: result.updatedUser?.currentExp || 0,
      level: result.updatedUser?.rank || 1,
      stars: result.updatedUser?.stars || 0
    });

  } catch (error) {
    console.error('Error saving lesson:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}