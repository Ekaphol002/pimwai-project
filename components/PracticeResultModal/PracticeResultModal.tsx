// components/PracticeResultModal/PracticeResultModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Star, ChevronDown, Clock } from 'lucide-react';
import StarParticleEffect from '../StarParticleEffect/StarParticleEffect';
import Keyboard from '@/components/Keyboard/Keyboard';
import RankProgressBox from './RankProgressBox';

// Define the structure for the XP breakdown object
interface XpBreakdown {
  base: number;
  quest: number;
  wpm: number;
  grinder: number;
  firstWin: number;
}

type Props = {
  wpm: number;
  acc: number;
  stars: number;
  time: string;
  problemKeys: { [key: string]: number };
  onRetry: () => void;
  onNextLesson: () => void;
  onGoToLessons: () => void;
  isTestMode?: boolean;
  earnedXP?: number;
  xpBreakdown?: XpBreakdown | null;
  questText?: string | null;
  totalXP?: number;
};

function useCountUp(endValue: number, duration: number) {
  const [count, setCount] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * endValue));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setIsDone(true);
      }
    };
    window.requestAnimationFrame(step);
  }, [endValue, duration]);

  return { count, isDone };
}

export default function PracticeResultModal({
  wpm,
  acc,
  stars,
  time,
  problemKeys,
  onRetry,
  onNextLesson,
  onGoToLessons,
  isTestMode = false,
  earnedXP = 0,
  xpBreakdown = null, // Default value is null
  questText = null,
  totalXP = 0
}: Props) {

  const [isExpanded, setIsExpanded] = useState(false);
  const { count: displayWpm, isDone: isWpmDone } = useCountUp(wpm, 1200);
  const { count: displayAcc, isDone: isAccDone } = useCountUp(acc, 1200);
  const [displayStars, setDisplayStars] = useState(0);
  const [activeParticleIndices, setActiveParticleIndices] = useState<number[]>([]);
  const [startExpAnimation, setStartExpAnimation] = useState(false); // ✅ State สำหรับเริ่มอนิเมชันหลอด EXP

  // Effect สำหรับควบคุมจังหวะการเริ่มอนิเมชัน EXP (รอให้ดาวเด้งครบก่อน)
  useEffect(() => {
    if (isTestMode) return;
    if (!isWpmDone || !isAccDone) return;

    let delay = 0;
    if (stars > 0) {
      // สูตรคำนวณเวลา: ดาวดวงสุดท้ายเด้งตอน (stars - 1) * 600
      // บวกเพิ่มอีกหน่อยเพื่อให้ดาวเด้งเสร็จนิ่งๆ แล้วค่อยเลื่อนหลอด
      delay = ((stars - 1) * 600) + 800;
    } else {
      delay = 300; // ถ้าไม่ได้ดาวเลย ให้รอนิดนึงแล้วเลื่อนเลย
    }

    const timer = setTimeout(() => {
      setStartExpAnimation(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isWpmDone, isAccDone, stars, isTestMode]);

  useEffect(() => {
    if (isTestMode) return;
    if (!isWpmDone || !isAccDone || stars === 0) return;

    const timers: NodeJS.Timeout[] = [];
    for (let i = 1; i <= stars; i++) {
      const starPopTimer = setTimeout(() => {
        setDisplayStars(i);
        setActiveParticleIndices(prev => [...prev, i]);
        const clearParticleTimer = setTimeout(() => {
          setActiveParticleIndices(prev => prev.filter(index => index !== i));
        }, 4000);
        timers.push(clearParticleTimer);
      }, (i - 1) * 600);
      timers.push(starPopTimer);
    }
    return () => timers.forEach(timer => clearTimeout(timer));
  }, [isWpmDone, isAccDone, stars, isTestMode]);

  const problemKeyEntries = Object.entries(problemKeys)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 5);
  const topProblemKeys = Object.fromEntries(problemKeyEntries);

  return (
    <div className="w-full max-w-2xl">
      <div className="relative w-full rounded-2xl bg-white p-8 shadow-2xl transition-all duration-300 ease-in-out mt-1">

        {/* Decorative Stars */}
        <div className="absolute -top-3 -left-12 z-1 animate-floating-star" style={{ animationDelay: '0s' }}>
          <img src="/Starcorner1.png" alt="Star" className="w-50 h-25" />
        </div>
        <div className="absolute -top-3 -right-12 z-1 animate-floating-star" style={{ animationDelay: '0.8s' }}>
          <img src="/Starcorner2.png" alt="Star" className="w-50 h-25" />
        </div>

        {/* Title */}
        <h2 className="text-center text-4xl font-bold text-gray-800">
          {isTestMode ? "จบการทดสอบ!" : "คุณทำได้ดีมาก!"}
        </h2>
        <p className="my-2 text-center text-2xl text-gray-600">
          {isTestMode ? "สรุปผลลัพธ์ความเร็วของคุณ" : "คุณทำความเร็วและความแม่นยำได้"}
        </p>

        {/* Stats */}
        <div className="m-5 my-4 grid grid-cols-[1fr_auto_1fr] items-baseline">
          <div className="text-right mr-3">
            <span className={`text-6xl font-bold text-[#70cb67] ${isWpmDone ? 'animate-number-pop' : ''}`}>{displayWpm}</span>
            <span className="ml-1 text-xl font-bold text-[#70cb67] uppercase">wpm</span>
          </div>
          <span className="text-xl text-gray-400 font-semibold text-center mx-4">with</span>
          <div className="text-left">
            <span className={`text-6xl font-bold text-[#70cb67] ${isAccDone ? 'animate-number-pop' : ''}`}>{displayAcc}%</span>
            <span className="ml-1 text-xl font-bold text-[#70cb67] uppercase">acc</span>
          </div>
        </div>

        {/* Stars Text */}
        {isTestMode ? (
          <div className="text-center mb-6">
            <div className="inline-block px-8">
              <p className="text-gray-500 text-sm font-semibold mb-1">ระยะเวลาทดสอบ</p>
              <p className="text-gray-500 font-bold text-3xl">{time}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="my-5 flex justify-center gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="relative isolate animate-floating-star" style={{ animationDelay: `${i * 1}s` }}>
                  {activeParticleIndices.includes(i) && (
                    <StarParticleEffect key={`particle-${i}`} count={30} sizeMin={40} sizeMax={50} duration={3000} spread={500} />
                  )}
                  <Star size={80} className="text-gray-300 stroke-1 relative z-10" fill="none" />
                  <div className="absolute top-0 left-0 w-full h-full z-20">
                    {i <= displayStars && (
                      <Star size={80} className="absolute top-0 left-0 text-yellow-400 animate-star-pop-in" fill="#FACC15" />
                    )}
                    {i <= displayStars && (
                      <span className="absolute inset-0 animate-shimmer-overlay" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-lg font-bold text-gray-700 mb-6">
              คุณได้ {displayStars}/3 ดาวในความแม่นยำ!!!
            </p>
          </>
        )}

        {/* ========================================================= */}
        {/* แถวเครื่องมือ: [ EXP Breakdown ] --- [ ปุ่มเพิ่มเติม ] --- [ เวลา ] */}
        {/* ========================================================= */}
        <div className="relative mt-8 min-h-16 flex justify-center items-end">

          <div className="absolute left-0 bottom-1 flex flex-col items-start gap-1 z-20 pl-2">

            {/* ✅ โซนแสดงรายละเอียด Breakdown */}
            <div className="flex flex-col-reverse gap-1 mb-1">

              {/* 1. First Win */}
              {xpBreakdown && xpBreakdown.firstWin > 0 && (
                <div className="flex items-center gap-2 animate-slide-up text-xs font-bold text-gray-400">
                  <span>ประเดิมด่านแรกของวัน</span>
                  <span>+{xpBreakdown.firstWin}</span>
                </div>
              )}

              {/* 2. Grinder Bonus (โบนัสช่องกลาง) */}
              {/* Lesson Mode = โบนัสขยัน (จำนวนด่าน) | Test Mode = โบนัสความแม่นยำ */}
              {xpBreakdown && xpBreakdown.grinder > 0 && (
                <div className="flex items-center gap-2 animate-slide-up text-xs font-bold text-gray-400" style={{ animationDelay: '100ms' }}>
                  <span>
                    {isTestMode
                      ? "แม่นยำสูง (Accuracy Bonus)"
                      : (xpBreakdown.grinder === 100 ? "ขยันจัด! ครบ 20 ด่าน" :
                        xpBreakdown.grinder === 50 ? "ขยันมาก! ครบ 10 ด่าน" :
                          "เครื่องร้อน! ครบ 5 ด่าน")
                    }
                  </span>
                  <span>+{xpBreakdown.grinder}</span>
                </div>
              )}

              {/* 3. WPM Bonus (โบนัสความเร็ว) */}
              {xpBreakdown && xpBreakdown.wpm > 0 && (
                <div className="flex items-center gap-2 animate-slide-up text-xs font-bold text-gray-400" style={{ animationDelay: '200ms' }}>
                  <span>
                    {isTestMode
                      ? "ความเร็ว (Speed XP)"
                      : (xpBreakdown.wpm >= 20 ? "นิ้วไฟลุก! (>50 WPM)" :
                        xpBreakdown.wpm >= 10 ? "พิมพ์เร็วพริ้ว (>40 WPM)" :
                          "สปีดกำลังดี (>30 WPM)")
                    }
                  </span>
                  <span>+{xpBreakdown.wpm}</span>
                </div>
              )}

              {/* 4. Quest Bonus (โบนัสช่องล่าง) */}
              {/* Lesson Mode = ภารกิจ | Test Mode = ความอึด (Endurance) */}
              {xpBreakdown && xpBreakdown.quest > 0 && (
                <div className="flex items-center gap-2 animate-slide-up text-xs font-bold text-gray-400" style={{ animationDelay: '300ms' }}>
                  <span>
                    {isTestMode
                      ? "จอมอึด (Endurance Bonus)" // โหมด Test ใช้คำนี้
                      : (questText || "ภารกิจลับสำเร็จ") // ✅ โหมดปกติ ใช้ชื่อเควสจริง!
                    }
                  </span>
                  <span>+{xpBreakdown.quest}</span>
                </div>
              )}

              {/* 5. Base XP */}
              {/* Test Mode อาจจะไม่มี Base แยก เพราะรวมไปใน Speed แล้ว หรือถ้ามีก็แสดงได้ */}
              {!isTestMode && (
                <div className="flex items-center gap-2 animate-slide-up text-xs font-medium text-gray-400" style={{ animationDelay: '400ms' }}>
                  <span>คะแนนจากดาว</span>
                  <span>+{xpBreakdown?.base || 0}</span>
                </div>
              )}
            </div>

            {/* XP รวม (ตัวใหญ่ด้านล่าง) */}
            <div className="flex items-baseline gap-2 border-t border-gray-200/50 pt-1 w-full">
              <span className="text-3xl text-yellow-400 font-black animate-number-pop filter drop-shadow-sm">
                + {earnedXP} XP
              </span>
            </div>
          </div>

          {/* 2. ตรงกลาง: ปุ่มเพิ่มเติม */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex flex-col items-center text-blue-500 hover:text-blue-700 text-sm font-semibold z-20 pb-1"
          >
            <span>{isExpanded ? 'ซ่อนรายละเอียด' : 'เพิ่มเติม'}</span>
            <ChevronDown size={20} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>

          {/* 3. ขวาสุด: เวลา */}
          <div className="absolute right-0 bottom-1 flex items-center gap-1.5 text-gray-600 bg-gray-50 px-4 py-1 rounded-full border border-gray-200">
            <Clock size={18} />
            <span className="text-xl font-bold font-mono">{time}</span>
          </div>
        </div>

        {!isExpanded && <hr className="my-6 border-gray-300" />}

        {/* Expanded Details */}
        <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="mt-4">
              <hr className="mb-6 border-gray-300" />
              <h3 className="text-2xl font-bold text-center text-[#d76060] mb-4">ปุ่มที่คุณพิมพ์ผิด</h3>

              {problemKeyEntries.length === 0 ? (
                <p className="text-center text-gray-500">ยอดเยี่ยม! ไม่พบข้อผิดพลาด</p>
              ) : (
                <div className="flex justify-center gap-2 flex-wrap mb-4">
                  {problemKeyEntries.map(([key, count]) => (
                    <div key={key} className="flex flex-col items-center p-2 w-16 border-2 border-red-300 rounded-md bg-red-50">
                      <span className="text-2xl font-bold text-red-600">{key === ' ' ? '_' : key}</span>
                      <span className="text-xs text-red-500">{count} ครั้ง</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="w-full p-4 bg-gray-100 rounded-md text-center text-gray-500">
                <Keyboard heatmapData={topProblemKeys} pressedKey={null} errorKey={null} expectedKey={null} />
              </div>

              <hr className="my-6 border-gray-300" />
            </div>
          </div>
        </div>

        {/* Rank & EXP Progress Box (อยู่ด้านล่าง เพิ่มเติม และถูกดันลงเมื่อกด expand) */}
        {totalXP > 0 && !isTestMode && (
          <div className="mb-6">
            <RankProgressBox
              totalExp={totalXP}
              earnedExp={earnedXP}
              shouldAnimate={startExpAnimation}
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-between items-center">
          <button onClick={onGoToLessons} className="text-blue-500 hover:underline">
            {isTestMode ? "กลับหน้าเมนูทดสอบ" : "กลับไปหน้าบทเรียน"}
          </button>
          <div className="flex gap-2">
            <button onClick={onRetry} className="px-6 py-2 rounded-lg font-bold text-gray-700 border border-gray-300 hover:bg-gray-100">เริ่มใหม่</button>
            <button onClick={onNextLesson} className="px-6 py-2 rounded-lg font-bold text-white bg-yellow-500 hover:bg-yellow-600">
              {isTestMode ? "ตกลง" : "ต่อไป"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}