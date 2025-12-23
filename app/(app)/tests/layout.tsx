import StickyNavbar from '@/components/StickyNavbar/StickyNavbar';

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'วิเคราะห์จุดอ่อนการพิมพ์ เช็คคำที่พิมพ์ผิดบ่อย และกราฟความเร็ว | PIMWAI Test Analytics',
  description: 'เจาะลึกทักษะการพิมพ์ของคุณด้วยระบบวิเคราะห์อัจฉริยะ ดูรายชื่อแป้นพิมพ์และคำศัพท์ที่คุณพิมพ์ผิดบ่อยที่สุด (Most Frequent Errors) พร้อมกราฟแสดงแนวโน้มความเร็วในการทดสอบ 1 นาที, 3 นาที และ 5 นาที',
  keywords: [
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