import type { Metadata } from "next";
import Navbar from "@/components/Navbar/Navbar";
import Footer from '@/components/Footer/Footer';
import PimwaiFloatingWidget from "@/components/PimwaiFloatingWidget/PimwaiFloatingWidget";

export const metadata: Metadata = {
  title: {
    absolute: 'ฝึกพิมพ์ดีดออนไลน์ฟรี ฝึกพิมพ์สัมผัส 10 นิ้ว & ทดสอบ WPM | PIMWAI',
  },
  description: 'ฝึกพิมพ์ดีดออนไลน์ฟรี! โปรแกรมฝึกพิมพ์สัมผัส 10 นิ้วภาษาไทย (แป้นเหย้า ฟ ห ก ด ่ า ส ว) และอังกฤษ ทดสอบความเร็วพิมพ์ดีด WPM และความแม่นยำ เล่นได้ทันทีไม่ต้องสมัครสมาชิก',
  keywords: [
    'ฝึกพิมพ์',
    'ฝึกพิมพ์ดีด',
    'ฝึกพิมพ์ดีดออนไลน์ฟรี',
    'ฝึกพิมพ์สัมผัส',
    'ฝึกพิมพ์สัมผัส 10 นิ้ว',
    'ฝึกพิมพ์ ฟหกด ่าสว',
    'ทดสอบพิมพ์ดีด',
    'ทดสอบความเร็วพิมพ์ดีด',
    'ทดสอบ WPM',
    'โปรแกรมฝึกพิมพ์',
    'พิมพ์ดีดไทย',
    'เรียนพิมพ์ดีด',
    'PIMWAI',
    'พิมพ์ไว'
  ],
  alternates: {
    canonical: 'https://pimwai.vercel.app',
  },
  openGraph: {
    title: 'ฝึกพิมพ์ดีดออนไลน์ฟรี ฝึกพิมพ์สัมผัส 10 นิ้ว & ทดสอบ WPM | PIMWAI',
    description: 'ฝึกพิมพ์ดีดภาษาไทยและอังกฤษออนไลน์ฟรี บทเรียนวางนิ้วสัมผัส 10 นิ้ว แป้นเหย้า ฟ ห ก ด ่ า ส ว พร้อมทดสอบความเร็ว WPM',
    url: 'https://pimwai.vercel.app',
    siteName: 'PIMWAI (พิมพ์ไว)',
    images: [
      {
        url: '/Bannerlink.png',
        width: 1200,
        height: 630,
        alt: 'PIMWAI ฝึกพิมพ์ดีดและทดสอบพิมพ์สัมผัส 10 นิ้วออนไลน์ฟรี',
      },
    ],
    type: 'website',
    locale: 'th_TH',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ฝึกพิมพ์ดีดออนไลน์ฟรี ฝึกพิมพ์สัมผัส 10 นิ้ว & ทดสอบ WPM | PIMWAI',
    description: 'เว็บฝึกพิมพ์ดีดออนไลน์ฟรี เช็คความเร็วพิมพ์ WPM พร้อมบทเรียนแป้นเหย้า 10 นิ้ว เริ่มพิมพ์ได้ทันทีไม่ต้องล็อกอิน',
    creator: '@PIMWAI',
    images: ['/Bannerlink.png'],
  },
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col items-center">
      <div className="w-full max-w-screen-2xl flex flex-col flex-1 bg-white relative">
        <Navbar />
        <main className="flex-1 bg-[#f0f4f8]">
          {children}
        </main>
        <Footer />
        <PimwaiFloatingWidget />
      </div>
    </div>
  );
}
