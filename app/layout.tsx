// app/layout.tsx
import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers/Providers";
import GlobalAudioPlayer from "@/components/GlobalAudioPlayer/GlobalAudioPlayer";

const sarabun = Sarabun({
  weight: ['400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://pimwai.com'),
  applicationName: 'PIMWAI (พิมพ์ไว)',
  title: {
    default: "ฝึกพิมพ์ & ฝึกพิมพ์ดีดออนไลน์ฟรี ฝึกพิมพ์สัมผัส 10 นิ้ว (WPM) | PIMWAI (พิมพ์ไว)",
    template: "%s | PIMWAI (พิมพ์ไว)"
  },
  description: "ฝึกพิมพ์ ฝึกพิมพ์ดีดออนไลน์ฟรี ฝึกพิมพ์สัมผัส 10 นิ้วภาษาไทย (แป้นเหย้า ฟ ห ก ด ่ า ส ว) และอังกฤษ ทดสอบความเร็วพิมพ์ดีด WPM เช็คความแม่นยำ เล่นได้ทันทีไม่ต้องสมัครสมาชิก",
  keywords: [
    "ฝึกพิมพ์",
    "ฝึกพิมพ์ดีด",
    "ฝึกพิมพ์ดีดออนไลน์ฟรี",
    "ฝึกพิมพ์สัมผัส",
    "ฝึกพิมพ์สัมผัส 10 นิ้ว",
    "ฝึกพิมพ์ ฟหกด ่าสว",
    "ทดสอบพิมพ์ดีด",
    "ทดสอบความเร็วพิมพ์ดีด",
    "ทดสอบ WPM",
    "โปรแกรมฝึกพิมพ์ดีด",
    "พิมพ์ดีดออนไลน์",
    "เรียนพิมพ์ดีด",
    "พิมพ์สัมผัสไทย",
    "เกมฝึกพิมพ์ดีด",
    "พิมพ์เร็ว",
    "Typing Test Thai",
    "Touch Typing",
    "PIMWAI",
    "พิมพ์ไว",
    "พิมไว"
  ],
  authors: [{ name: "PIMWAI Team", url: "https://pimwai.com" }],
  creator: "PIMWAI (พิมพ์ไว)",
  publisher: "PIMWAI (พิมพ์ไว)",
  alternates: {
    canonical: 'https://pimwai.com',
  },
  openGraph: {
    title: "PIMWAI (พิมพ์ไว) - ฝึกพิมพ์ดีดออนไลน์ฟรี ฝึกพิมพ์สัมผัส 10 นิ้ว & ทดสอบ WPM",
    description: "ฝึกพิมพ์ดีดภาษาไทยและอังกฤษออนไลน์ฟรี บทเรียนวางนิ้วสัมผัส 10 นิ้ว แป้นเหย้า ฟ ห ก ด ่ า ส ว พร้อมโหมดทดสอบความเร็ว WPM และจัดอันดับ",
    url: 'https://pimwai.com',
    siteName: 'PIMWAI (พิมพ์ไว)',
    images: [
      {
        url: '/Bannerlink.png',
        width: 1200,
        height: 630,
        alt: 'PIMWAI (พิมพ์ไว) ฝึกพิมพ์ดีดออนไลน์ฟรี ฝึกพิมพ์สัมผัส 10 นิ้ว และทดสอบความเร็ว WPM',
      }
    ],
    type: 'website',
    locale: 'th_TH',
  },
  twitter: {
    card: 'summary_large_image',
    title: "PIMWAI (พิมพ์ไว) - ฝึกพิมพ์ดีดออนไลน์ฟรี ฝึกพิมพ์สัมผัส 10 นิ้ว & ทดสอบ WPM",
    description: "ฝึกพิมพ์ดีดและพิมพ์สัมผัส 10 นิ้วออนไลน์ฟรี วัดความเร็วการพิมพ์ WPM พร้อมบทเรียนแป้นเหย้าครบวงจร",
    creator: '@PIMWAI',
    images: ['/Bannerlink.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  verification: {
    google: '7rPtM08TnFCA2VljLfk1ebNSDq4Gcw7A5ORojwvFnVY',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Schema.org Structured Data ครบชุด: WebSite (บังคับชื่อเว็บให้ Google แยกออกจาก Title), WebApplication และ SiteNavigationElement (สร้าง Sitelinks)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://pimwai.com/#website",
        "name": "PIMWAI (พิมพ์ไว)",
        "alternateName": ["PIMWAI", "พิมพ์ไว", "พิมไว", "ฝึกพิมพ์ดีด PIMWAI"],
        "url": "https://pimwai.com",
        "inLanguage": "th-TH"
      },
      {
        "@type": "WebApplication",
        "@id": "https://pimwai.com/#webapp",
        "name": "PIMWAI (พิมพ์ไว) - โปรแกรมฝึกพิมพ์ดีดออนไลน์และทดสอบพิมพ์สัมผัส 10 นิ้ว",
        "alternateName": ["ฝึกพิมพ์ดีด PIMWAI", "พิมพ์ไว", "Pimwai Typing Test"],
        "url": "https://pimwai.com",
        "applicationCategory": "EducationalApplication",
        "genre": "Typing Tutor & Speed Test",
        "operatingSystem": "All",
        "browserRequirements": "Requires JavaScript",
        "description": "เว็บฝึกพิมพ์ดีดออนไลน์ฟรี ฝึกพิมพ์สัมผัส 10 นิ้วภาษาไทย (ฟ ห ก ด ่ า ส ว) และอังกฤษ พร้อมระบบทดสอบความเร็ว WPM และวิเคราะห์คำผิด",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "THB"
        },
        "inLanguage": ["th", "en"]
      },
      {
        "@type": "ItemList",
        "name": "เมนูหลักเว็บไซต์ฝึกพิมพ์ดีด PIMWAI (พิมพ์ไว)",
        "itemListElement": [
          {
            "@type": "SiteNavigationElement",
            "position": 1,
            "name": "ฝึกพิมพ์ดีดด่วน & ทดสอบความเร็ว",
            "description": "ฝึกพิมพ์ดีดออนไลน์ฟรี จับเวลาเช็คความเร็ว WPM ภาษาไทยและอังกฤษ เล่นได้ทันทีไม่ต้องล็อกอิน",
            "url": "https://pimwai.com/"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 2,
            "name": "บทเรียนฝึกพิมพ์สัมผัส 10 นิ้ว",
            "description": "แบบฝึกหัดพิมพ์ดีดตั้งแต่พื้นฐาน แป้นเหย้า ฟ ห ก ด ่ า ส ว ไปจนถึงระดับสูงกว่า 100 ด่าน",
            "url": "https://pimwai.com/lessons"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 3,
            "name": "ทดสอบความเร็วพิมพ์ดีด (WPM Test)",
            "description": "สอบวัดความเร็วการพิมพ์ 1, 3 และ 5 นาที พร้อมกราฟวิเคราะห์ตัวอักษรที่พิมพ์ผิดบ่อย",
            "url": "https://pimwai.com/tests"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 4,
            "name": "ตารางจัดอันดับคนพิมพ์เร็ว (Leaderboard)",
            "description": "อันดับผู้เล่นที่มีความเร็วพิมพ์ดีด WPM และระดับแรงค์สูงสุดในประเทศไทย",
            "url": "https://pimwai.com/rankings"
          }
        ]
      }
    ]
  };

  return (
    <html lang="th" style={{ colorScheme: 'light only' }}>
      <head>
        <meta name="color-scheme" content="light only" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={sarabun.className}>
        <Providers>
          {children}
          <GlobalAudioPlayer />
        </Providers>
      </body>
    </html>
  );
}
