// app/layout.tsx
import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers/Providers";

const sarabun = Sarabun({
  weight: ['400', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
})

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://pimwai.vercel.app'),
  title: {
    default: "PIMWAI (พิมพ์ไว) - ฝึกพิมพ์ดีดออนไลน์ฟรี ทดสอบความเร็ว WPM พิมพ์สัมผัสไทย-อังกฤษ",
    template: "%s | PIMWAI"
  },
  description: "เว็บฝึกพิมพ์ดีดและฝึกพิมพ์สัมผัสออนไลน์อันดับ 1 ของไทย เล่นฟรี 100% สอนวิธีวางนิ้วที่ถูกต้องผ่านเกมและบทเรียนสนุกๆ พร้อมระบบทดสอบความเร็วในการพิมพ์ WPM ภาษาไทยและอังกฤษ เก็บคะแนนและจัดอันดับผู้เล่นทั่วประเทศ",
  keywords: [
    "ฝึกพิมพ์ดีด", "พิมพ์สัมผัส", "พิมพ์ดีดออนไลน์", "เกมฝึกพิมพ์", "พิมพ์ดีดไทย", "พิมพ์ดีดอังกฤษ",
    "เรียนพิมพ์ดีด", "พิมพ์เร็ว", "Typing Practice", "Touch Typing Thai",
    "ทดสอบความเร็วพิมพ์", "ฝึกวางนิ้ว", "ทดสอบ WPM", "พิมพ์ข้อความ", "PIMWAI", "พิมพ์ไว", "เกมพิมพ์ดีด", "แข่งพิมพ์เร็ว"
  ],
  authors: [{ name: "PIMWAI Team" }],
  alternates: {
    canonical: 'https://pimwai.vercel.app',
  },
  openGraph: {
    title: "PIMWAI (พิมพ์ไว) - อยากพิมพ์ไว ต้องมาฝึกที่นี่",
    description: "แพลตฟอร์มฝึกพิมพ์สัมผัสสมัยใหม่ เรียนรู้วิธีวางนิ้ว ทดสอบความเร็วพิมพ์ WPM ฟรี ไม่มีโฆษณา พร้อมระบบจัดอันดับ",
    url: 'https://pimwai.vercel.app',
    siteName: 'PIMWAI',
    images: [
      {
        url: '/logopimwai.png',
        width: 1200,
        height: 630,
        alt: 'PIMWAI ฝึกพิมพ์ดีดออนไลน์ฟรี',
      }
    ],
    type: 'website',
    locale: 'th_TH',
  },
  twitter: {
    card: 'summary_large_image',
    title: "PIMWAI - เว็บฝึกพิมพ์ดีดออนไลน์ฟรีและทดสอบความเร็ว WPM",
    description: "ฝึกพิมพ์สัมผัสให้เก่งขึ้นด้วยบทเรียนสนุกๆ และบททดสอบความเร็วพิมพ์ พร้อมแข่งจัดอันดับกับเพื่อนๆ",
    creator: '@PIMWAI',
    images: ['/logopimwai.png'],
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

import GlobalAudioPlayer from "@/components/GlobalAudioPlayer/GlobalAudioPlayer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Schema.org Structured Data for Google Rich Snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "PIMWAI",
    "alternateName": ["พิมพ์ไว", "Pimwai Typing"],
    "url": "https://pimwai.vercel.app",
    "applicationCategory": "EducationalApplication",
    "genre": "Typing Practice",
    "operatingSystem": "All",
    "browserRequirements": "Requires JavaScript",
    "description": "เว็บฝึกพิมพ์ดีดและทดสอบความเร็วในการพิมพ์สัมผัสออนไลน์ฟรี ภาษาไทยและภาษาอังกฤษ",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "THB"
    },
    "inLanguage": ["th", "en"]
  };

  return (
    <html lang="th">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={sarabun.className}>
        {/* ✅ 2. ครอบ Providers ไว้ตรงนี้ */}
        <Providers>
          {children}
          <GlobalAudioPlayer />
        </Providers>
      </body>
    </html>
  );
}