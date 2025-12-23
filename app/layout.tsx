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
  description: "เว็บไซต์ฝึกพิมพ์ดีดและพิมพ์สัมผัสที่ดีที่สุด เรียนรู้วิธีวางนิ้วที่ถูกต้อง ผ่านเกมสนุกๆ และบทเรียนฟรี ทดสอบความเร็ว WPM พร้อมระบบเก็บสถิติพัฒนาการ",
  keywords: [
    "ฝึกพิมพ์ดีด", "พิมพ์สัมผัส", "พิมพ์ดีดออนไลน์", "เกมฝึกพิมพ์", 
    "เรียนพิมพ์ดีด", "พิมพ์เร็ว", "Typing Practice", "Touch Typing Thai", 
    "ทดสอบความเร็วพิมพ์", "ฝึกวางนิ้ว", "PIMWAI"
  ],
  authors: [{ name: "PIMWAI Team" }],
  openGraph: {
    title: "PIMWAI - อยากพิมพ์ไว ต้องมาฝึกที่นี่",
    description: "แพลตฟอร์มฝึกพิมพ์สัมผัสสมัยใหม่ เล่นฟรี ไม่มีโฆษณากวนใจ พร้อมระบบจัดอันดับ",
    images: ['/icon.png'], // อย่าลืมทำรูป cover สวยๆ ชื่อ og-image.png ไว้ใน folder public
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  }
};

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
        </Providers>
      </body>
    </html>
  );
}