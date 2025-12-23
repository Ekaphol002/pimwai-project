// components/TestPerformanceSection/TestPerformanceSection.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Play, Trophy, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// --- (1) กำหนด Type ---
interface TestResult {
  id: string;
  wpm: number;
  accuracy: number;
  createdAt: Date | string;
}

interface TestPerformanceSectionProps {
  selectedTime: number;
  onTimeChange: (time: number) => void;
  recentResults: TestResult[]; 
}

// --- (2) Components ย่อย (Tooltip & Dot) ---
const CustomTooltip = ({ active, payload, coordinate, mode }: any) => {
  if (active && payload && payload.length) {
    const fullDate = payload[0].payload.fullDate;
    const value = payload[0].value;
    const pointY = payload[0].cy ?? (coordinate?.y ?? 0);
    const pointX = coordinate?.x ?? 0;

    return (
      <div
        className="absolute transform -translate-x-1/2 -translate-y-full pointer-events-none transition-all duration-300 ease-out z-50"
        style={{ left: pointX, top: pointY - 15 }}
      >
        <div className="bg-[#4b5563] text-white px-4 py-2 rounded-lg shadow-xl border border-gray-500/50 text-xs relative whitespace-nowrap">
          <p className="text-gray-300 mb-1 font-medium text-[10px]">{fullDate}</p>
          <p className="text-xl font-bold leading-none">
            {value}
            <span className="text-xs font-normal opacity-80">
              {mode === 'accuracy' ? '%' : ' WPM'}
            </span>
          </p>
          <div className="absolute left-1/2 -bottom-1.5 w-3 h-3 bg-[#4b5563] border-b border-r border-gray-500/50 transform -translate-x-1/2 rotate-45" />
        </div>
      </div>
    );
  }
  return null;
};

const CustomActiveDot = (props: any) => {
  const { cx, cy, setTooltipPos, payload } = props;
  useEffect(() => {
    if (cx && cy) setTooltipPos({ x: cx, y: cy, data: payload, visible: true });
  }, [cx, cy, payload, setTooltipPos]);
  return <circle cx={cx} cy={cy} r={6} fill="#3498db" stroke="#fff" strokeWidth={3} />;
};

