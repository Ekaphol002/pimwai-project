// app/lesson/[id]/[slug]/page.tsx

import { prisma } from '@/lib/prisma';
import PracticeNavbar from '@/components/PracticeNavbar/PracticeNavbar';
import PracticeModeCharacter from '../../PracticeModeCharacter';
import PracticeModeWord from '../../PracticeModeWord';

// ❌ ลบ Import Auth และ Redirect ออก
// import { redirect } from 'next/navigation';
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import type { Metadata, ResolvingMetadata } from 'next';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
    slug: string;
  }>;
}

// ✅ ส่วน Metadata (เก็บไว้เหมือนเดิม)
export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  
  const subLesson = await prisma.subLesson.findUnique({
    where: { id: slug },
    include: { lesson: true }
  });

  const parentIcons = (await parent).icons || {};

  if (!subLesson) {
    return { 
      title: 'ไม่พบเนื้อหา | PIMWAI',
      icons: parentIcons 
    };
  }

  const pageTitle = `${subLesson.lesson.title}: ${subLesson.title} | ฝึกพิมพ์ PIMWAI`;
  
  return {
    title: pageTitle,
    description: `ฝึกพิมพ์ดีดบทเรียน ${subLesson.title} ...`,
    icons: {
      icon: '/icon.png', 
      shortcut: '/icon.png',
      apple: '/icon.png',
    },
  };
}

// ✅ ส่วนแสดงผลหลัก (Main Component)
export default async function LessonPlayPage({ params }: PageProps) {
  // ❌ ลบส่วนเช็ค Session ออกได้เลย (Middleware กันให้แล้ว)
  /*
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect('/login');
  }
  */

  // 1. ดึงค่าจาก Params
  const { id, slug } = await params;
  const lessonId = id;
  const subLessonId = slug;

  // 2. ดึงข้อมูลด่านปัจจุบัน + ดึง "พี่น้อง" ทั้งหมดในบทเดียวกันมาด้วย
  const subLesson = await prisma.subLesson.findUnique({
    where: { id: subLessonId },
    include: {
      lesson: {
        include: {
          subLessons: {
            orderBy: { order: 'asc' },
            select: { id: true }
          }
        }
      }
    }
  });

  if (!subLesson) {
    return <div className="p-10 text-center text-red-500">ไม่พบข้อมูลบทเรียน...</div>;
  }

  // 3. คำนวณหา Screen X of Y
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
          orderBy: { order: 'asc' },
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
        key={`nav-${subLesson.id}`}
        title={`${subLesson.lesson.title} - ${subLesson.title}`}
        currentScreen={currentScreen}
        totalScreens={totalScreens}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 lg:p-10">
        <div className="w-full max-w-5xl">
          {subLesson.mode === 'character' ? (
            <PracticeModeCharacter key={subLesson.id} {...gameProps} />
          ) : subLesson.mode === 'word' ? (
            <PracticeModeWord key={subLesson.id} {...gameProps} />
          ) : (
            <div>ไม่พบโหมด: {subLesson.mode}</div>
          )}
        </div>
      </main>

    </div>
  );
}