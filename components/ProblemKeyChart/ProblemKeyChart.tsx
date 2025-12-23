// components/ProblemKeyChart/ProblemKeyChart.tsx
"use client";

import React, { useMemo } from 'react';
import { BarChart2, CheckCircle } from 'lucide-react'; // ✅ เพิ่มไอคอน

interface ProblemKeyChartProps {
  mistakes: Record<string, number>; 
  selectedTime: number;
}

export default function ProblemKeyChart({ mistakes, selectedTime }: ProblemKeyChartProps) {
  
  // ✅ เช็คว่ามีคำผิดไหม
  const hasMistakes = Object.keys(mistakes).length > 0;

  // 1. แปลง mistakes object ให้เป็น array
  const displayData = useMemo(() => {
    let data = Object.entries(mistakes).map(([key, count]) => ({
      key,
      count,
      total: 0 
    }));

    // เรียงลำดับจาก "ผิดมากสุด" ไป "น้อยสุด"
    data.sort((a, b) => b.count - a.count);

    // ตัดเอาแค่ 10 อันดับแรก
    data = data.slice(0, 10);

    // เติมช่องว่างให้ครบ 10 แท่ง
    while (data.length < 10) {
      data.push({ key: '', count: 0, total: 0 });
    }

    return data;
  }, [mistakes]);

  // หาค่าสูงสุดเพื่อคำนวณความสูงของแท่งกราฟ
  const maxCount = Math.max(...displayData.map((d) => d.count), 1);

  return (
    <div className="w-full bg-white rounded-2xl p-6 px-8 shadow-sm border border-gray-200 mt-6 h-[400px] flex flex-col">

      {/* ชื่อหัวข้อ */}
      <h3 className="text-lg font-bold text-gray-700 mb-6 uppercase tracking-wide">
        คำที่ผิดบ่อยที่สุด ({selectedTime} นาที)
      </h3>

      {/* ✅ LOGIC: ถ้าไม่มีคำผิด ให้แสดงข้อความแทนกราฟ */}
      {!hasMistakes ? (
        <div className="flex-grow flex flex-col items-center justify-center text-gray-400 border-b border-gray-100 pb-8">
            <p className="text-base font-bold text-gray-600">เยี่ยมมาก! ไม่มีคำที่พิมพ์ผิด</p>
            <p className="text-sm opacity-60 mt-1">หรือคุณอาจจะยังไม่ได้เริ่มทดสอบในโหมดนี้?</p>
        </div>
      ) : (
        /* ✅ ถ้ามีคำผิด ก็แสดงกราฟตามเดิม */
        <div className="flex items-end justify-between gap-2 h-64 px-4 border-b border-gray-100 flex-grow pb-2">
            {displayData.map((item, index) => {
            const barHeightPercent = (item.count / maxCount) * 100;
            const isFloatingChar = ['่', '้', '๊', '๋', '์', 'ิ', 'ี', 'ึ', 'ื', 'ุ', 'ู', 'ั', '็'].includes(item.key);

            return (
                <div key={index} className="flex flex-col items-center justify-end w-full h-full">

                {/* แท่งกราฟ */}
                <div
                    className={`
                        relative w-12 sm:w-16 rounded-t-md transition-all duration-500 ease-out group
                        ${item.key ? 'bg-[#d64242] hover:bg-[#c0392b]' : 'bg-transparent'}
                    `}
                    style={{ height: item.key ? `${barHeightPercent}%` : '0px' }}
                >
                    {/* Tooltip */}
                    {item.key && (
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap pointer-events-none opacity-0 scale-90 translate-y-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-200 ease-out origin-bottom">
                            <div className="bg-gray-700 text-white text-xs py-2 px-3 rounded-lg shadow-lg relative">
                                พิมพ์ <span className="font-bold text-yellow-400 mx-1">{item.key}</span> ผิด {item.count} ครั้ง
                                <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-700 rotate-45"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ตัวอักษร */}
                <div className="h-8 w-16 flex items-center justify-center border-1 border-gray-300">
                    <span className="text-xl font-bold text-gray-600 relative">
                    {isFloatingChar ? (
                        <>
                        <span className="invisible">◌</span>
                        <span className="absolute left-0 top-0 w-full text-center">{item.key}</span>
                        </>
                    ) : (
                        item.key
                    )}
                    </span>
                </div>

                </div>
            );
            })}
        </div>
      )}

    </div>
  );
}