"use client";

import React from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react';
import ExpBar from '@/components/ExpBar/ExpBar';

interface Quest {
  id: number;
  text: string;
  current: number;
  target: number;
  unit: string;
  isCompleted: boolean;
}

interface TodayStatsProps {
  rank: number;
  exp: number;
  dailyWpm: number;
  dailyAcc: number;
  dailyTime: string;
  quests?: Quest[];
  completedQuestsCount?: number;
}

export default function TodayStats({
  rank = 1,
  exp = 0,
  dailyWpm,
  dailyAcc,
  dailyTime,
  quests = [],
  completedQuestsCount = 0
}: TodayStatsProps) {

  // ==========================================
  // 🧠 Logic ใหม่: ปรับความยากง่ายตามระดับ (Balancing)
  // ==========================================
  
  // กำหนดเพดาน EXP ของแต่ละ Rank (จบ Rank นี้ต้องใช้ EXP รวมเท่าไหร่)
  const RANK_1_CAP = 2500;  // จบ Beginner ที่ 2,500 XP (เดิมต้อง 6,000)
  const RANK_2_CAP = 8500;  // จบ Intermediate ที่ 8,500 XP
  // Rank 3 ไปเรื่อยๆ

  let calculatedRank = 1;
  let currentStars = 0;
  let currentBarExp = 0;
  let maxBarExp = 500; // ค่า Default เริ่มต้น (ดาวละ 500)

  if (exp < RANK_1_CAP) {
    // === RANK 1: BEGINNER (โหมด Easy) ===
    // เป้าหมาย: ให้มือใหม่อัปดาวไวๆ จะได้มีกำลังใจ
    calculatedRank = 1;
    const expPerStar = 500; // ดาวละ 500 XP (เล่นประมาณ 4-5 ด่านก็ได้ดาวแล้ว)
    
    currentStars = Math.floor(exp / expPerStar);
    currentBarExp = exp % expPerStar;
    maxBarExp = expPerStar;

  } else if (exp < RANK_2_CAP) {
    // === RANK 2: INTERMEDIATE (โหมด Normal) ===
    calculatedRank = 2;
    const expInRank = exp - RANK_1_CAP; // นับ EXP เริ่มต้นใหม่จาก 0 ของแรงค์นี้
    const rankRange = RANK_2_CAP - RANK_1_CAP; // ระยะห่าง (6,000 XP)
    const expPerStar = 1200; // ดาวละ 1,200 XP (เริ่มยากขึ้น)

    currentStars = Math.floor(expInRank / expPerStar);
    currentBarExp = expInRank % expPerStar;
    maxBarExp = expPerStar;

  } else {
    // === RANK 3: ADVANCED (โหมด Hard/Endgame) ===
    calculatedRank = 3;
    const expInRank = exp - RANK_2_CAP;
    const expPerStar = 2000; // ดาวละ 2,000 XP (ต้องเก่งจริงถึงจะได้)

    currentStars = Math.floor(expInRank / expPerStar);
    
    // ตันที่ 5 ดาว
    if (currentStars > 5) {
      currentStars = 5;
      // ถ้าตันแล้ว ให้หลอดโชว์ EXP ที่เกินมาแบบเท่ๆ (วนลูปทุก 5000)
      maxBarExp = 5000;
      currentBarExp = expInRank % 5000; 
    } else {
      currentBarExp = expInRank % expPerStar;
      maxBarExp = expPerStar;
    }
  }

  // ฟังก์ชันชื่อ Rank (เหมือนเดิม)
  const getRankName = (r: number) => {
    switch (r) {
      case 1: return "Beginner";
      case 2: return "Intermediate";
      case 3: return "Advanced";
      default: return "Advanced";
    }
  };

  // ==========================================
  // 🎨 UI ส่วนแสดงผล (เหมือนเดิม 100%)
  // ==========================================
  return (
    <div className="w-full rounded-lg p-3 flex flex-col items-center">
      
      <h2 className="text-3xl font-bold text-gray-700 mb-2">แรงค์ของคุณ</h2>
      <div className="relative w-full flex flex-col items-center mb-4">

        <div className="mb-[-10px] z-20 mt-3">
          <span className="px-6 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-black text-lg rounded-full shadow-lg border-2 border-white tracking-wider uppercase">
            {getRankName(calculatedRank)}
          </span>
        </div>

        <div className="relative z-10 animate-float mb-[-4]">
          <Image
            src={`/Rank${calculatedRank > 3 ? 3 : calculatedRank}.png`}
            width={600} height={160} alt={`Rank ${calculatedRank}`} priority
            onError={(e) => { e.currentTarget.srcset = "/Rank1.png" }}
          />
        </div>

        <div className="absolute top-[60%] left-1/2 -translate-x-1/2 w-3/4 h-4 bg-black/70 rounded-full blur-xl z-0" aria-hidden="true" />

        <div className="relative h-14 w-full flex justify-center items-start z-20 gap-5">
          {[1, 2, 3, 4, 5].map((starNum) => {
            // Logic การวางดาวแบบโค้ง (Arc) เหมือนเดิม
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

        <div className="w-full z-20 px-4">
          {/* ส่งค่าที่คำนวณใหม่ไปให้ ExpBar */}
          <ExpBar currentExp={currentBarExp} maxExp={maxBarExp} />
          
          {/* Debug: อยากเห็นตัวเลขจริงก็ uncomment บรรทัดล่างได้ครับ */}
          {/* <div className="text-center text-xs text-gray-400 mt-1">EXP: {exp} | {currentBarExp}/{maxBarExp}</div> */}
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-700 mt-3 mb-3">สถิติในวันนี้</h3>
      <div className="w-full grid grid-cols-3 gap-3">
         <div className="bg-[#5cb5db] rounded-2xl p-2 shadow-md">
           <h4 className="text-center text-sm text-white font-bold my-1">ความเร็ว</h4>
           <div className="bg-white rounded-xl py-5 px-3 flex items-center justify-between">
             <Image src="/Speed.png" width={25} height={25} alt="Speed" />
             <span className="text-2sm logo-font text-cyan-600">
               {dailyWpm > 0 ? `${dailyWpm} WPM` : '-- WPM'}
             </span>
           </div>
         </div>
         <div className="bg-[#5cb5db] rounded-2xl p-2 shadow-md">
           <h4 className="text-center text-sm text-white font-bold my-1">ความแม่นยำ</h4>
           <div className="bg-white rounded-xl py-5 px-3 flex items-center justify-between">
             <Image src="/Accuracy.png" width={25} height={25} alt="Accuracy" />
             <span className="text-2sm logo-font text-cyan-600">
               {dailyWpm > 0 ? `${dailyAcc}% Acc` : '-- % Acc'}
             </span>
           </div>
         </div>
         <div className="bg-[#5cb5db] rounded-2xl p-2 shadow-md">
           <h4 className="text-center text-sm text-white font-bold my-1">เวลาที่ใช้</h4>
           <div className="bg-white rounded-xl py-5 px-6 flex items-center justify-between">
             <Image src="/Time.png" width={25} height={25} alt="Time" />
             <span className="text-2sm logo-font text-cyan-600">
               {dailyTime !== "0:00" ? dailyTime : '-- time'}
             </span>
           </div>
         </div>
      </div>

    </div>
  );
}