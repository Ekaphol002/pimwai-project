// app/tests/page.tsx
import React from 'react';
import { prisma } from '@/lib/prisma';
import TestDashboard from '@/components/TestDashboard/TestDashboard';
import { getServerSession } from "next-auth"; // ✅ 1. เพิ่ม
import { authOptions } from "@/lib/auth"; // ✅ Import จาก @/lib/auth
import { redirect } from 'next/navigation'; // ✅ 3. เพิ่ม

// บังคับให้โหลดข้อมูลใหม่เสมอ (ไม่แคช) เพื่อให้เห็นผลสอบล่าสุดทันที
export const dynamic = 'force-dynamic';

export default async function TestMenuPage() {
  // 1. ตรวจสอบ Session (ใช้ userId จาก JWT ทันทีถ้ามี เพื่อลดรอบการคิวรีฐานข้อมูล)
  const session = await getServerSession(authOptions);
  let userId: string | null = (session?.user as any)?.id || null;

  if (!userId && session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });
    userId = user?.id || null;
  }

  // 2. จัดการข้อมูลอัตโนมัติ: ลบประวัติ Speed Test ที่เกิน 30 วันออก (แต่ไม่ลบประวัติดีที่สุด/มากที่สุดเด็ดขาด)
  if (userId) {
    try {
      // 2.1 หาคะแนนที่ดีที่สุดของแต่ละระยะเวลา (1, 3, 5 นาที) เพื่อปกป้องไว้
      const bestScores = await prisma.speedTestResult.findMany({
        where: { userId },
        orderBy: [
          { wpm: 'desc' },
          { accuracy: 'desc' },
          { createdAt: 'desc' }
        ],
        distinct: ['duration'],
        select: { id: true }
      });
      const keepIds = bestScores.map(b => b.id);

      // 2.2 ลบประวัติที่เกิน 30 วันออกอัตโนมัติ (ยกเว้น Best Scores ของแต่ละโหมด)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      await prisma.speedTestResult.deleteMany({
        where: {
          userId,
          createdAt: { lt: thirtyDaysAgo },
          ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {})
        }
      });
    } catch (err) {
      console.error("Auto cleanup speed test error:", err);
    }
  }

  // 3. ดึงผลสอบ Speed Test ทั้งหมดที่เหลืออยู่ของผู้ใช้ (แสดงผล Dashboard พร้อม Best Score ไม่ติดหน้า Empty)
  const allResults = userId ? await prisma.speedTestResult.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  }) : [];

  // 4. ส่งข้อมูลไปให้ Client Component จัดการต่อ
  return <TestDashboard allResults={allResults} />;
}