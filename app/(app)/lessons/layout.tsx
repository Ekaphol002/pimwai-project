import StickyNavbar from '@/components/StickyNavbar/StickyNavbar';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'บทเรียนฝึกพิมพ์สัมผัส 10 นิ้ว แป้นเหย้า ฟ ห ก ด ่ า ส ว ฟรี',
  description: 'แบบฝึกหัดพิมพ์ดีดออนไลน์ฟรี 230+ ด่าน หัดวางนิ้วแป้นเหย้า ฟ ห ก ด ่ า ส ว ฝึกพิมพ์สระ วรรณยุกต์ แป้นบน-ล่าง จากพื้นฐานสู่มืออาชีพ ไม่ต้องโหลดโปรแกรม',
  keywords: [
    'บทเรียนพิมพ์ดีด',
    'ฝึกพิมพ์ ฟหกด ่าสว',
    'ฝึกพิมพ์แป้นเหย้า',
    'แบบฝึกหัดพิมพ์สัมผัส 10 นิ้ว',
    'หัดพิมพ์ดีด มือใหม่',
    'ฝึกพิมพ์สระภาษาไทย วรรณยุกต์',
    'สอนวางนิ้วพิมพ์ดีด 10 นิ้ว',
    'เรียนพิมพ์ดีดออนไลน์ฟรี',
    'ฝึกพิมพ์ดีดไทย ก-ฮ'
  ],
  alternates: {
    canonical: 'https://pimwai.com/lessons',
  },
  openGraph: {
    title: 'บทเรียนฝึกพิมพ์สัมผัส 10 นิ้ว แป้นเหย้า ฟ ห ก ด ่ า ส ว ฟรี | PIMWAI (พิมพ์ไว)',
    description: 'เรียนพิมพ์สัมผัส 10 นิ้วออนไลน์ฟรี ตั้งแต่แป้นเหย้าพื้นฐาน สระ วรรณยุกต์ ไปจนถึงพิมพ์ประโยคระดับมืออาชีพ',
    url: 'https://pimwai.com/lessons',
    siteName: 'PIMWAI (พิมพ์ไว)',
    images: [
      {
        url: '/Bannerlink.png',
        width: 1200,
        height: 630,
        alt: 'บทเรียนฝึกพิมพ์สัมผัส 10 นิ้ว แป้นเหย้า ฟ ห ก ด ่ า ส ว บน PIMWAI',
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
      { "@type": "ListItem", "position": 2, "name": "บทเรียนฝึกพิมพ์สัมผัส 10 นิ้ว", "item": "https://pimwai.com/lessons" }
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
