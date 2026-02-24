import StickyNavbar from '@/components/StickyNavbar/StickyNavbar';
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'สถิติการพิมพ์ดีดและพัฒนาการ WPM',
  description: 'แดชบอร์ดสรุปผลการฝึกพิมพ์ดีดของคุณ ดูสถิติความเร็ว (WPM) เฉลี่ย ความแม่นยำ (Accuracy) และจำนวนวันที่ฝึกต่อเนื่อง (Streak) เช็คประวัติการเรียนรู้',
  keywords: [
    'สถิติการพิมพ์ดีด',
    'กราฟพัฒนาการพิมพ์',
    'เช็คประวัติการพิมพ์',
    'Typing Progress Tracker',
    'ดูสถิติ WPM ย้อนหลัง',
    'โปรแกรมเก็บสถิติพิมพ์ดีด',
    'วัดผลการฝึกพิมพ์สัมผัส',
    'พิมพ์ดีดเก็บเลเวล'
  ],
  // ป้องกันไม่ให้ Google เอาหน้าว่างๆ ไปโชว์ ถ้าหน้านี้ต้อง Login
  robots: {
    index: false, // ถ้าหน้านี้เป็นส่วนตัว (ต้อง Login) ให้ใส่ false เพื่อความปลอดภัย
    follow: true, // แต่ให้ Google ไต่ไปหน้าอื่นๆ ในเว็บได้
  },
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