import StickyNavbar from '@/components/StickyNavbar/StickyNavbar';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'บทเรียนฝึกพิมพ์ดีด 10 นิ้ว แป้นเหย้า ฟ ห ก ด ่ า ส ว ฟรี',
  description: 'คลังบทเรียนฝึกพิมพ์ดีดและแบบฝึกหัดพิมพ์สัมผัส 10 นิ้วออนไลน์ฟรี ตั้งแต่พื้นฐานการวางนิ้วแป้นเหย้า (ฟ ห ก ด ่ า ส ว) สระ วรรณยุกต์ ไปจนถึงระดับสูงครบวงจร',
  keywords: [
    'บทเรียนพิมพ์ดีด',
    'ฝึกพิมพ์ ฟหกด ่าสว',
    'ฝึกพิมพ์แป้นเหย้า',
    'แบบฝึกหัดพิมพ์สัมผัส 10 นิ้ว',
    'สอนพิมพ์ดีดออนไลน์',
    'ฝึกวางนิ้วพิมพ์ดีด',
    'เรียนพิมพ์ดีดฟรี',
    'ฝึกพิมพ์ดีดไทย'
  ],
  alternates: {
    canonical: 'https://pimwai.vercel.app/lessons',
  },
  openGraph: {
    title: 'บทเรียนฝึกพิมพ์ดีด 10 นิ้ว แป้นเหย้า ฟ ห ก ด ่ า ส ว ฟรี | PIMWAI',
    description: 'เรียนพิมพ์สัมผัส 10 นิ้วออนไลน์ฟรี ตั้งแต่แป้นเหย้าพื้นฐานไปจนถึงพิมพ์ประโยคระดับมืออาชีพ',
    url: 'https://pimwai.vercel.app/lessons',
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
