import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'ตารางจัดอันดับคนพิมพ์เร็ว (Leaderboard) สถิติ WPM สูงสุด',
  description: 'ตารางจัดอันดับนักพิมพ์ดีดที่เร็วที่สุดในไทย เช็คสถิติผู้เล่นที่มีความเร็ว WPM และระดับแรงค์สูงสุด แข่งจัดอันดับพิมพ์สัมผัสออนไลน์ฟรีบน PIMWAI',
  keywords: [
    'อันดับคนพิมพ์เร็ว',
    'จัดอันดับพิมพ์ดีด',
    'Leaderboard พิมพ์ดีด',
    'สถิติพิมพ์ดีด WPM',
    'แชมป์พิมพ์ดีดไทย',
    'แข่งพิมพ์ดีดออนไลน์'
  ],
  alternates: {
    canonical: 'https://pimwai.vercel.app/rankings',
  },
  openGraph: {
    title: 'ตารางจัดอันดับคนพิมพ์เร็ว (Leaderboard) สถิติ WPM สูงสุด | PIMWAI',
    description: 'เช็คอันดับนักพิมพ์สัมผัสที่มีความเร็ว WPM และ EXP สูงสุดบน PIMWAI',
    url: 'https://pimwai.vercel.app/rankings',
    siteName: 'PIMWAI (พิมพ์ไว)',
    type: 'website',
    locale: 'th_TH',
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-1 w-full max-w-screen-2xl mx-auto bg-gray-200">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
