import type { Metadata } from "next";
import { Sarabun } from "next/font/google";


const sarabun = Sarabun({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: 'PIMWAI ฝึกพิมพ์ดีดออนไลน์ฟรี | เว็บฝึกพิมพ์สัมผัสภาษาไทยที่ดีที่สุด ทดสอบความเร็ว WPM แม่นยำ',
  description: 'เว็บไซต์ฝึกพิมพ์ดีดอันดับ 1 พัฒนาทักษะการพิมพ์สัมผัส (Touch Typing) ของคุณให้เร็วขึ้น ด้วยบทเรียนที่เข้าใจง่าย เกมฝึกพิมพ์สนุกๆ และระบบทดสอบความเร็วการพิมพ์ที่แม่นยำ รองรับภาษาไทยและอังกฤษ เริ่มต้นฝึกฟรีวันนี้!',
  keywords: ['ฝึกพิมพ์ดีด', 'พิมพ์สัมผัส', 'ทดสอบความเร็วการพิมพ์', 'Typing Test', 'เรียนพิมพ์ดีดออนไลน์', 'เกมพิมพ์ดีด', 'PIMWAI', 'ฝึกพิมพ์แป้นเหย้า', 'วัดระดับความเร็วพิมพ์'],
  openGraph: {
    title: 'PIMWAI ฝึกพิมพ์ดีดออนไลน์ฟรี - อยากพิมพ์เร็วต้องที่นี่',
    description: 'ท้าพิสูจน์ความเร็วนิ้วของคุณ! เว็บฝึกพิมพ์ดีดที่ออกแบบมาเพื่อคนอยากพิมพ์เก่ง ใช้งานฟรี 100%',
    // images: ['/og-image-home.png'], // อย่าลืมใส่รูปปกเวลาแชร์
  },
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={sarabun.className}>

      {children}

    </div>
  );
}