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

  // --- Logic คำนวณ EXP/Rank ---
  const EXP_PER_STAR = 1000;
  const EXP_PER_RANK = 6000;
  const MAX_CAP_EXP = 35000; // จุดที่ตัน Rank 3 / 5 ดาว

  let calculatedRank = 1;
  let currentStars = 0;
  let currentBarExp = 0;
  let maxBarExp = EXP_PER_STAR; // ปกติเต็มหลอดที่ 1000

  if (exp >= MAX_CAP_EXP) {
    // === กรณี EXP เกิน 35,000 (Max Level) ===
    calculatedRank = 3; // ล็อคที่ Rank 3 (Advanced)
    currentStars = 5;   // ล็อคที่ 5 ดาว
    
    // XP ที่เหลือให้สะสมในหลอดไปเรื่อยๆ
    // สมมติ: ให้หลอดแสดงส่วนที่เกินมาจาก 35,000
    // หรือจะให้หลอดเต็มตลอดเวลา? -> โจทย์บอก "สะสมไปเรื่อยๆ" 
    // แปลว่าอาจจะอยากเห็นตัวเลขเพิ่มขึ้นในหลอด เช่น 500 / 1000 (วนลูป) หรือ 1500 / Infinity
    
    // แบบที่ 1: วนลูปทุกๆ 1000 XP เหมือนเดิม แต่ Rank/Star ไม่ขยับ
    currentBarExp = (exp - MAX_CAP_EXP) % EXP_PER_STAR;
    
    // แบบที่ 2 (แนะนำ): แสดง XP ที่เกินมาทั้งหมดในหลอด (และขยาย Max หลอดให้ดูเยอะๆ หรือไม่มีเพดาน)
    // แต่ ExpBar component มักต้องการ maxExp ที่แน่นอน
    // ขอใช้แบบ "วนลูป" เพื่อให้หลอดมีการขยับครับ
    // แต่ถ้าอยากโชว์ตัวเลขดิบๆ ว่าเกินมาเท่าไหร่ ให้แก้ตรง ExpBar prop
    
  } else {
    // === กรณีปกติ (ยังไม่ถึง 35,000) ===
    calculatedRank = Math.floor(exp / EXP_PER_RANK) + 1;
    
    // ถ้าคำนวณแล้วเกิน Rank 3 ให้ตบกลับมา Rank 3 (เพราะเรามีรูปแค่ 3 Rank)
    if (calculatedRank > 3) calculatedRank = 3;

    const expInCurrentRank = exp % EXP_PER_RANK;
    
    // คำนวณดาว (0-5)
    currentStars = Math.floor(expInCurrentRank / EXP_PER_STAR);
    
    // ถ้า Rank 3 แล้วดาวคำนวณได้เกิน 5 (เช่น exp 20,000) ให้ตันที่ 5
    if (calculatedRank === 3 && currentStars > 5) {
        currentStars = 5;
    }

    // คำนวณ EXP ในหลอด
    currentBarExp = expInCurrentRank % EXP_PER_STAR;
  }

  // ** Override พิเศษ ** // เพื่อให้แน่ใจว่าถ้า exp >= 35000 จะเป็น Rank 3 ดาว 5 เสมอ
  if (exp >= MAX_CAP_EXP) {
      calculatedRank = 3;
      currentStars = 5;
      // ให้หลอด Exp แสดงส่วนเกินจาก 35,000 แบบ Infinity (เช่น 150 / 1000)
      // ผู้ใช้จะเห็นหลอดเต็มแล้ววนใหม่ หรือเห็นตัวเลขเพิ่มขึ้นเรื่อยๆ
      currentBarExp = (exp - MAX_CAP_EXP); 
      // เพื่อให้หลอดไม่เต็มแล้วเด้งกลับเป็น 0 ตลอดเวลา เราอาจจะปรับ maxExp ให้เป็น infinity หรือค่าสูงๆ 
      // แต่ ExpBar เดิมน่าจะ fix max ไว้
      
      // ปรับจูน: ให้ส่วนเกินโชว์ในหลอด โดยหลอดเต็มที่ 10000 หรือค่าเยอะๆ แทน
      maxBarExp = 10000; // ขยายเพดานหลอดช่วง End Game
      currentBarExp = exp - MAX_CAP_EXP; 
      
      // ถ้าเกิน maxBarExp อีก ก็ให้มันเต็มค้างไว้ หรือขยายต่อก็ได้
      if (currentBarExp > maxBarExp) {
        maxBarExp = currentBarExp + 5000; // ขยายอัตโนมัติ
      }
  }

  const getRankName = (r: number) => {
    switch (r) {
      case 1: return "Beginner";
      case 2: return "Intermediate";
      case 3: return "Advanced";
      default: return "Advanced"; // เปลี่ยน Master เป็น Advanced เพราะตันที่ 3
    }
  };

  return (
    <div className="w-full rounded-lg p-3 flex flex-col items-center">
      {/* ... ส่วน Rank Section ... */}
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
          {/* ส่ง maxExp แบบ Dynamic ไปให้ ExpBar */}
          <ExpBar currentExp={currentBarExp} maxExp={maxBarExp} />
          {/* Optional: แสดงข้อความเมื่อ Max Level */}
          {exp >= MAX_CAP_EXP && (
             <div className="text-center text-xs text-gray-500 mt-1 font-bold">
                Max Rank Reached! (Overlimit XP: +{currentBarExp.toLocaleString()})
             </div>
          )}
        </div>
      </div>

      {/* ... ส่วนสถิติวันนี้ (เหมือนเดิม) ... */}
      <h3 className="text-xl font-bold text-gray-700 mt-3 mb-3">สถิติในวันนี้</h3>
      <div className="w-full grid grid-cols-3 gap-3">
        {/* ... (Code เดิม) ... */}
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