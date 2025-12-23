"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Zap, Target } from 'lucide-react';

// --- (1) Type ของข้อมูลที่จะรับเข้ามา ---
interface HistoryItem {
  id: string;
  wpm: number;
  accuracy: number;
  createdAt: Date | string; // รับวันที่มา (จาก DB หรือ JSON)
}

interface TestHistoryListProps {
  history: HistoryItem[]; // ✅ รับประวัติการเล่นจริงมาจาก Dashboard (ที่กรองเวลามาแล้ว)
}

const ITEMS_PER_PAGE = 6;  // จำนวนรายการต่อ 1 หน้า

export default function TestHistoryList({ history }: TestHistoryListProps) {
  const [currentPage, setCurrentPage] = useState(1);     // เก็บหมายเลขหน้าปัจจุบัน

  // รีเซ็ตหน้าเมื่อข้อมูลเปลี่ยน (เช่น กดเปลี่ยนเวลา)
  useEffect(() => {
    setCurrentPage(1);
  }, [history]);

  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE); // จำนวนหน้าทั้งหมด
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;             // index เริ่มต้นของหน้านี้
  const currentData = history.slice(startIndex, startIndex + ITEMS_PER_PAGE); // 6 รายการปัจจุบัน

  const leftColumnData = currentData.slice(0, 3);   // 3 ช่องฝั่งซ้าย
  const rightColumnData = currentData.slice(3, 6);  // 3 ช่องฝั่งขวา

  const goToPrev = () => setCurrentPage((p) => Math.max(1, p - 1));           // ปุ่มย้อนกลับ
  const goToNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1)); // ปุ่มถัดไป

  // Component ย่อยเป็น Card ของ 1 รายการทดสอบ
  const HistoryCard = ({ item, delay }: { item: HistoryItem, delay: number }) => {
    const dateObj = new Date(item.createdAt);
    
    // แปลงวันที่และเวลาเป็นภาษาไทย
    const dateStr = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }); // 16 พ.ย. 68
    const timeStr = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';   // 10:11 น.

    return (
      <div 
        // ทำ animation ให้ Card ค่อยๆ ลอยขึ้น แบบมี delay ไล่กัน
        style={{ animationDelay: `${delay}s`, animationFillMode: 'forwards' }} 
        className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-200 cursor-default border border-transparent hover:border-blue-200 group h-[88px] opacity-0 animate-slideUpFade"
      >
        {/* ส่วนซ้าย: วัน - เวลา */}
        <div className="flex items-center gap-3">
            {/* วันที่ พร้อมไอคอนปฏิทิน */}
            <div className="flex items-center gap-2 text-gray-600 font-bold text-sm border-1 border-gray-300 px-4 py-2.5 rounded-lg group-hover:bg-gray-100 transition-colors">
                <Calendar size={16} className="text-gray-500 group-hover:text-gray-500" />
                <span>{dateStr}</span>
            </div>

            {/* เวลา */}
            <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                <Clock size={14} />
                <span>{timeStr}</span>
            </div>
        </div>

        {/* เส้นแบ่งตรงกลาง */}
        <div className="h-8 w-[1px] bg-gray-100 mx-2"></div>

        {/* ส่วนขวา: WPM และ Accuracy */}
        <div className="flex items-center gap-4">

          {/* WPM */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-yellow-500">
                <Zap size={12} fill="currentColor" />
                <span className="text-[10px] font-bold uppercase">Speed</span>
            </div>
            <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-bold text-gray-700">{item.wpm}</span>
                <span className="text-[10px] text-gray-400 font-bold">WPM</span>
            </div>
          </div>

          {/* Accuracy */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-green-500">
                <Target size={12} />
                <span className="text-[10px] font-bold uppercase">Acc.</span>
            </div>
            <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-bold text-gray-700">{item.accuracy}</span>
                <span className="text-[10px] text-gray-400 font-bold">%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full mt-8">
      
      {/* Header + ปุ่มเปลี่ยนหน้า */}
      <div className="flex justify-between items-end mb-4 px-2">
        <h3 className="text-white font-bold text-2sm uppercase opacity-90 tracking-wide flex items-center gap-2">
           ประวัติการพิมพ์ (ล่าสุด 30 วัน)
        </h3>
        
        {/* แสดงปุ่มเปลี่ยนหน้าเฉพาะตอนมีมากกว่า 1 หน้า */}
        {totalPages > 1 && (
          <div className="flex gap-2 items-center bg-white/10 px-2 py-1 rounded-lg">

            {/* ปุ่มซ้าย */}
            <button 
              onClick={goToPrev} 
              disabled={currentPage === 1} 
              className="p-1 rounded hover:bg-white/20 disabled:opacity-30 text-white transition-colors active:scale-95 transform"
            >
              <ChevronLeft size={20} strokeWidth={3} />
            </button>

            {/* ตัวเลข page / total */}
            <span className="text-white text-xs font-mono px-1 font-bold select-none">
              {currentPage} / {totalPages}
            </span>

            {/* ปุ่มขวา */}
            <button 
              onClick={goToNext} 
              disabled={currentPage === totalPages} 
              className="p-1 rounded hover:bg-white/20 disabled:opacity-30 text-white transition-colors active:scale-95 transform"
            >
              <ChevronRight size={20} strokeWidth={3} />
            </button>

          </div>
        )}
      </div>

      {/* Grid แสดง 2 คอลัมน์ / animate ใหม่ทุกครั้งที่ history เปลี่ยน */}
      <div 
        key={`history-page-${currentPage}`}  // บังคับให้ re-render เพื่อรีเซ็ต animation เมื่อเปลี่ยนหน้า
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="flex flex-col gap-4">
            {leftColumnData.map((item, i) => (
                <HistoryCard key={item.id} item={item} delay={i * 0.07} />
            ))}
        </div>

        <div className="flex flex-col gap-4">
            {rightColumnData.map((item, i) => (
                <HistoryCard key={item.id} item={item} delay={(i + 3) * 0.07} />
            ))}
        </div>
      </div>

      {/* ถ้าไม่มีข้อมูลเลย */}
      {history.length === 0 && (
        <div className="text-center py-10 text-white opacity-50 font-medium">
            ยังไม่มีประวัติการทดสอบในโหมดนี้
        </div>
      )}
      
      {/* CSS keyframe ของ animation slideUpFade */}
      <style jsx>{`
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUpFade {
          animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

    </div>
  );
}