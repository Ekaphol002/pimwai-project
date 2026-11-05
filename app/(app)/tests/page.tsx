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

  // 2. ดึงผลสอบ Speed Test (ถ้าล็อกอิน) หรือส่ง array ว่างสำหรับ Guest
  const allResults = userId ? await prisma.speedTestResult.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  }) : [];

  // 3. ส่งข้อมูลไปให้ Client Component จัดการต่อ
  return <TestDashboard allResults={allResults} />;
}