// --- (3) Main Component ---
export default function TestPerformanceSection({
  selectedTime,
  onTimeChange,
  recentResults,
}: TestPerformanceSectionProps) {
  const [chartMode, setChartMode] = useState<'speed' | 'accuracy'>('speed');
  const [tooltipPos, setTooltipPos] = useState<any>(null);

  // เช็คว่ามีข้อมูลอย่างน้อย 1 อัน (สำหรับแสดง Best Speed ในกล่องรถ)
  const hasData = recentResults && recentResults.length > 0;

  // ✅ เช็คว่ามีข้อมูลอย่างน้อย 2 อัน (สำหรับแสดงกราฟ)
  const showChart = recentResults && recentResults.length >= 2;

  const chartData = useMemo(() => {
    if (!hasData) return [];

    return recentResults.map((r) => {
      const dateObj = new Date(r.createdAt);
      return {
        ...r,
        timestamp: dateObj.getTime(),
        fullDate: dateObj.toLocaleString('th-TH', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  }, [recentResults, hasData]);

  const maxWpm = hasData ? Math.max(...chartData.map(d => d.wpm)) : 0;

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="bg-white backdrop-blur-sm p-1 rounded-xl flex items-center">
          {[1, 3, 5].map(time => (
            <button
              key={time}
              onClick={() => onTimeChange(time)}
              className={`px-6 py-1 rounded-lg font-bold text-xl transition-all 
              ${selectedTime === time
                ? 'bg-[#5cb5db] text-white shadow-sm'
                : 'text-[#5cb5db] hover:bg-white/10'
              }`}
            >
              {time} นาที
            </button>
          ))}
        </div>

        <Link href={`/typing-test/${selectedTime}-minute`} className="group relative">
          <button
            className="bg-[#facc15] hover:bg-[#eab308] text-yellow-900 text-2xl font-bold px-10 py-2 rounded-xl shadow-md transition-all transform group-hover:scale-105 flex items-center gap-2"
          >
            <span>เริ่มเลย!!!</span>
            <Play className="fill-yellow-900" />
          </button>
        </Link>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* 1. Car Box (ยังคงแสดงแม้มีแค่ 1 ข้อมูล) */}
        <div className="bg-white rounded-2xl flex flex-col items-center justify-center relative overflow-hidden h-60 border-8 border-white group shadow-sm">
          <div className="absolute top-0 left-[-100%] w-[200%] h-full flex animate-scenery-scroll z-0">
            <div className="w-1/2 h-full relative">
              <Image src="/bgcar.png" alt="bg1" fill className="object-cover object-bottom scale-[1.01]" />
            </div>
            <div className="w-1/2 h-full relative">
              <Image src="/bgcar.png" alt="bg2" fill className="object-cover object-bottom scale-[1.01]" />
            </div>
          </div>

          <div className="z-20 relative transform translate-y-15">
            <Image
              src="/car.gif"
              alt="Car"
              width={200}
              height={60}
              unoptimized
              className="object-contain drop-shadow-xl"
            />
          </div>

          <div className="absolute top-2 right-3 z-30">
            <div className="flex items-center gap-2 text-yellow-400 text-3xl font-bold uppercase px-3 py-1 rounded drop-shadow-md">
              <Trophy className="text-yellow-400 fill-yellow-400" size={28} />
              <span>{maxWpm} WPM</span>
            </div>
          </div>

          <span className="absolute top-3 left-3 text-white/90 text-[16px] font-bold uppercase z-30 drop-shadow-md bg-black/50 px-3 py-1 rounded-lg">
            Best Speed ({selectedTime} min)
          </span>
        </div>

        {/* 2. Graph Box */}
        <div className="bg-white rounded-2xl p-4 flex flex-col h-60 shadow-sm relative">
          <div className="flex justify-between items-center mb-2 z-10">
            <h2 className="text-lg font-bold text-gray-700 uppercase tracking-wide">
              {selectedTime}:00 Tests
            </h2>

            {/* ปุ่มเลือกกราฟ แสดงเฉพาะเมื่อมีกราฟ (2 ข้อมูลขึ้นไป) */}
            {showChart && (
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setChartMode('speed')}
                  className={`px-3 py-0.5 text-[10px] font-bold rounded-md transition-all 
                  ${chartMode === 'speed'
                    ? 'bg-white text-[#5cb5db] shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Speed
                </button>
                <button
                  onClick={() => setChartMode('accuracy')}
                  className={`px-3 py-0.5 text-[10px] font-bold rounded-md transition-all 
                  ${chartMode === 'accuracy'
                    ? 'bg-white text-[#5cb5db] shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Acc.
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 w-full min-h-0 relative" onMouseLeave={() => setTooltipPos(null)}>
            
            {/* ✅ ใช้เงื่อนไข !showChart (ถ้าข้อมูล < 2 ให้แสดง Empty State) */}
            {!showChart ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 z-20">
                    {/* ปรับข้อความให้ชัดเจนขึ้นตามจำนวนข้อมูลที่มี */}
                    <p className="text-sm font-bold text-gray-500">
                        {hasData ? "ข้อมูลยังไม่เพียงพอสร้างกราฟ" : "ยังไม่มีข้อมูลกราฟ"}
                    </p>
                    <p className="text-xs opacity-70 mt-1">
                        {hasData 
                            ? "เล่นอีกครั้งเพื่อดูแนวโน้มพัฒนาการของคุณ" 
                            : `เริ่มทดสอบ ${selectedTime} นาที เพื่อดูพัฒนาการ`
                        }
                    </p>
                </div>
            ) : (
                /* ✅ กรณีมีข้อมูล >= 2: แสดงกราฟ */
                <>
                    {tooltipPos && tooltipPos.visible && (
                    <CustomTooltip
                        active={true}
                        payload={[
                        {
                            value: chartMode === 'speed' ? tooltipPos.data.wpm : tooltipPos.data.accuracy,
                            payload: tooltipPos.data,
                        },
                        ]}
                        coordinate={{ x: tooltipPos.x, y: tooltipPos.y }}
                        mode={chartMode}
                    />
                    )}

                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 25, right: 10, left: -20, bottom: 0 }}
                        onMouseLeave={() => setTooltipPos(null)}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#f0f0f0" />

                        <XAxis
                        dataKey="timestamp"
                        tickFormatter={(value) => {
                            const d = new Date(value);
                            const day = d.getDate();
                            let month = d.toLocaleString("th-TH", { month: "short" });
                            month = month.replace(".", "");
                            return `${day} ${month}`;
                        }}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#9ca3af" }}
                        dy={10}
                        padding={{ left: 20, right: 20 }}
                        interval="preserveStartEnd"
                        />

                        <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                        domain={['auto', 'auto']}
                        padding={{ top: 20, bottom: 20 }}
                        />

                        <Tooltip content={() => null} cursor={false} />

                        <Line
                        type="monotone"
                        dataKey={chartMode === 'speed' ? 'wpm' : 'accuracy'}
                        stroke="#5cb5db"
                        strokeWidth={3}
                        dot={{
                            r: 4,
                            fill: '#fff',
                            stroke: '#5cb5db',
                            strokeWidth: 2,
                        }}
                        activeDot={<CustomActiveDot setTooltipPos={setTooltipPos} />}
                        animationDuration={1000}
                        />
                    </LineChart>
                    </ResponsiveContainer>
                </>
            )}

          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scenery-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(50%); }
        }
        .animate-scenery-scroll {
          animation: scenery-scroll 2s linear infinite;
        }
      `}</style>
    </div>
  );
}