import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    // ✅ แก้ไข: กำหนดความสูงที่ div แม่ เป็น (ความสูงหน้าจอ - Navbar 80px)
    // ใช้ justify-center เพื่อจัดให้อยู่กึ่งกลางแนวตั้ง
    <div className="w-full min-h-[calc(120vh-80px)] flex flex-col items-center justify-center bg-gray-100 gap-4">
      
      {/* ไอคอนหมุนๆ */}
      <Loader2 size={56} className="text-[#5cb5db] animate-spin" />
      
      {/* ✅ แก้ไข: เอา h-[800px] ออก เพื่อให้ text ขนาดปกติ */}
      <p className="text-gray-400 font-medium animate-pulse">
        กำลังโหลดข้อมูล...
      </p>
      
    </div>
  );
}