import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'จัดอันดับคนพิมพ์เร็ว Leaderboard พิมพ์สัมผัส',
  description: 'ตารางจัดอันดับนักพิมพ์ดีดที่เร็วที่สุด เช็คสถิติผู้เล่นที่มี WPM สูงสุด แข่งแรงค์จัดอันดับพิมพ์ดีดไปกับเพื่อนๆ บน PIMWAI',
  keywords: ['อันดับคนพิมพ์เร็ว', 'จัดอันดับพิมพ์ดีด', 'Leaderboard พิมพ์ดีด', 'สถิติพิมพ์ดีด', 'แชมป์พิมพ์ดีด', 'แข่งพิมพ์ดีด'],
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">

      <div className="flex flex-1 w-full max-w-screen-2xl mx-auto bg-gray-200"> {/* (พื้นหลังเทาอ่อน) */}

        <main className="flex-1 overflow-y-auto">
          {children} {/* <-- {children} คือ LessonsPage ของคุณ */}
        </main>


      </div>
    </div>
  );
}