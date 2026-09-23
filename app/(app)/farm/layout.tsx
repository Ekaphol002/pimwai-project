import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'โหมดพิมพ์ด่วน พิมพ์ดีดไทยสไตล์ Monkeytype - ทดสอบความเร็ว WPM & อัปแรงค์',
  description: 'โหมดพิมพ์ด่วน ฝึกพิมพ์สัมผัสภาษาไทยแบบ Monkeytype ทดสอบความเร็ว WPM จับเวลา 15/30/60 วินาที คลังคำไทยความถี่สูง 1,000 คำ พร้อมระบบเก็บ EXP อัปแรงค์ แข่งขันความเร็วพิมพ์ฟรี',
  keywords: [
    'พิมพ์ด่วน',
    'พิมพ์ดีดพิมพ์ด่วน',
    'monkeytype ภาษาไทย',
    'monkeytype thai',
    'พิมพ์ดีด monkeytype',
    'ฝึกพิมพ์ดีด',
    'ทดสอบความเร็วพิมพ์ดีด',
    'พิมพ์สัมผัสภาษาไทย',
    'พิมพ์ดีดจับเวลา',
    'แข่งพิมพ์เร็ว',
    'ทดสอบ wpm ไทย',
    'เกมพิมพ์ดีด'
  ],
  alternates: {
    canonical: '/farm',
  },
  openGraph: {
    title: 'โหมดพิมพ์ด่วน พิมพ์ดีดไทยสไตล์ Monkeytype | PIMWAI',
    description: 'ทดสอบความเร็วพิมพ์ WPM ภาษาไทยแบบ Monkeytype เก็บ EXP ปลดล็อกแรงค์ พร้อมระบบคอมโบและเสียงแป้นพิมพ์สุดสมจริง ฟรี 100%',
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
