import type { Metadata } from "next";
import Navbar from "@/components/Navbar/Navbar";
import Footer from '@/components/Footer/Footer';
import PimwaiFloatingWidget from "@/components/PimwaiFloatingWidget/PimwaiFloatingWidget";

export const metadata: Metadata = {
  title: 'PIMWAI (พิมพ์ไว) - ฝึกพิมพ์ดีดออนไลน์ฟรี ทดสอบความเร็ว WPM สไตล์ Monkeytype',
  description: 'เว็บฝึกพิมพ์ดีดและทดสอบความเร็วพิมพ์สัมผัสภาษาไทยสไตล์ Monkeytype ฟรี 100% วางนิ้วแล้วเคาะแป้นเริ่มพิมพ์ได้ทันทีโดยไม่ต้องสมัครสมาชิก พร้อมระบบจับเวลา วิเคราะห์ WPM และเก็บ EXP',
  keywords: ['ฝึกพิมพ์ดีด', 'monkeytype ภาษาไทย', 'monkeytype thai', 'พิมพ์สัมผัส', 'ทดสอบความเร็วการพิมพ์', 'Typing Test', 'เรียนพิมพ์ดีดออนไลน์', 'เกมพิมพ์ดีด', 'PIMWAI', 'พิมพ์ด่วน', 'วัดระดับความเร็วพิมพ์'],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'PIMWAI (พิมพ์ไว) - ฝึกพิมพ์ดีดออนไลน์ฟรี พิมพ์ได้ทันทีสไตล์ Monkeytype',
    description: 'ทดสอบความเร็วนิ้วของคุณทันที! เว็บฝึกพิมพ์ดีดภาษาไทยมาตรฐาน Monkeytype เคาะแป้นได้เลยไม่ต้องล็อกอิน ใช้งานฟรี 100%',
    url: 'https://pimwai.vercel.app',
    siteName: 'PIMWAI',
    images: [
      {
        url: '/logopimwai.png',
        width: 1200,
        height: 630,
        alt: 'PIMWAI ฝึกพิมพ์ดีดออนไลน์ฟรี สไตล์ Monkeytype',
      },
    ],
    type: 'website',
    locale: 'th_TH',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PIMWAI (พิมพ์ไว) - ฝึกพิมพ์ดีดออนไลน์ฟรี พิมพ์ได้ทันทีสไตล์ Monkeytype',
    description: 'ทดสอบความเร็วพิมพ์ดีดภาษาไทยมาตรฐาน Monkeytype เริ่มพิมพ์ได้ทันทีไม่ต้องล็อกอิน',
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