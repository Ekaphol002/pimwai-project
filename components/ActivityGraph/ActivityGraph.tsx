"use client";
import React, { useState, useMemo } from 'react';
import { Flame, ChevronLeft, ChevronRight } from 'lucide-react';

// --- 1. Helper Functions ---

import { toDateKey, calculateCurrentStreak } from '@/lib/streakUtils';

// --- 1. Helper Functions ---
// (Moved to lib/streakUtils.ts)


const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];
const WEEK_DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

// --- 2. Main Component ---
interface StreakCalendarProps {
  completedDates?: string[]; // รูปแบบ "YYYY-MM-DD"
}

export default function StreakCalendar({ completedDates = [] }: StreakCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // คำนวณ Streak (นับเฉพาะที่ติดต่อกัน)
  const currentStreak = useMemo(() => calculateCurrentStreak(completedDates), [completedDates]);

  // คำนวณข้อมูลปฏิทิน (แสดงทุกวันที่ทำ แม้ไม่ติดต่อกัน)
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    // ช่องว่างก่อนวันที่ 1
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ type: 'empty', key: `empty-${i}` });
    }

    // วันที่ 1 ถึงสิ้นเดือน
    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(year, month, i);
      const dateKey = toDateKey(dateObj); // "YYYY-MM-DD"

      // ✅ Logic นี้ถูกต้องแล้ว: เช็คว่าวันนี้มีใน list ไหม ถ้ามีก็ true (แสดงสีส้ม)
      const isCompleted = completedDates.includes(dateKey);
      const isToday = dateKey === toDateKey(new Date());

      days.push({
        type: 'day',
        key: dateKey,
        dayNumber: i,
        isCompleted: isCompleted,
        isToday: isToday
      });
    }
    return days;
  }, [currentDate, completedDates]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  return (
    <div className="w-full max-w-sm flex flex-col gap-2">

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

              return (
                <div key={i} className="flex flex-col items-center gap-1.5 cursor-default">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                      : 'bg-gray-100 text-gray-400'
                      } ${isToday && !isCompleted ? 'ring-1 ring-orange-400 ring-offset-2' : ''}`}
                  >
                    {isCompleted ? (
                      <Flame size={16} fill="currentColor" />
                    ) : (
                      <span className="text-[10px] font-bold">{dayName}</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium ${isToday ? 'text-orange-500 font-bold' : 'text-gray-400'}`}>
                    {dayName}
                  </span>
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
          <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition">
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-bold text-gray-700">
            {THAI_MONTHS[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
          </span>
          <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* ตารางปฏิทิน */}
        <div>
          <div className="grid grid-cols-7 mb-5 text-center">
            {WEEK_DAYS.map((day, index) => (
              <span key={index} className={`text-[10px] font-medium ${index === 0 || index === 6 ? 'text-red-400' : 'text-gray-400'}`}>
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarData.map((item) => {
              if (item.type === 'empty') return <div key={item.key} className="aspect-square" />;
              return (
                <div
                  key={item.key}
                  className={`
                      aspect-square flex items-center justify-center rounded-full text-xs font-medium cursor-default transition-all duration-200 relative
                      ${item.isCompleted
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-200' // ถ้า isCompleted เป็น true จะเป็นสีส้มเสมอ ไม่สนว่า streak ขาดไหม
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }
                      ${item.isToday && !item.isCompleted ? 'ring-2 ring-orange-300 ring-offset-1 text-gray-500' : ''}
                      ${item.isToday && item.isCompleted ? 'ring-2 ring-orange-500 ring-offset-1' : ''}
                    `}
                >
                  {item.dayNumber}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}