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
          <div className="grid grid-cols-7 mb-2 text-center">
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
                      aspect-square flex items-center justify-center rounded-lg text-xs font-medium cursor-default transition-all duration-200 relative
                      ${item.isCompleted
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-200' // ถ้า isCompleted เป็น true จะเป็นสีส้มเสมอ ไม่สนว่า streak ขาดไหม
                      : 'bg-gray-50 text-gray-300 hover:bg-gray-100'
                    }
                      ${item.isToday && !item.isCompleted ? 'ring-1 ring-orange-300 ring-offset-1 text-orange-500' : ''}
                      ${item.isToday && item.isCompleted ? 'ring-2 ring-orange-200 ring-offset-1' : ''}
                    `}
                >
                  {item.dayNumber}
                </div>
              );
            })}
          </div>

          <div className="bg-orange-400 rounded-2xl mt-3 p-2 shadow-sm flex items-center justify-between">

            <div className="text-white font-bold text-base ml-4">
              สถิติต่อเนื่อง
            </div>

            {/* ส่วนแสดง Streak Count ยังคงนับแบบต่อเนื่องเหมือนเดิม */}
            <div className={`
              flex items-center gap-2 px-4 py-1 rounded-2xl transition-colors duration-300
              ${currentStreak > 0
                ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-sm'
                : 'bg-gray-200 text-gray-400 border border-gray-300'
              }
            `}>
              <Flame size={24} fill={currentStreak > 0 ? "currentColor" : "none"} />
              <span className="text-2xl font-black">{currentStreak}</span>
              <span className="text-sm font-bold mt-1">วัน</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}