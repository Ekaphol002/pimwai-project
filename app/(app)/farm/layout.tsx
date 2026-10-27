import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: 'ฝึกพิมพ์ดีดออนไลน์ฟรี โหมดพิมพ์ด่วน & ทดสอบความเร็ว WPM | PIMWAI',
  },
  description: 'ฝึกพิมพ์ดีดในโหมดพิมพ์ด่วนภาษาไทยและอังกฤษฟรี! ทดสอบความเร็วการพิมพ์ WPM จับเวลา 15/30/60 วินาที คลังคำศัพท์มาตรฐาน 1,000 คำ สะสม EXP อัปแรงค์ เล่นได้ทันทีไม่ต้องล็อกอิน',
  keywords: [
    'ฝึกพิมพ์',
    'ฝึกพิมพ์ดีด',
    'ทดสอบพิมพ์ดีด',
    'พิมพ์ด่วน',
    'พิมพ์สัมผัสไทย',
    'ทดสอบความเร็วพิมพ์ดีด',
    'monkeytype ภาษาไทย',
    'monkeytype thai',
    'พิมพ์ดีดจับเวลา',
    'แข่งพิมพ์เร็ว',
    'ทดสอบ wpm ไทย',
    'เกมพิมพ์ดีด'
  ],
  // รวมพลัง SEO เข้าสู่หน้าแรกหลัก (/) เพื่อไม่ให้เกิดปัญหา Duplicate Content แย่งอันดับกันเอง
  alternates: {
    canonical: 'https://pimwai.vercel.app',
  },
  openGraph: {
    title: 'ฝึกพิมพ์ดีดออนไลน์ฟรี โหมดพิมพ์ด่วน & ทดสอบความเร็ว WPM | PIMWAI',
    description: 'ฝึกพิมพ์ดีดภาษาไทยฟรี เช็คความเร็ว WPM เก็บ EXP ปลดล็อกแรงค์ พร้อมระบบคอมโบและเสียงแป้นพิมพ์สุดสมจริง เริ่มพิมพ์ได้ทันที',
    url: 'https://pimwai.vercel.app',
    siteName: 'PIMWAI (พิมพ์ไว)',
    images: [
      {
        url: '/Bannerlink.png',
        width: 1200,
        height: 630,
        alt: 'โหมดพิมพ์ด่วน พิมพ์ดีดไทยสไตล์ Monkeytype PIMWAI',
      },
    ],
    type: 'website',
    locale: 'th_TH',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ฝึกพิมพ์ดีดออนไลน์ฟรี โหมดพิมพ์ด่วน & ทดสอบความเร็ว WPM | PIMWAI',
    description: 'ฝึกพิมพ์ดีดภาษาไทยมาตรฐาน Monkeytype จับเวลาทดสอบ WPM เก็บเลเวลอัปแรงค์ฟรี',
    creator: '@PIMWAI',
    images: ['/Bannerlink.png'],
  },
};

export default function FarmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
