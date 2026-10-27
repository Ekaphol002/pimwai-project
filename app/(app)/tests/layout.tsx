import StickyNavbar from '@/components/StickyNavbar/StickyNavbar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ทดสอบพิมพ์ดีดออนไลน์ เช็คความเร็ว WPM & วิเคราะห์คำผิด',
  description: 'ทดสอบความเร็วพิมพ์ดีด (Typing Speed Test) จับเวลา 1, 3 และ 5 นาที วัดค่า WPM และความแม่นยำ พร้อมระบบวิเคราะห์ตัวอักษรที่พิมพ์ผิดบ่อยฟรี',
  keywords: [
    'ทดสอบพิมพ์ดีด',
    'ทดสอบความเร็วพิมพ์ดีด',
    'ทดสอบ WPM',
    'วัดความเร็วการพิมพ์',
    'สอบพิมพ์ดีดออนไลน์',
    'วิเคราะห์คำผิดพิมพ์ดีด',
    'กราฟความเร็วพิมพ์ดีด',
    'Typing Speed Test Thai'
  ],
  alternates: {
    canonical: 'https://pimwai.vercel.app/tests',
  },
  openGraph: {
    title: 'ทดสอบพิมพ์ดีดออนไลน์ เช็คความเร็ว WPM & วิเคราะห์คำผิด | PIMWAI',
    description: 'สอบวัดความเร็วการพิมพ์ดีด 1, 3 และ 5 นาที เช็คค่า WPM พร้อมกราฟวิเคราะห์จุดอ่อนตัวอักษรที่พิมพ์ผิดบ่อย',
    url: 'https://pimwai.vercel.app/tests',
    siteName: 'PIMWAI (พิมพ์ไว)',
    type: 'website',
    locale: 'th_TH',
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <StickyNavbar />
      <div className="flex flex-1 w-full max-w-screen-2xl mx-auto bg-gray-200">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
