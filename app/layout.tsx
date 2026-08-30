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
  metadataBase: new URL('https://pimwai.vercel.app'), // ⚠️ เปลี่ยนเป็นโดเมนจริงของคุณเมื่อ Deploy
  title: {
    default: "PIMWAI - ฝึกพิมพ์ดีดออนไลน์ฟรี ทดสอบความเร็ว WPM พิมพ์สัมผัส",
    template: "%s | PIMWAI"
  },
  description: "เว็บฝึกพิมพ์ดีดและพิมพ์สัมผัสที่ดีที่สุด เรียนรู้วิธีวางนิ้วที่ถูกต้องผ่านเกมและบทเรียนสนุกๆ ทดสอบความเร็วในการพิมพ์ ทดสอบ WPM ภาษาไทยและอังกฤษ พร้อมระบบเก็บสถิติ",
  keywords: [
    "ฝึกพิมพ์ดีด", "พิมพ์สัมผัส", "พิมพ์ดีดออนไลน์", "เกมฝึกพิมพ์", "พิมพ์ดีดไทย", "พิมพ์ดีดอังกฤษ",
    "เรียนพิมพ์ดีด", "พิมพ์เร็ว", "Typing Practice", "Touch Typing Thai",
    "ทดสอบความเร็วพิมพ์", "ฝึกวางนิ้ว", "ทดสอบ WPM", "พิมพ์ข้อความ", "PIMWAI", "เกมพิมพ์ดีด"
  ],
  authors: [{ name: "PIMWAI Team" }],
  openGraph: {
    title: "PIMWAI - อยากพิมพ์ไว ต้องมาฝึกที่นี่",
    description: "แพลตฟอร์มฝึกพิมพ์สัมผัสสมัยใหม่ เล่นฟรี ไม่มีโฆษณากวนใจ พร้อมทดสอบความเร็วและระบบจัดอันดับ",
    url: 'https://pimwai.vercel.app',
    siteName: 'PIMWAI',
    images: ['/icon.png'], // อย่าลืมทำรูป cover สวยๆ ชื่อ og-image.png ไว้ใน folder public
    type: 'website',
    locale: 'th_TH',
  },
  twitter: {
    card: 'summary_large_image',
    title: "PIMWAI - เว็บฝึกพิมพ์ดีดออนไลน์ฟรีและทดสอบความเร็ว WPM",
    description: "ฝึกพิมพ์สัมผัสให้เก่งขึ้นด้วยบทเรียนสนุกๆ และบททดสอบความเร็วพิมพ์ พร้อมแข่งจัดอันดับกับเพื่อนๆ",
    creator: '@PIMWAI',
    images: ['/icon.png'],
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
  return (
    <html lang="en">
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