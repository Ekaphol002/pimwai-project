import StickyNavbar from '@/components/StickyNavbar/StickyNavbar';

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ทดสอบความเร็วพิมพ์ดีด ทดสอบ WPM วิเคราะห์คำผิด',
  description: 'ทดสอบความเร็วในการพิมพ์ ทดสอบ WPM ภาษาไทยและอังกฤษ พร้อมระบบวิเคราะห์จุดอ่อนการพิมพ์ เช็คคำที่พิมพ์ผิดบ่อย และดูสถิติกราฟความเร็ว',
  keywords: [
    'ทดสอบความเร็วพิมพ์ดีด',
    'ทดสอบ WPM',
    'พิมพ์ดีดออนไลน์',
    'วิเคราะห์คำผิดพิมพ์ดีด',
    'แก้ปัญหาพิมพ์ผิดบ่อย',
    'ฝึกพิมพ์แก้คำผิด',
    'กราฟความเร็วพิมพ์ดีด',
    'Typing Error Analysis',
    'ประวัติการสอบพิมพ์ดีด',
    'หาจุดอ่อนการพิมพ์สัมผัส'
  ],
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">

      <StickyNavbar />

      <div className="flex flex-1 w-full max-w-screen-2xl mx-auto bg-gray-200"> {/* (พื้นหลังเทาอ่อน) */}

        <main className="flex-1 overflow-y-auto">
          {children} {/* <-- {children} คือ LessonsPage ของคุณ */}
        </main>


      </div>
    </div>
  );
}