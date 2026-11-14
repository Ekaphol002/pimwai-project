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

  // 2. ดึงสถิติดีที่สุดตลอดกาล (Best Scores) ของผู้ใช้ในทุกโหมดเวลา เพื่อให้ถ้วย Best Speed ไม่หายเด็ดขาด
  const bestScores = userId ? await prisma.speedTestResult.findMany({
    where: { userId },
    orderBy: [{ wpm: 'desc' }, { accuracy: 'desc' }],
    distinct: ['duration'],
  }) : [];

  // 3. ดึงผลสอบย้อนหลัง 30 วันล่าสุด
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentResults = userId ? await prisma.speedTestResult.findMany({
    where: {
      userId,
      createdAt: { gte: thirtyDaysAgo }
    },
    orderBy: { createdAt: 'desc' }
  }) : [];

  // รวมคะแนนสถิติสูงสุดเข้ากับผลสอบล่าสุด (ป้องกันสถิติสูงสุดหาย 100%)
  const resultMap = new Map<string, any>();
  for (const item of bestScores) {
    resultMap.set(item.id, item);
  }
  for (const item of recentResults) {
    resultMap.set(item.id, item);
  }
  const allResults = Array.from(resultMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // 4. ส่งข้อมูลไปให้ Client Component จัดการต่อ
  return <TestDashboard allResults={allResults} />;
}