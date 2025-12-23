"use client";

import React, { useState, useRef, useEffect, useTransition } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ✅ 1. นิยามหน้าตาของ Quest (ให้เหมือนกับที่ส่งมาจาก page.tsx)
interface Quest {
  id: number;
  text: string;
  current: number;
  target: number;
  unit: string;
  isCompleted: boolean;
}

interface LessonMenuBarProps {
  selectedLevel: string;
  // ✅ 2. เพิ่มช่องรับ quests เข้ามา
  quests: Quest[];
}

// ❌ ลบ const quests = [...] ของเก่าออกไปเลยครับ ไม่ใช้แล้ว

export default function LessonMenuBar({ selectedLevel, quests }: LessonMenuBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [targetLevel, setTargetLevel] = useState<string | null>(null);

  const levels = [
    { id: 'beginner', name: 'ระดับเริ่มต้น' },
    { id: 'intermediate', name: 'ระดับกลาง' },
    { id: 'advanced', name: 'ระดับสูง' },
  ];

  // ✅ 3. คำนวณจาก quests ที่รับมาจริงๆ (ใช้ isCompleted ที่คำนวณมาแล้วจากหลังบ้าน)
  const questsCompleted = quests.filter(q => q.isCompleted).length;
  const questsTotal = quests.length;

  // --- คำนวณเส้นรอบวงกลม ---
  const size = 64;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // กัน Error หารด้วย 0
  const progress = questsTotal > 0 ? questsCompleted / questsTotal : 0;
  const strokeDashoffset = circumference - progress * circumference;

  // --- Logic ตัวเลื่อน Tab ---
  const [tabStyle, setTabStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = levels.findIndex(level => level.id === selectedLevel);
    if (activeIndex !== -1 && tabsRef.current[activeIndex]) {
      const currentTab = tabsRef.current[activeIndex];
      setTabStyle({
        left: currentTab?.offsetLeft || 0,
        width: currentTab?.offsetWidth || 0
      });
    }
  }, [selectedLevel]);

  const handleSelectLevel = (levelId: string) => {
    if (levelId === selectedLevel) return;

    setTargetLevel(levelId);
    startTransition(() => {
      router.push(`?level=${levelId}`);
    });
  };

  useEffect(() => {
    if (!isPending) {
      setTargetLevel(null);
    }
  }, [isPending]);

  return (
    <nav className="w-full bg-white h-20 z-20 relative">

      <div className="max-w-screen-2xl h-full flex items-center justify-between pl-11 pr-6 mx-auto">

        {/* --- (ส่วนซ้าย) เมนู Tabs --- */}
        <div className="flex items-center relative h-full">
          <div
            className="absolute bottom-0 h-4/6 bg-[#5cb5db] rounded-t-2xl z-0 transition-all duration-300 ease-out"
            style={{ left: `${tabStyle.left}px`, width: `${tabStyle.width}px` }}
          />
          {levels.map((level, index) => {
            const isActive = selectedLevel === level.id;
            const isLoading = isPending && targetLevel === level.id;

            return (
              <button
                key={level.id}
                ref={el => { tabsRef.current[index] = el }}
                onClick={() => handleSelectLevel(level.id)}
                disabled={isPending}
                className={`
                  flex items-end justify-center px-10 h-20 font-bold pb-2 transition-colors duration-200 focus:outline-none z-10 relative
                  ${isActive ? 'text-white' : 'text-gray-800 hover:text-[#5cb5db]'}
                  ${isPending && !isActive && !isLoading ? 'opacity-50' : ''} 
                `}
              >
                <div className="relative flex items-center">
                  {isLoading && (
                    <div className="absolute -left-6">
                      <Loader2 className="w-4 h-4 animate-spin text-[#5cb5db]" />
                    </div>
                  )}
                  <span className={`relative z-10 transition-transform duration-300 ease-out ${isActive ? 'scale-125' : 'scale-100'}`}>
                    {level.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* --- (ส่วนขวา) Quests & Circular Progress --- */}
        <div className="flex items-center gap-3">

          {/* 1. รายการเควส */}
          <div className="hidden lg:flex items-center gap-1 border-2 border-gray-200 rounded-full p-2 px-4">
            {quests.map((quest, index) => {
              // ✅ 4. ใช้ isCompleted จาก Props โดยตรง
              const isCompleted = quest.isCompleted;

              return (
                <React.Fragment key={quest.id}>

                  {/* ตัวเควส */}
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5">
                      {isCompleted ? (
                        <div className="bg-green-100 rounded-full p-0.5">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                      ) : (
                        <X className="w-3 h-3 text-gray-300" />
                      )}
                      <span className={`text-xs font-medium ${isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
                        {quest.text}
                      </span>
                    </div>

                    <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                      {/* ถ้าเป็นเปอร์เซ็นต์ไม่ต้องโชว์ /target ก็ได้ หรือจะโชว์ก็ได้ตามใจชอบ */}
                      {isCompleted ? 'สำเร็จแล้ว' : `${quest.current}/${quest.target} ${quest.unit}`}
                    </span>
                  </div>

                  {/* เส้นขีดคั่น */}
                  {index < quests.length - 1 && (
                    <div className="w-[2px] h-10 bg-gray-200 rounded-full mx-1"></div>
                  )}

                </React.Fragment>
              );
            })}
          </div>

          {/* 2. วงกลม Progress Bar */}
          <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 w-full h-full">
              <circle cx="50%" cy="50%" r={radius} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
              <circle
                cx="50%" cy="50%" r={radius} fill="none" stroke="#5cb5db" strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[8px] text-gray-500 font-semibold leading-tight">ภารกิจ</span>
              <span className="text-xl font-bold text-[#5cb5db] leading-none mt-0.5">
                {questsCompleted}/{questsTotal}
              </span>
            </div>
          </div>

        </div>

      </div>
    </nav>
  );
}