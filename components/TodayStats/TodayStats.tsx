"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react';
import ExpBar from '@/components/ExpBar/ExpBar';
import { calculateRankInfo } from '@/lib/rankUtils';

interface Quest {
  id: number;
  text: string;
  current: number;
  target: number;
  unit: string;
  isCompleted: boolean;
  tier?: number;
}

interface TodayStatsProps {
  rank: number;
  exp: number;
  dailyWpm: number;
  dailyAcc: number;
  dailyTime: string;
  serverRank?: number | null; // อันดับในเซิร์ฟเวอร์ (Leaderboard Rank)
  quests?: Quest[];
  completedQuestsCount?: number;
}

export default function TodayStats({
  rank = 1,
  exp = 0,
  dailyWpm,
  dailyAcc,
  dailyTime,
  serverRank = null,
  quests = [],
  completedQuestsCount = 0
}: TodayStatsProps) {

  // 🌟 ซิงค์ EXP และสถิติของ Guest จาก localStorage ถ้า server ส่งมาเป็น 0
  const [effectiveExp, setEffectiveExp] = useState<number>(exp);
  const [effectiveWpm, setEffectiveWpm] = useState<number>(dailyWpm);
  const [effectiveAcc, setEffectiveAcc] = useState<number>(dailyAcc);
  const [effectiveTime, setEffectiveTime] = useState<string>(dailyTime);

  useEffect(() => {
    const syncGuestData = () => {
      // 1. ซิงค์ EXP
      if (exp === 0) {
        try {
          const savedGuestExp = localStorage.getItem('pimwai_guest_exp');
          if (savedGuestExp) {
            const parsed = parseInt(savedGuestExp, 10);
            if (!isNaN(parsed) && parsed > 0) {
              setEffectiveExp(parsed);
            }
          }
        } catch (e) { }
      } else {
        setEffectiveExp(exp);
      }

      // 2. ซิงค์สถิติรายวัน
      if (!dailyWpm || dailyWpm === 0) {
        try {
          const todayKey = 'pimwai_guest_today_' + new Date().toISOString().split('T')[0];
          const savedToday = localStorage.getItem(todayKey);
          if (savedToday) {
            const parsed = JSON.parse(savedToday);
            if (parsed.wpm) setEffectiveWpm(parsed.wpm);
            if (parsed.acc) setEffectiveAcc(parsed.acc);
            if (parsed.time) setEffectiveTime(parsed.time);
          }
        } catch (e) { }
      } else {
        setEffectiveWpm(dailyWpm);
        setEffectiveAcc(dailyAcc);
        setEffectiveTime(dailyTime);
      }
    };

    syncGuestData();

    // ดักจับการเปลี่ยนแปลงเมื่อสลับแท็บหรือพิมพ์เสร็จในหน้าอื่น
    window.addEventListener('storage', syncGuestData);
    window.addEventListener('focus', syncGuestData);
    return () => {
      window.removeEventListener('storage', syncGuestData);
      window.removeEventListener('focus', syncGuestData);
    };
  }, [exp, dailyWpm, dailyAcc, dailyTime]);

  const isServerTop10 = serverRank !== null && serverRank <= 10;

  const {
    rank: calculatedRank,
    rankName,
    thaiRankName,
    stars: currentStars,
    currentBarExp,
    maxBarExp,
    color,
    badgeBg,
    isTop10Eligible
  } = calculateRankInfo(effectiveExp, isServerTop10);

  const isTop50 = serverRank !== null && serverRank <= 50;

  // ==========================================
  // 🎨 UI ส่วนแสดงผล
  // ==========================================
  return (
    <div className="w-full rounded-lg p-3 flex flex-col items-center">

      <h2 className="text-3xl font-bold text-gray-700 mb-2">แรงค์ของคุณ</h2>
      <div className="relative w-full flex flex-col items-center mb-4">

        <div className="mb-[-10px] z-20 mt-1">
          <span className={`px-6 py-1 bg-gradient-to-r ${badgeBg} text-white font-black text-lg rounded-full shadow-lg border-2 border-white tracking-wider uppercase`}>
            {rankName}
          </span>
        </div>

        <div className="relative z-10 animate-float mb-[-4]">
          <Image
            src={`/Rank${calculatedRank}.png`}
            width={600} height={160} alt={`Rank ${calculatedRank}`} priority
            onError={(e) => { e.currentTarget.srcset = "/Rank1.png" }}
          />
        </div>

        <div className="absolute top-[55%] left-1/2 -translate-x-1/2 w-3/4 h-4 bg-black/70 rounded-full blur-xl z-0" aria-hidden="true" />

        {/* 🌟 แสดงดาว (เฉพาะ Rank 1 - 6) หรือ แสดงอันดับ & EXP รวมตัวใหญ่ (สำหรับ Rank 7) */}
        {calculatedRank === 7 ? (
          <div className="relative h-14 w-full flex flex-col items-center justify-center z-20 select-none">
            <span className="text-xs mb-1 font-black px-3.5 py-0.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white rounded-full uppercase tracking-wider shadow-xs">
              TOP 10 LEADERBOARD
            </span>
            <div className="text-2xl mb-3 sm:text-3xl font-black text-purple-600 dark:text-purple-400 logo-font mt-1">
              {effectiveExp.toLocaleString()} EXP
            </div>
          </div>
        ) : (
          <div className="relative w-full flex flex-col items-center z-20 select-none">
            {/* 🌟 ป้าย TOP 50 LEADERBOARD แสดงบนดาว (สีเปลี่ยนตามธีมแรงค์) */}
            {isTop50 && (
              <div className="mb-3 z-20">
                <span className={`px-4 py-0.5 bg-gradient-to-r ${badgeBg} text-white font-black text-xs rounded-full shadow-xs tracking-wider uppercase border border-white/20`}>
                  TOP 50 LEADERBOARD
                </span>
              </div>
            )}
            <div className="relative h-14 w-full flex justify-center items-start z-20 gap-5">
              {[1, 2, 3, 4, 5].map((starNum) => {
                const index = starNum;
                const distance = Math.abs(index - 3);
                const yOffset = -1 * (distance * distance) * 3;
                const rotate = (index - 3) * 12;

                return (
                  <div key={starNum} className="transition-all duration-500" style={{ transform: `translateY(${yOffset}px) rotate(${rotate}deg)` }}>
                    <Star size={45} className={`${starNum <= currentStars ? "text-yellow-400 fill-yellow-400 drop-shadow-md" : "text-gray-400 fill-gray-400"}`} />
                  </div>
                );
              })}
            </div>

            {/* 🌟 ข้อความอันดับที่ ของเซิร์ฟเวอร์ ไว้ใต้ดาว */}
            {isTop50 && (
              <div className={`text-center text-sm sm:text-base font-black mb-1 logo-font ${color}`}>
                อันดับที่ {serverRank} ของเซิร์ฟเวอร์
              </div>
            )}
          </div>
        )}

        <div className="w-full z-20 px-4">
          {calculatedRank === 7 ? (
            <div className="w-full flex flex-col items-center select-none">
              <div className="w-full bg-gray-300 dark:bg-zinc-700 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 h-full rounded-full w-full" />
              </div>
              <div className="text-center text-base sm:text-lg font-black text-purple-600 dark:text-purple-400 mt-2 logo-font">
                อันดับที่ {serverRank || 1} ของเซิร์ฟเวอร์
              </div>
            </div>
          ) : isTop10Eligible ? (
            <div className="w-full flex flex-col items-center select-none">
              <div className="w-full bg-gray-300 dark:bg-zinc-700 rounded-full h-3 overflow-hidden">
                <div className={`bg-gradient-to-r ${badgeBg} h-full rounded-full w-full`} />
              </div>
              <div className="text-center mt-2 flex flex-col items-center gap-0.5">
                <span className="text-xs font-bold text-rose-600">
                  หลอดเต็ม 5 ดาว (รอชิง TOP 10 เพื่อเลื่อนเป็น Rank 7)
                </span>
                <span className="text-[11px] font-bold text-gray-500 logo-font">
                  EXP รวม: {effectiveExp.toLocaleString()} XP
                </span>
              </div>
            </div>
          ) : (
            <div>
              <ExpBar
                currentExp={currentBarExp}
                maxExp={maxBarExp}
                barColor={`bg-gradient-to-r ${badgeBg}`}
              />
            </div>
          )}
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-700 mt-3 mb-3">สถิติในวันนี้</h3>
      <div className="w-full grid grid-cols-3 gap-3">
        <div className="bg-[#5cb5db] rounded-2xl p-2 shadow-md">
          <h4 className="text-center text-sm text-white font-bold my-1">ความเร็ว</h4>
          <div className="bg-white rounded-xl py-5 px-3 flex items-center justify-between">
            <Image src="/Speed.png" width={25} height={25} alt="Speed" />
            <span className="text-2sm logo-font text-cyan-600">
              {effectiveWpm > 0 ? `${effectiveWpm} WPM` : '-- WPM'}
            </span>
          </div>
        </div>
        <div className="bg-[#5cb5db] rounded-2xl p-2 shadow-md">
          <h4 className="text-center text-sm text-white font-bold my-1">ความแม่นยำ</h4>
          <div className="bg-white rounded-xl py-5 px-3 flex items-center justify-between">
            <Image src="/Accuracy.png" width={25} height={25} alt="Accuracy" />
            <span className="text-2sm logo-font text-cyan-600">
              {effectiveWpm > 0 ? `${effectiveAcc}% Acc` : '-- % Acc'}
            </span>
          </div>
        </div>
        <div className="bg-[#5cb5db] rounded-2xl p-2 shadow-md">
          <h4 className="text-center text-sm text-white font-bold my-1">เวลาที่ใช้</h4>
          <div className="bg-white rounded-xl py-5 px-6 flex items-center justify-between">
            <Image src="/Time.png" width={25} height={25} alt="Time" />
            <span className="text-2sm logo-font text-cyan-600">
              {effectiveTime && effectiveTime !== "0:00" ? effectiveTime : '-- time'}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}