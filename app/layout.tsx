// app/layout.tsx
import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers/Providers";

const sarabun = Sarabun({
  weight: ['400', '500', '600', '700'],
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
    default: "ฝึกพิมพ์ดีด (Typing Test) - ฝึกพิมพ์สัมผัสไทย 10 นิ้ว ทดสอบพิมพ์เร็วออนไลน์ฟรี | PIMWAI",
    template: "%s | PIMWAI ฝึกพิมพ์ดีดออนไลน์"
  },
  description: "ฝึกพิมพ์ดีดและทดสอบพิมพ์สัมผัสออนไลน์อันดับ 1 ของไทย เล่นฟรี 100% วัดความเร็ว WPM และความแม่นยำ พร้อมบทเรียนฝึกวางนิ้ว 10 นิ้ว และโหมดพิมพ์ด่วน เล่นได้ทันทีไม่ต้องล็อกอิน",
  keywords: [
    "ฝึกพิมพ์",
    "ฝึกพิมพ์ดีด",
    "ทดสอบพิมพ์ดีด",
    "พิมพ์สัมผัส",
    "พิมพ์สัมผัส 10 นิ้ว",
    "พิมพ์ดีดออนไลน์",
    "เกมฝึกพิมพ์",
    "พิมพ์ดีดไทย",
    "พิมพ์ดีดอังกฤษ",
    "เรียนพิมพ์ดีด",
    "พิมพ์เร็ว",
    "Typing Practice",
    "Touch Typing Thai",
    "ทดสอบความเร็วพิมพ์",
    "ฝึกวางนิ้ว",
    "ทดสอบ WPM",
    "PIMWAI",
    "พิมไว",
    "เกมพิมพ์ดีด",
    "แข่งพิมพ์เร็ว"
  ],
  authors: [{ name: "PIMWAI Team" }],
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
    "name": "PIMWAI (พิมพ์ไว)",
    "alternateName": ["ฝึกพิมพ์ดีด PIMWAI", "พิมไว", "Pimwai Typing", "พิมพ์ดีดไทย", "Pimwai"],
    "url": "https://pimwai.vercel.app",
    "applicationCategory": "EducationalApplication",
    "genre": "Typing Test & Touch Typing Practice",
    "operatingSystem": "All",
    "browserRequirements": "Requires JavaScript",
    "description": "เว็บฝึกพิมพ์ดีดออนไลน์ฟรี ทดสอบความเร็วในการพิมพ์ WPM และฝึกพิมพ์สัมผัส 10 นิ้วภาษาไทยและอังกฤษ",
    "keywords": "ฝึกพิมพ์, ฝึกพิมพ์ดีด, ทดสอบพิมพ์ดีด, พิมพ์สัมผัส, พิมพ์ดีดออนไลน์, Typing Test",
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