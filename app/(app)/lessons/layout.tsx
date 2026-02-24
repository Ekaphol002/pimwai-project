import StickyNavbar from '@/components/StickyNavbar/StickyNavbar';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'รวมบทเรียนฝึกพิมพ์ดีดครบวงจร แบบฝึกหัดพิมพ์สัมผัสออนไลน์',
  description: 'คลังบทเรียนฝึกพิมพ์ดีดฟรีมากกว่า 100 บทเรียน เรียนพิมพ์สัมผัสตั้งแต่ขั้นพื้นฐาน การวางนิ้ว แป้นเหย้า (Home Row) ไปจนถึงระดับมืออาชีพ พิมพ์เร็วขึ้นแน่นอน',
  keywords: ['บทเรียนพิมพ์ดีด', 'แบบฝึกหัดพิมพ์สัมผัส', 'สอนพิมพ์ดีดออนไลน์', 'ฝึกวางนิ้วพิมพ์ดีด', 'เรียนพิมพ์ดีดฟรี', 'ฝึกพิมพ์ดีดฟรี'],
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">

      <StickyNavbar />

      <div className="flex flex-1 w-full max-w-screen-2xl mx-auto bg-gray-200 "> {/* (พื้นหลังเทาอ่อน) */}

        <main className="flex-1 overflow-y-auto">
          {children} {/* <-- {children} คือ LessonsPage ของคุณ */}
        </main>


      </div>
    </div>
  );
}