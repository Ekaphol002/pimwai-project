// components/TestDashboard/TestDashboard.tsx
"use client";

import React, { useState, useMemo } from 'react';
import TestPerformanceSection from '@/components/TestPerformanceSection/TestPerformanceSection';
import ProblemKeyChart from '@/components/ProblemKeyChart/ProblemKeyChart';
import TestHistoryList from '@/components/TestHistoryList/TestHistoryList';
import EmptyStats from '@/components/EmptyTest/EmptyTest';

export default function TestDashboard({ allResults }: { allResults: any[] }) {
  const [selectedTime, setSelectedTime] = useState(1); // Default 1 นาที

  // ✅ 1. ย้าย useMemo ขึ้นมาไว้บนสุด (ก่อน if)
  // และเพิ่มการเช็ค (allResults || []) เพื่อป้องกัน error กรณีข้อมูลเป็น null
  const filteredResults = useMemo(() => {
    if (!allResults) return [];
    return allResults
        .filter(r => r.duration === selectedTime)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allResults, selectedTime]);

  // 2. เช็คภาพรวมว่าเคยเล่นบ้างไหม
  const hasAnyData = allResults && allResults.length > 0;

  // 3. ถ้าไม่เคยเล่นเลย -> โชว์หน้า Empty
  // (ตอนนี้ return ตรงนี้ได้แล้ว เพราะ Hook ถูกเรียกไปหมดแล้วข้างบน)
  if (!hasAnyData) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
        <div className="flex-grow flex items-center justify-center"> 
           <EmptyStats />
        </div>
      </div>
    );
  }

  // 4. รวมข้อมูลคำผิด
  const aggregatedMistakes: Record<string, number> = {};
  filteredResults.forEach(r => {
      const m = r.mistakes as Record<string, number>;
      if (m) {
          Object.entries(m).forEach(([char, count]) => {
              aggregatedMistakes[char] = (aggregatedMistakes[char] || 0) + count;
          });
      }
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <div className="w-full max-w-5xl mx-auto px-6 pt-10 pb-10 space-y-8 animate-fadeInDown">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-700 tracking-tight">ทดสอบความเร็ว</h1>
          <p className="text-gray-500 text-base font-medium">วัดระดับความเร็วและความแม่นยำของคุณในเวลาที่กำหนด</p>
        </div>
        <hr className="border-gray-600" />

        <div className="w-full bg-[#5cb5db] rounded-3xl p-8 shadow-lg flex flex-col gap-0">
            
            <TestPerformanceSection 
               selectedTime={selectedTime} 
               onTimeChange={setSelectedTime}
               recentResults={filteredResults.slice(0, 10).reverse()} 
            />

            <ProblemKeyChart 
               mistakes={aggregatedMistakes} 
               selectedTime={selectedTime}
            />

            <TestHistoryList 
               history={filteredResults} 
            />

        </div>
      </div>
    </div>
  );
}