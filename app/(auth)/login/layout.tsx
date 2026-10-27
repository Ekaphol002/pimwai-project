import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: 'เข้าสู่ระบบ | PIMWAI',
  },
  description: 'เข้าสู่ระบบ PIMWAI เพื่อบันทึกสถิติความเร็วพิมพ์ดีด (WPM) สะสม EXP เลื่อนแรงค์ และติดตามพัฒนาการฝึกพิมพ์สัมผัสของคุณ',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
