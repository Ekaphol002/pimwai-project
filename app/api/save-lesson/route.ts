// app/api/save-lesson/route.ts
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
    const { subLessonId, wpm, accuracy, stars, duration } = body;

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const userId = user.id;

    // เริ่ม Transaction
    const result = await prisma.$transaction(async (tx) => {
        const existingProgress = await tx.lessonProgress.findUnique({
            where: { userId_subLessonId: { userId, subLessonId } },
        });

        // --- 1. คำนวณ Base XP (จากการเล่นปกติ) ---
        let baseLessonExp = 0; 
        const starBonus = stars === 3 ? 40 : stars * 10;
        const fullExp = 20 + starBonus; 
        let isNewHighScore = false;
        
        const isFirstClear = !existingProgress || existingProgress.stars === 0;

        if (isFirstClear) {
            baseLessonExp = fullExp; 
            isNewHighScore = true;
            if (!existingProgress) {
                await tx.lessonProgress.create({
                    data: { userId, subLessonId, wpm, accuracy, stars, duration, status: "completed" },
                });
            } else {
                await tx.lessonProgress.update({
                    where: { userId_subLessonId: { userId, subLessonId } },
                    data: { wpm, accuracy, stars, duration, status: "completed", updatedAt: new Date() },
                });
            }
        } else {
            const isBetterScore = wpm > existingProgress.wpm || stars > existingProgress.stars;
            if (isBetterScore) {
                baseLessonExp = 15; 
                isNewHighScore = true;
                await tx.lessonProgress.update({
                    where: { userId_subLessonId: { userId, subLessonId } },
                    data: { wpm, accuracy, stars, duration, status: "completed", updatedAt: new Date() },
                });
            }
        }

        // --- 2. คำนวณ Quest Bonus (เพิ่มเควส 95% ตรงนี้) ---
        let questBonus = 0;
        let completedQuestInfo = null; 
        const QUEST_REWARD = 100;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // ดึงประวัติวันนี้ (รวมอันปัจจุบันที่เพิ่งบันทึกไปตะกี้ด้วย)
        const todaysProgress = await tx.lessonProgress.findMany({
            where: { userId: userId, updatedAt: { gte: today } }
        });

        const dailyTotalLessons = todaysProgress.length; 
        const dailyTotalTime = todaysProgress.reduce((sum, p) => sum + p.duration, 0);
        
        let completedQuestsCount = 0; // ตัวนับว่ารอบนี้เสร็จกี่เควส
        let lastQuestText = "";       // เก็บชื่อเควสล่าสุด

        // ✅ Quest 1: เล่นครบ 15 นาที
        const prevTotalTime = dailyTotalTime - duration;
        if (dailyTotalTime >= 900 && prevTotalTime < 900) {
            questBonus += QUEST_REWARD;
            completedQuestsCount++;
            lastQuestText = "พิมพ์ครบ 15 นาที";
        }
        
        // ✅ Quest 2: เล่นครบ 3 ด่าน (เฉพาะ First Clear)
        if (dailyTotalLessons === 3 && isFirstClear) {
             questBonus += QUEST_REWARD;
             completedQuestsCount++;
             lastQuestText = "ผ่าน 3 บทเรียน";
        }

        // ✅ Quest 3: ความแม่นยำ 95% (เควสใหม่!)
        // เช็คว่าวันนี้มีกี่ด่านที่ได้ >= 95% (รวมด่านนี้แล้ว)
        const highAccLessons = todaysProgress.filter(p => p.accuracy >= 95).length;
        
        // ถ้าด่านนี้ได้ >= 95% และเป็น "ครั้งแรกของวัน" (count == 1) ให้รางวัล
        // (ถ้า count > 1 แปลว่าเคยได้รางวัลไปแล้วจากด่านอื่น)
        if (accuracy >= 95 && highAccLessons === 1) {
            questBonus += QUEST_REWARD;
            completedQuestsCount++;
            lastQuestText = "แม่นยำ 95%!";
        }

        // --- สรุปข้อความเควส ---
        if (completedQuestsCount > 0) {
            if (completedQuestsCount > 1) {
                completedQuestInfo = { text: "ภารกิจคอมโบ!", xp: questBonus };
            } else {
                completedQuestInfo = { text: lastQuestText, xp: questBonus };
            }
        }

        // --- 3. อัปเดต User ---
        let totalExpGained = baseLessonExp + questBonus;
        if (totalExpGained < 10) totalExpGained = 10;

        const currentTotalExp = (user.currentExp || 0) + totalExpGained;
        
        // Logic Rank แบบใหม่ (ตามที่คุณให้มา)
        // Max Cap = 35000 -> Rank 3 / 5 Stars
        const MAX_CAP_EXP = 35000;
        const EXP_PER_RANK = 6000;
        const EXP_PER_STAR = 1000;

        let newRank = 1;
        
        if (currentTotalExp >= MAX_CAP_EXP) {
            newRank = 3;
        } else {
            newRank = Math.floor(currentTotalExp / EXP_PER_RANK) + 1;
            if (newRank > 3) newRank = 3;
        }
        
        // คำนวณ Stars ที่จะเพิ่ม (Logic เดิมของคุณบวก increment ทีละนิด แต่ถ้าจะเอาเป๊ะตาม Exp ต้องคำนวณใหม่)
        // เพื่อความปลอดภัย ใช้ Logic เดิมไปก่อน หรือจะ Reset ดาวตาม Rank ใหม่ก็ได้
        // ตรงนี้ขอคง Logic เดิมไว้ก่อนเพื่อไม่ให้กระทบระบบดาวสะสม
        let starsToAdd = stars;
        if (existingProgress && stars > existingProgress.stars) {
            starsToAdd = stars - existingProgress.stars;
        } else if (existingProgress) {
            starsToAdd = 0;
        }

        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
                currentExp: currentTotalExp,
                rank: newRank,
                stars: { increment: starsToAdd }
            }
        });

        return { 
            baseLessonExp, 
            questBonus, 
            completedQuestInfo, 
            isNewHighScore, 
            updatedUser 
        };
    });

    return NextResponse.json({ 
      success: true, 
      earnedXP: result.baseLessonExp, 
      questBonus: result.questBonus, 
      completedQuest: result.completedQuestInfo, 
      isNewHighScore: result.isNewHighScore,
      totalXP: result.updatedUser?.currentExp || 0,
    });

  } catch (error) {
    console.error('Error saving lesson:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}