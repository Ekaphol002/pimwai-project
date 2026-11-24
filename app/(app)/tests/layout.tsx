import StickyNavbar from '@/components/StickyNavbar/StickyNavbar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ทดสอบพิมพ์ดีดจับเวลา 1, 3, 5 นาที เช็ค WPM & ซ้อมสอบราชการ',
  description: 'ทดสอบความเร็วพิมพ์ดีดออนไลน์ (Typing Speed Test) จับเวลา 1, 3 และ 5 นาที วัดค่าคำต่อนาที (WPM) ซ้อมสอบพิมพ์ดีดราชการ ธุรการ พร้อมกราฟวิเคราะห์ตัวอักษรที่พิมพ์ผิดบ่อยฟรี',
  keywords: [
    'ทดสอบพิมพ์ดีด',
    'ทดสอบพิมพ์ดีด 1 นาที',
    'ทดสอบพิมพ์ดีด 3 นาที',
    'ทดสอบพิมพ์ดีด 5 นาที',
    'ซ้อมสอบพิมพ์ดีดราชการ',
    'สอบพิมพ์ดีด ธุรการ 35 คำต่อนาที',
    'วัดความเร็วการพิมพ์ WPM ภาษาไทย',
    'วิเคราะห์คำผิดพิมพ์ดีด',
    'Typing Speed Test Thai'
  ],
  alternates: {
    canonical: 'https://pimwai.com/tests',
  },
  openGraph: {
    title: 'ทดสอบพิมพ์ดีดจับเวลา 1, 3, 5 นาที เช็ค WPM & ซ้อมสอบราชการ | PIMWAI',
    description: 'สอบวัดความเร็วการพิมพ์ดีด 1, 3 และ 5 นาที เช็คค่า WPM พร้อมกราฟวิเคราะห์จุดอ่อนตัวอักษรที่พิมพ์ผิดบ่อย',
    url: 'https://pimwai.com/tests',
    siteName: 'PIMWAI (พิมพ์ไว)',
    images: [
      {
        url: '/Bannerlink.png',
        width: 1200,
        height: 630,
        alt: 'ทดสอบความเร็วพิมพ์ดีด WPM 1 3 5 นาที บน PIMWAI',
      },
    ],
    type: 'website',
    locale: 'th_TH',
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "หน้าแรก", "item": "https://pimwai.com" },
      { "@type": "ListItem", "position": 2, "name": "ทดสอบความเร็วพิมพ์ดีด (WPM)", "item": "https://pimwai.com/tests" }
    ]
  };

  return (
    <div className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <StickyNavbar />
      <div className="flex flex-1 w-full max-w-screen-2xl mx-auto bg-gray-200">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
