import type { Metadata } from "next";
import Navbar from "@/components/Navbar/Navbar";
import Footer from '@/components/Footer/Footer';
import PimwaiFloatingWidget from "@/components/PimwaiFloatingWidget/PimwaiFloatingWidget";

export const metadata: Metadata = {
  title: 'ฝึกพิมพ์ดีด (Typing Test) - ฝึกพิมพ์สัมผัสไทย 10 นิ้ว ทดสอบพิมพ์เร็วออนไลน์ฟรี | PIMWAI',
  description: 'ฝึกพิมพ์ดีดออนไลน์ฟรี! ทดสอบพิมพ์ดีด ฝึกพิมพ์สัมผัส 10 นิ้วภาษาไทยและอังกฤษ เช็คความเร็ว WPM ความแม่นยำ พร้อมโหมดพิมพ์ด่วน เล่นได้ทันทีไม่ต้องล็อกอิน มีระบบอัปแรงค์และบทเรียนวางนิ้วที่ PIMWAI',
  keywords: [
    'ฝึกพิมพ์',
    'ฝึกพิมพ์ดีด',
    'ทดสอบพิมพ์ดีด',
    'ฝึกพิมพ์สัมผัส',
    'พิมพ์สัมผัส 10 นิ้ว',
    'ทดสอบความเร็วการพิมพ์',
    'typing test thai',
    'พิมพ์เร็ว',
    'เกมฝึกพิมพ์ดีด',
    'พิมพ์ดีดออนไลน์',
    'เรียนพิมพ์ดีด',
    'PIMWAI',
    'พิมพ์ไว'
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ฝึกพิมพ์ดีด (Typing Test) - ฝึกพิมพ์สัมผัสไทย 10 นิ้วออนไลน์ฟรี | PIMWAI',
    description: 'ฝึกพิมพ์ดีดออนไลน์ฟรี! เคาะแป้นทดสอบความเร็วพิมพ์ (WPM) และฝึกพิมพ์สัมผัส 10 นิ้วได้ทันทีไม่ต้องล็อกอิน',
    url: 'https://pimwai.vercel.app',
    siteName: 'PIMWAI',
    images: [
      {
        url: '/logopimwai.png',
        width: 1200,
        height: 630,
        alt: 'PIMWAI ฝึกพิมพ์ดีดและทดสอบพิมพ์สัมผัสออนไลน์ฟรี',
      },
    ],
    type: 'website',
    locale: 'th_TH',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ฝึกพิมพ์ดีด (Typing Test) - ฝึกพิมพ์สัมผัสไทย 10 นิ้วออนไลน์ฟรี | PIMWAI',
    description: 'เว็บฝึกพิมพ์ดีดออนไลน์ฟรี เช็คความเร็วพิมพ์ WPM เริ่มพิมพ์ได้ทันทีไม่ต้องสมัครสมาชิก',
    creator: '@PIMWAI',
    images: ['/logopimwai.png'],
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