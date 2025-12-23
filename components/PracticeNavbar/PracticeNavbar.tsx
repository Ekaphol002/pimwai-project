// components/PracticeNavbar/PracticeNavbar.tsx
"use client";

import Link from 'next/link';
import { ArrowLeft, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';

// ✅ 1. กำหนด Props ให้รับค่าตัวเลขมาเลย
type Props = {
  title?: string;        // ชื่อบทเรียน
  timer?: string;        // เวลา (สำหรับโหมด Test)
  currentScreen?: number; // ด่านปัจจุบัน (ลำดับที่)
  totalScreens?: number;  // จำนวนด่านทั้งหมดในบทนี้
};

export default function PracticeNavbar({ 
  title, 
  timer, 
  currentScreen = 1, // ค่า default ถ้าไม่ส่งมา
  totalScreens = 1   // ค่า default ถ้าไม่ส่งมา
}: Props) {
  const [isMuted, setIsMuted] = useState(false);
  const pathname = usePathname();

  // ❌ ลบ Logic การเดาเลขด่านทิ้งไปเลยครับ เราจะรับค่าที่ถูกต้องมาจาก Props แทน
  
  const displayTitle = title || "แบบฝึกหัดพิมพ์ดีด";

  const handleRestart = () => {
    window.location.reload();
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <nav className="w-full h-14 bg-[#3498db] text-white flex items-center justify-between px-4 shadow-sm z-40 relative">

      {/* ฝั่งซ้าย: ปุ่มย้อนกลับ */}
      <div className="flex-1 flex items-center gap-3">
        <Link href={pathname?.includes('test') ? "/tests" : "/lessons"} className="p-1 rounded-md hover:bg-black/10 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <span className="font-bold text-xl logo-font">PIMWAI</span>
      </div>

      {/* ตรงกลาง: ชื่อบทเรียน และ ตัวนับด่าน */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <span className="text-sm font-semibold line-clamp-1 px-2">{displayTitle}</span>
        
        {/* ✅ แสดง Screen X of Y ตามข้อมูลจริงจาก DB */}
        {!timer && (
           <span className="text-xs text-white/80">
             Screen {currentScreen} of {totalScreens}
           </span>
        )}
      </div>

      {/* ฝั่งขวา: จับเวลา & ปุ่มเครื่องมือ */}
      <div className="flex-1 flex items-center justify-end gap-3">
        {timer && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg mr-2 text-[20px] font-bold bg-white/10">
                <span>{timer}</span>
            </div>
        )}

        <button onClick={handleRestart} className="p-2 rounded-md hover:bg-black/10 transition-colors" title="Restart">
          <RotateCcw className="w-5 h-5" />
        </button>
        
        <button onClick={handleMute} className="p-2 rounded-md hover:bg-black/10 transition-colors" title={isMuted ? "Unmute" : "Mute"}>
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>
    </nav>
  );
}