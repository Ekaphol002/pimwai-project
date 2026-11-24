// app/typing-test/[duration]/page.tsx
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
    title: `ทดสอบพิมพ์เร็ว ${minutes} นาที วัดระดับ WPM & ซ้อมสอบพิมพ์ดีด`,
    description: `ทดสอบความเร็วพิมพ์ดีดจับเวลา ${minutes} นาที เช็คค่าคำต่อนาที (WPM) ความแม่นยำ (Accuracy) และวิเคราะห์ตัวอักษรที่พิมพ์ผิดบ่อย ฟรีบน PIMWAI`,
    alternates: {
      canonical: `https://pimwai.com/typing-test/${duration}`,
    },
    openGraph: {
      title: `ท้าประลองความเร็วพิมพ์ ${minutes} นาที! คุณจะพิมพ์ได้กี่คำต่อนาที (WPM)?`,
      description: 'มาทดสอบความเร็วนิ้วของคุณที่ PIMWAI เว็บฝึกพิมพ์ดีดภาษาไทยที่ทันสมัยที่สุด',
      url: `https://pimwai.com/typing-test/${duration}`,
      images: ['/Bannerlink.png'],
    },
    keywords: [`ทดสอบพิมพ์ดีด ${minutes} นาที`, `สอบพิมพ์ดีด ${minutes} นาที`, 'Typing Speed Test', 'แข่งพิมพ์เร็ว', 'วัด WPM ภาษาไทย', 'PIMWAI'],
  };
}

// ✅ 2. Server Component แสดงผลหน้าเว็บ
export default async function Page({ params }: Props) {
  const { duration } = await params;

  // ส่งค่า duration ไปให้ Client Component
  return <TypingTestGame durationParam={duration} />;
}