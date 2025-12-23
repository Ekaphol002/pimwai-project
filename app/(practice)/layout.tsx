export default function PracticeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
         <div className="flex flex-col min-h-screen overflow-hidden">
             {/* คุณอาจจะใส่ Navbar แบบย่อ หรือ Header ของโหมดฝึกซ้อมตรงนี้ */}
             <main className="flex-1 bg-gray-100">
                 {children} {/* ตัวนี้แหละคือเนื้อหาที่มาจาก page.tsx ด้านบน */}
             </main>
        </div>
    );
}