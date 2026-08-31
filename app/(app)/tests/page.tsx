// app/tests/page.tsx
import React from 'react';
import { prisma } from '@/lib/prisma';
import TestDashboard from '@/components/TestDashboard/TestDashboard';
import { getServerSession } from "next-auth"; // ✅ 1. เพิ่ม
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // ✅ 2. เพิ่ม (เช็ค Path ให้ถูก)
import { redirect } from 'next/navigation'; // ✅ 3. เพิ่ม

// บังคับให้โหลดข้อมูลใหม่เสมอ (ไม่แคช) เพื่อให้เห็นผลสอบล่าสุดทันที
export const dynamic = 'force-dynamic';

export default async function TestMenuPage() {
  // 1. ตรวจสอบ Session (ใครล็อกอินอยู่?)
  const session = await getServerSession(authOptions);
  let user = null;

  if (session?.user?.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
  }

  // 2. ดึงผลสอบ Speed Test (ถ้าล็อกอิน) หรือส่ง array ว่างสำหรับ Guest
  const allResults = user ? await prisma.speedTestResult.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  }) : [];

  // 3. ส่งข้อมูลไปให้ Client Component จัดการต่อ
  return <TestDashboard allResults={allResults} />;
}