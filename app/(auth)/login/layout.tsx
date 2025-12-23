import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ | PIMWAI',
  description: 'เข้าสู่ระบบเพื่อบันทึกสถิติการพิมพ์ ดูอันดับคะแนน และติดตามพัฒนาการของคุณ',
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col"> 
      <main className="flex-1 overflow-y-auto">
        {children} {/* <-- {children} คือ LessonsPage ของคุณ */}
      </main>
    </div>
  );
}