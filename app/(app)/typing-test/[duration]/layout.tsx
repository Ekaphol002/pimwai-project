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