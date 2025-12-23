import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'จัดอันดับนักพิมพ์เร็วที่สุดในไทย Top Leaderboard | ใครพิมพ์ไวที่สุดมาดูที่นี่ | PIMWAI Ranking',
  description: 'ตารางอันดับยอดมนุษย์นิ้วสายฟ้า ดูสถิติผู้เล่นที่มี WPM สูงที่สุดตลอดกาล อยากรู้ว่าคุณอยู่อันดับที่เท่าไหร่ มาเช็คเลย',
  keywords: ['อันดับคนพิมพ์เร็ว', 'Leaderboard พิมพ์ดีด', 'สถิติพิมพ์ดีด', 'แชมป์พิมพ์ดีด'],
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