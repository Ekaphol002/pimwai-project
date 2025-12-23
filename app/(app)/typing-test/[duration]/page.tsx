// app/typing-test/[duration]/page.tsx
import React from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import TypingTestGame from './TypingTestGame'; // Import ตัวเกมที่เราแยกไป

type Props = {
  params: Promise<{ duration: string }>
}

// ✅ 1. ส่วนทำ SEO Metadata
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { duration } = await params;
  
  // แปลงค่า duration เป็นนาที (เช่น '1-min' -> '1')
  const minutes = duration.split('-')[0] || '1';

  return {
    title: `ทดสอบพิมพ์เร็ว ${minutes} นาที วัดระดับ WPM | PIMWAI Typing Test`,
    description: `ทดสอบความเร็วการพิมพ์ของคุณในเวลา ${minutes} นาที เช็คความแม่นยำ (Accuracy) และ Words Per Minute (WPM) พร้อมระบบวิเคราะห์จุดอ่อน ฟรี!`,
    openGraph: {
      title: `ท้าประลองความเร็วพิมพ์ ${minutes} นาที! คุณจะพิมพ์ได้กี่คำ?`,
      description: 'มาทดสอบความเร็วนิ้วของคุณที่ PIMWAI เว็บฝึกพิมพ์ดีดภาษาไทยที่ทันสมัยที่สุด',
    },
    keywords: [`ทดสอบพิมพ์ ${minutes} นาที`, 'Typing Speed Test', 'แข่งพิมพ์เร็ว', 'วัด WPM', 'PIMWAI'],
  };
}

// ✅ 2. Server Component แสดงผลหน้าเว็บ
export default async function Page({ params }: Props) {
  const { duration } = await params;

  // ส่งค่า duration ไปให้ Client Component
  return <TypingTestGame durationParam={duration} />;
}