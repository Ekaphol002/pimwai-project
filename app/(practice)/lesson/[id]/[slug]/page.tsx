// app/lesson/[id]/[slug]/page.tsx

import React from 'react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
// ✅ Import Navbar ตัวใหม่
import PracticeNavbar from '@/components/PracticeNavbar/PracticeNavbar'; 
import PracticeModeCharacter from '../../PracticeModeCharacter';
import PracticeModeWord from '../../PracticeModeWord';

// ✅ 1. Import สำหรับ Auth, Redirect และ Metadata
import { redirect } from 'next/navigation';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { Metadata, ResolvingMetadata } from 'next'; 

// บังคับให้เป็น Dynamic Rendering เพราะต้องเช็ค Session และ Params เปลี่ยนตลอด
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;   // ตรงกับชื่อโฟลเดอร์ [id]
    slug: string; // ตรงกับชื่อโฟลเดอร์ [slug]
  }>;
}

// ✅ ส่วนที่เพิ่ม: สร้าง Metadata + ดึง Icon จากตัวแม่มาใช้
export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // ต้อง await params ก่อน (Next.js 15)
  const { slug } = await params;
  
  // ดึงข้อมูลเฉพาะส่วนที่จำเป็นสำหรับ SEO
  const subLesson = await prisma.subLesson.findUnique({
    where: { id: slug },
    include: { lesson: true }
  });

  // 🔥 ดึงการตั้งค่า Icon จาก Layout ตัวแม่ (RootLayout) มาใช้ต่อ
  // เพื่อแก้ปัญหาโลโก้หายในหน้า Dynamic
  const parentIcons = (await parent).icons || {};

  if (!subLesson) {
    return { 
      title: 'ไม่พบเนื้อหา | PIMWAI',
      icons: parentIcons // ส่ง Icon กลับไปแม้ไม่เจอเนื้อหา
    };
  }

  // สร้าง Title และ Description
  const pageTitle = `${subLesson.lesson.title}: ${subLesson.title} | ฝึกพิมพ์ PIMWAI`;
  
  return {
    title: pageTitle,
    description: `ฝึกพิมพ์ดีดบทเรียน ${subLesson.title} ในโหมด ${subLesson.mode} พัฒนาทักษะการพิมพ์ของคุณให้เร็วและแม่นยำยิ่งขึ้น`,
    openGraph: {
      title: pageTitle,
      description: `มาแข่งพิมพ์บทเรียน "${subLesson.title}" กันเถอะ!`,
    },
    // ✅ ยัด Icon ใส่กลับเข้าไป เพื่อให้ Browser รู้ว่าต้องใช้รูปเดิม
    icons: parentIcons, 
  };
}

// ✅ ส่วนแสดงผลหลัก (Main Component)
export default async function LessonPlayPage({ params }: PageProps) {
  // 1. เช็ค Session ก่อนเป็นอันดับแรก
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login'); // ถ้าไม่มี Session ดีดไป Login ทันที
  }

  // 2. ดึงค่าจาก Params
  const { id, slug } = await params;
  const lessonId = id;
  const subLessonId = slug;

  // 3. ดึงข้อมูลด่านปัจจุบัน + ดึง "พี่น้อง" ทั้งหมดในบทเดียวกันมาด้วย
  const subLesson = await prisma.subLesson.findUnique({
    where: { id: subLessonId },
    include: {
      lesson: {
        include: {
          subLessons: {
            orderBy: { id: 'asc' },
            select: { id: true } 
          }
        }
      }
    }
  });
  
  if (!subLesson) {
    return <div className="p-10 text-center text-red-500">ไม่พบข้อมูลบทเรียน...</div>;
  }

  // 4. คำนวณหา Screen X of Y
  const allSubLessons = subLesson.lesson.subLessons;
  const totalScreens = allSubLessons.length; 
  const currentIndex = allSubLessons.findIndex(s => s.id === subLesson.id);
  const currentScreen = currentIndex + 1;

  let nextUrl = undefined; 
  // กรณี A: ยังมีด่านเหลือในบทเรียนเดิม
  if (currentIndex < allSubLessons.length - 1) {
    const nextSubLessonId = allSubLessons[currentIndex + 1].id;
    nextUrl = `/lesson/${lessonId}/${nextSubLessonId}`;
  } 
  // กรณี B: จบบทเรียนนี้แล้ว -> ไปหาบทเรียนถัดไป
  else {
    const nextLesson = await prisma.lesson.findFirst({
      where: {
        level: subLesson.lesson.level,      
        order: subLesson.lesson.order + 1   
      },
      include: {
        subLessons: {
          orderBy: { id: 'asc' },
          take: 1 
        }
      }
    });

    if (nextLesson && nextLesson.subLessons.length > 0) {
      nextUrl = `/lesson/${nextLesson.id}/${nextLesson.subLessons[0].id}`;
    }
  }

  const gameProps = {
    initialText: subLesson.content,
    subLessonId: subLesson.id,
    nextUrl: nextUrl
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Navbar */}
      <PracticeNavbar 
        title={`${subLesson.lesson.title} - ${subLesson.title}`}
        currentScreen={currentScreen}
        totalScreens={totalScreens}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 lg:p-10">
        <div className="w-full max-w-5xl">
          {subLesson.mode === 'character' ? (
            <PracticeModeCharacter {...gameProps} />
          ) : subLesson.mode === 'word' ? (
            <PracticeModeWord {...gameProps} />
          ) : (
            <div>ไม่พบโหมด: {subLesson.mode}</div>
          )}
        </div>
      </main>

    </div>
  );
}