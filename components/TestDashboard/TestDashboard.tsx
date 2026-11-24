// components/TestDashboard/TestDashboard.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import TestPerformanceSection from '@/components/TestPerformanceSection/TestPerformanceSection';
import ProblemKeyChart from '@/components/ProblemKeyChart/ProblemKeyChart';
import TestHistoryList from '@/components/TestHistoryList/TestHistoryList';
import { getGuestTestsList } from '@/lib/guestProgress';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function TestDashboard({ allResults }: { allResults: any[] }) {
  const [selectedTime, setSelectedTime] = useState(1); // Default 1 นาที
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [guestResults, setGuestResults] = useState<any[]>([]);

  useEffect(() => {
    if (!allResults || allResults.length === 0) {
      setGuestResults(getGuestTestsList());
    }
  }, [allResults]);

  const effectiveResults = useMemo(() => {
    return allResults && allResults.length > 0 ? allResults : guestResults;
  }, [allResults, guestResults]);

  // ✅ 1. ย้าย useMemo ขึ้นมาไว้บนสุด
  // และเพิ่มการเช็ค (effectiveResults || []) เพื่อป้องกัน error กรณีข้อมูลเป็น null
  const filteredResults = useMemo(() => {
    if (!effectiveResults) return [];
    return effectiveResults
        .filter(r => r.duration === selectedTime)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [effectiveResults, selectedTime]);

  // 2. รวมข้อมูลคำผิด (เฉพาะการทดสอบในรอบ 30 วัน เพื่อให้แท่งคำผิดเก่าเกิน 30 วันหายไปตามที่ต้องการ)
  const thirtyDaysAgoMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const aggregatedMistakes: Record<string, number> = {};
  filteredResults.forEach(r => {
      const testTime = new Date(r.createdAt).getTime();
      if (testTime >= thirtyDaysAgoMs) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const m = r.mistakes as any;
          if (m) {
              Object.entries(m).forEach(([char, count]) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  aggregatedMistakes[char] = (aggregatedMistakes[char] || 0) + (count as any);
              });
          }
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