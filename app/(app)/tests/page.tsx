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

  // 2. ดึง User ตัวจริงจาก Database (เพื่อเอา ID)
  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email! }
  });

  // ถ้ามี Session แต่ไม่มี User ใน DB (กันเหนียว)
  if (!user) {
    return <div>ไม่พบข้อมูลผู้ใช้</div>;
  }

  // 3. ✅ ดึงผลสอบ Speed Test ทั้งหมดของ User คนนี้ (ใช้ user.id จริง)
  const allResults = await prisma.speedTestResult.findMany({
    where: { userId: user.id }, // 👈 ใช้ ID จริงตรงนี้
    orderBy: { createdAt: 'desc' }
  });

  // 4. ส่งข้อมูลไปให้ Client Component จัดการต่อ
  return <TestDashboard allResults={allResults} />;
}