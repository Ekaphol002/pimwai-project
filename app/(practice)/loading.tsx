import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-gray-400">
      <Loader2 size={64} className="animate-spin mb-4 text-[#5cb5db]" />
      <p className="text-xl font-bold">กำลังโหลดข้อมูล...</p>
    </div>
  );
}