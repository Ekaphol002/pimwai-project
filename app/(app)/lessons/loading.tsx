import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center animate-fade-up">
        <Loader2 size={64} className="animate-spin text-[#5cb5db] mb-4" />
        
        <h2 className="text-2xl font-bold text-gray-700">กำลังโหลดบทเรียน...</h2>
        <p className="text-gray-500 mt-2">กรุณารอสักครู่</p>
      </div>
    </div>
  );
}