import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: 'PIMWAI (พิมพ์ไว) - โหมดพิมพ์ด่วน & ซ้อมพิมพ์เร็วภาษาไทยจับเวลา WPM ฟรี',
  },
  description: 'ฝึกพิมพ์ดีดภาษาไทยและอังกฤษในโหมดพิมพ์ด่วนจับเวลา 15/30/60 วินาที คลังคำง่ายใช้บ่อยพิมพ์ลื่น หรือเลือกโหมด Zen ซ้อมพิมพ์ไม่จับเวลา วัดความเร็ว WPM ความแม่นยำ พร้อมเสียงแป้นพิมพ์สมจริง เล่นฟรีบนเว็บทันทีไม่ต้องติดตั้ง',
  keywords: [
    'พิมพ์ด่วน',
    'ซ้อมพิมพ์เร็ว',
    'ฝึกพิมพ์ด่วน',
    'ฝึกพิมพ์ดีดจับเวลา',
    'ทดสอบพิมพ์ดีด 1 นาที',
    'ทดสอบพิมพ์ดีด 30 วินาที',
    'ฝึกพิมพ์ชิลล์',
    'ซ้อมพิมพ์ดีดไทย',
    'วัดความเร็วการพิมพ์ไทย wpm',
    'เช็ค wpm ภาษาไทย',
    'พิมพ์ดีดออนไลน์ไม่ต้องโหลด',
    'ฝึกพิมพ์คำง่าย',
    'เกมพิมพ์เร็วภาษาไทย'
  ],
  alternates: {
    canonical: 'https://pimwai.com/farm',
  },
  openGraph: {
    title: 'โหมดพิมพ์ด่วน & ซ้อมพิมพ์เร็วภาษาไทยจับเวลา WPM | PIMWAI (พิมพ์ไว)',
    description: 'ฝึกพิมพ์ดีดภาษาไทย คลังคำง่ายพิมพ์ลื่น จับเวลา 15/30/60 วิ เช็คความเร็ว WPM และความแม่นยำฟรี!',
    url: 'https://pimwai.com/farm',
    siteName: 'PIMWAI (พิมพ์ไว)',
    images: [
      {
        url: '/Bannerlink.png',
        width: 1200,
        height: 630,
        alt: 'โหมดพิมพ์ด่วน พิมพ์ดีดไทยสไตล์ Monkeytype PIMWAI (พิมพ์ไว)',
      },
    ],
    type: 'website',
    locale: 'th_TH',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PIMWAI (พิมพ์ไว) - ฝึกพิมพ์ดีดออนไลน์ฟรี โหมดพิมพ์ด่วน & ทดสอบความเร็ว WPM',
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
