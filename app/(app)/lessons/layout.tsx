import StickyNavbar from '@/components/StickyNavbar/StickyNavbar';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'รวมบทเรียนฝึกพิมพ์ดีดครบวงจร | แบบฝึกหัดพิมพ์สัมผัสตั้งแต่พื้นฐานจนถึงระดับเซียน | PIMWAI Lessons',
  description: 'คลังบทเรียนฝึกพิมพ์ดีดมากกว่า 100 บทเรียน เรียงลำดับความยากง่าย เริ่มตั้งแต่การวางนิ้ว แป้นเหย้า (Home Row) ไปจนถึงการพิมพ์ประโยคยาวๆ และสัญลักษณ์พิเศษ ฝึกครบจบคอร์สพิมพ์คล่องแน่นอน',
  keywords: ['บทเรียนพิมพ์ดีด', 'แบบฝึกหัดพิมพ์สัมผัส', 'สอนพิมพ์ดีดเบื้องต้น', 'ฝึกวางนิ้วพิมพ์ดีด', 'คอร์สเรียนพิมพ์ดีดฟรี'],
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