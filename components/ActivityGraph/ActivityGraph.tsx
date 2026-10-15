"use client";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { toDateKey, calculateCurrentStreak } from '@/lib/streakUtils';

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];
const WEEK_DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

interface DayStatItem {
  wpm: number;
  accuracy: number;
  duration: number;
}

interface StreakCalendarProps {
  completedDates?: string[]; // รูปแบบ "YYYY-MM-DD"
  dailyStats?: Record<string, DayStatItem>; // สถิติของแต่ละวัน { "YYYY-MM-DD": { wpm, accuracy, duration } }
}

export default function StreakCalendar({ 
  completedDates = [], 
  dailyStats = {} 
}: StreakCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  // แยก Popup อิสระ: กดตารางบนก็ขึ้นเฉพาะตารางบน, กดตารางล่างก็ขึ้นเฉพาะตารางล่าง ไม่เด้งพร้อมกัน
  const [activePopup, setActivePopup] = useState<{
    source: 'top' | 'calendar';
    dateKey: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // ปิด Popup เมื่อคลิกพื้นที่อื่นภายนอก
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActivePopup(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // คำนวณ Streak (นับเฉพาะที่ติดต่อกัน)
  const currentStreak = useMemo(() => calculateCurrentStreak(completedDates), [completedDates]);

  // คำนวณข้อมูลปฏิทิน
  const { calendarData } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    // ช่องว่างก่อนวันที่ 1
    for (let i = 0; i < firstDay; i++) {
      days.push({ type: 'empty' as const, key: `empty-${i}` });
    }

    // วันที่ 1 ถึงสิ้นเดือน
    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(year, month, i);
      const dateKey = toDateKey(dateObj); // "YYYY-MM-DD"

      const isCompleted = completedDates.includes(dateKey);
      const isToday = dateKey === toDateKey(new Date());

      days.push({
        type: 'day' as const,
        key: dateKey,
        dayNumber: i,
        isCompleted: isCompleted,
        isToday: isToday
      });
    }
    return { calendarData: days };
  }, [currentDate, completedDates]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
    setActivePopup(null);
  };

  const formatDuration = (totalSec: number) => {
    if (!totalSec || totalSec <= 0) return "0 นาที";
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (hours > 0) {
      return `${hours} ชม. ${minutes > 0 ? `${minutes} นาที` : ''}`.trim();
    }
    if (minutes > 0) {
      return `${minutes} นาที ${seconds > 0 ? `${seconds} วิ` : ''}`.trim();
    }
    return `${seconds} วิ`;
  };

  return (
    <div ref={containerRef} className="w-full max-w-sm flex flex-col gap-2">

      {/* --- กล่องที่ 1: สถิติต่อเนื่อง --- */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="text-gray-800 font-bold text-base flex items-center gap-2">
            สถิติต่อเนื่อง
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-500">
            <Flame size={18} fill="currentColor" />
            <span className="text-xl font-black leading-none">{currentStreak}</span>
            <span className="text-xs font-bold mt-0.5">วัน</span>
          </div>
        </div>

        <div className="flex justify-between items-center px-1">
          {(() => {
            const today = new Date();
            const startOf7Days = new Date(today);
            startOf7Days.setDate(today.getDate() - 6);

            return Array.from({ length: 7 }).map((_, i) => {
              const d = new Date(startOf7Days);
              d.setDate(startOf7Days.getDate() + i);
              const dateKey = toDateKey(d);
              const isCompleted = completedDates.includes(dateKey);
              const isToday = dateKey === toDateKey(today);
              const dayName = WEEK_DAYS[d.getDay()];
              const isPopupOpen = activePopup?.source === 'top' && activePopup?.dateKey === dateKey;
              const stat = dailyStats[dateKey];

              const isLeftEdge = i <= 1;
              const isRightEdge = i >= 5;

              return (
                <div key={i} className="flex flex-col items-center gap-1.5 relative">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePopup(prev =>
                        prev?.source === 'top' && prev?.dateKey === dateKey
                          ? null
                          : { source: 'top', dateKey }
                      );
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer select-none ${
                      isCompleted
                        ? 'bg-orange-500 text-white shadow-sm shadow-orange-200 hover:scale-110 active:scale-95'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:scale-105 active:scale-95'
                    } ${isToday && !isCompleted ? 'ring-2 ring-orange-400 ring-offset-1' : ''} ${
                      isPopupOpen ? 'ring-2 ring-slate-800 ring-offset-2' : ''
                    }`}
                    title={`${d.getDate()} ${THAI_MONTHS[d.getMonth()]}`}
                  >
                    {isCompleted ? (
                      <Flame size={16} fill="currentColor" />
                    ) : (
                      <span className="text-[10px] font-bold">{dayName}</span>
                    )}
                  </button>
                  <span className={`text-[10px] font-medium ${isToday ? 'text-orange-500 font-bold' : 'text-gray-400'}`}>
                    {dayName}
                  </span>

                  {/* 🌟 Popup สถิติสไตล์เรียบหรู ไม่มีไอคอน/อิโมจิ */}
                  {isPopupOpen && (
                    <div
                      className="absolute bottom-full mb-2.5 z-50 bg-[#1e293b] text-white px-3 py-2 rounded-xl shadow-xl border border-slate-700/60 select-none text-center animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap"
                      style={{
                        left: isLeftEdge ? '0%' : isRightEdge ? 'auto' : '50%',
                        right: isRightEdge ? '0%' : 'auto',
                        transform: !isLeftEdge && !isRightEdge ? 'translateX(-50%)' : 'none'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* วันที่ */}
                      <div className="text-xs font-bold text-white text-center leading-tight">
                        {d.getDate()} {THAI_MONTHS[d.getMonth()]} {d.getFullYear() + 543}
                      </div>

                      {/* ข้อมูล WPM | Acc | Time */}
                      {stat ? (
                        <div className="text-[11px] font-semibold text-gray-200 flex items-center justify-center gap-1.5 whitespace-nowrap mt-1 leading-none">
                          <span>{stat.wpm} WPM</span>
                          <span className="text-slate-500 font-normal">|</span>
                          <span>{stat.accuracy}% Acc</span>
                          <span className="text-slate-500 font-normal">|</span>
                          <span>{formatDuration(stat.duration)}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-gray-400 text-center mt-1 whitespace-nowrap">
                          ไม่มีประวัติการพิมพ์
                        </div>
                      )}

                      {/* หางลูกศรชี้ลงไปยังวัน */}
                      <div
                        className="absolute top-full border-4 border-transparent border-t-[#1e293b]"
                        style={{
                          left: isLeftEdge ? '14px' : isRightEdge ? 'auto' : '50%',
                          right: isRightEdge ? '14px' : 'auto',
                          transform: !isLeftEdge && !isRightEdge ? 'translateX(-50%)' : 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* --- กล่องที่ 2: ปฏิทิน --- */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
        {/* ส่วนควบคุมเดือน */}
        <div className="flex items-center justify-between mb-4">
          <button 
            type="button"
            onClick={() => changeMonth(-1)} 
            className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-bold text-gray-700">
            {THAI_MONTHS[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
          </span>
          <button 
            type="button"
            onClick={() => changeMonth(1)} 
            className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition cursor-pointer"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* ตารางปฏิทิน */}
        <div>
          <div className="grid grid-cols-7 mb-3 text-center">
            {WEEK_DAYS.map((day, index) => (
              <span key={index} className={`text-[10px] font-medium ${index === 0 || index === 6 ? 'text-red-400' : 'text-gray-400'}`}>
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {calendarData.map((item, idx) => {
              if (item.type === 'empty') {
                return <div key={item.key} className="h-9 flex items-center justify-center" />;
              }

              const colIndex = idx % 7;
              const rowIndex = Math.floor(idx / 7);
              const isPopupOpen = activePopup?.source === 'calendar' && activePopup?.dateKey === item.key;
              const stat = dailyStats[item.key];

              const isLeftEdge = colIndex <= 1;
              const isRightEdge = colIndex >= 5;
              const isTopRow = rowIndex === 0;

              return (
                <div key={item.key} className="h-9 flex items-center justify-center relative">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePopup(prev =>
                        prev?.source === 'calendar' && prev?.dateKey === item.key
                          ? null
                          : { source: 'calendar', dateKey: item.key }
                      );
                    }}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 cursor-pointer select-none relative
                      ${item.isCompleted
                        ? 'bg-orange-500 text-white shadow-sm shadow-orange-200 hover:scale-110 active:scale-95'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:scale-105 active:scale-95'
                      }
                      ${item.isToday && !item.isCompleted ? 'ring-2 ring-orange-300 ring-offset-1 text-gray-600' : ''}
                      ${item.isToday && item.isCompleted ? 'ring-2 ring-orange-500 ring-offset-1' : ''}
                      ${isPopupOpen ? 'ring-2 ring-slate-800 ring-offset-2' : ''}
                    `}
                    title={`วันที่ ${item.dayNumber} ${THAI_MONTHS[currentDate.getMonth()]}`}
                  >
                    {item.dayNumber}
                  </button>

                  {/* 🌟 Popup สถิติสไตล์เรียบหรู ไม่มีไอคอน/อิโมจิ */}
                  {isPopupOpen && (
                    <div
                      className={`absolute z-50 bg-[#1e293b] text-white px-3 py-2 rounded-xl shadow-xl border border-slate-700/60 select-none text-center animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap ${
                        isTopRow ? 'top-full mt-2' : 'bottom-full mb-2'
                      }`}
                      style={{
                        left: isLeftEdge ? '0%' : isRightEdge ? 'auto' : '50%',
                        right: isRightEdge ? '0%' : 'auto',
                        transform: !isLeftEdge && !isRightEdge ? 'translateX(-50%)' : 'none'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* วันที่ */}
                      <div className="text-xs font-bold text-white text-center leading-tight">
                        {item.dayNumber} {THAI_MONTHS[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
                      </div>

                      {/* ข้อมูล WPM | Acc | Time */}
                      {stat ? (
                        <div className="text-[11px] font-semibold text-gray-200 flex items-center justify-center gap-1.5 whitespace-nowrap mt-1 leading-none">
                          <span>{stat.wpm} WPM</span>
                          <span className="text-slate-500 font-normal">|</span>
                          <span>{stat.accuracy}% Acc</span>
                          <span className="text-slate-500 font-normal">|</span>
                          <span>{formatDuration(stat.duration)}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-gray-400 text-center mt-1 whitespace-nowrap">
                          ไม่มีประวัติการพิมพ์
                        </div>
                      )}

                      {/* หางลูกศรชี้ไปยังวัน */}
                      <div
                        className={`absolute border-4 border-transparent ${
                          isTopRow
                            ? 'bottom-full border-b-[#1e293b]'
                            : 'top-full border-t-[#1e293b]'
                        }`}
                        style={{
                          left: isLeftEdge ? '14px' : isRightEdge ? 'auto' : '50%',
                          right: isRightEdge ? '14px' : 'auto',
                          transform: !isLeftEdge && !isRightEdge ? 'translateX(-50%)' : 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}