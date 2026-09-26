import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ฝึกพิมพ์ดีด (โหมดพิมพ์ด่วน) - ทดสอบความเร็วพิมพ์สัมผัสไทย WPM | PIMWAI',
  description: 'ฝึกพิมพ์ดีดในโหมดพิมพ์ด่วนภาษาไทยฟรี! ทดสอบพิมพ์ดีด เช็คความเร็ว WPM จับเวลา 15/30/60 วินาที คลังคำศัพท์ความถี่สูง 1,000 คำ สะสม EXP อัปแรงค์ แข่งความเร็วพิมพ์กับเพื่อนๆ ได้ทันทีไม่ต้องล็อกอิน',
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
  alternates: {
    canonical: '/farm',
  },
  openGraph: {
    title: 'ฝึกพิมพ์ดีด (โหมดพิมพ์ด่วน) - ทดสอบความเร็วพิมพ์สัมผัสไทย WPM | PIMWAI',
    description: 'ฝึกพิมพ์ดีดภาษาไทยฟรี เช็คความเร็ว WPM เก็บ EXP ปลดล็อกแรงค์ พร้อมระบบคอมโบและเสียงแป้นพิมพ์สุดสมจริง เริ่มพิมพ์ได้ทันที',
    url: 'https://pimwai.vercel.app/farm',
    siteName: 'PIMWAI',
    images: [
      {
        url: '/logopimwai.png',
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
    title: 'โหมดพิมพ์ด่วน พิมพ์ดีดไทยสไตล์ Monkeytype | PIMWAI',
    description: 'ฝึกพิมพ์ดีดภาษาไทยมาตรฐาน Monkeytype จับเวลาทดสอบ WPM เก็บเลเวลอัปแรงค์ฟรี',
    creator: '@PIMWAI',
    images: ['/logopimwai.png'],
  },
};

export default function FarmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Schema.org Structured Data เฉพาะหน้าพิมพ์ด่วน */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'PIMWAI Quick Type Mode (โหมดพิมพ์ด่วน Monkeytype ไทย)',
            operatingSystem: 'Any',
            applicationCategory: 'GameApplication',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'THB',
            },
            description: 'โหมดฝึกพิมพ์ดีดภาษาไทยมาตรฐาน Monkeytype ทดสอบความเร็ว WPM และสะสม EXP อัปแรงค์',
            inLanguage: ['th', 'en'],
          }),
        }}
      />
      {children}
    </>
  );
}
