import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full min-h-[calc(120vh-80px)] flex flex-col items-center justify-center bg-gray-100 gap-4">
      <Loader2 size={56} className="text-[#5cb5db] animate-spin" />
      <p className="text-gray-400 font-medium animate-pulse">
        กำลังโหลดข้อมูล...
      </p>
    </div>
  );
}