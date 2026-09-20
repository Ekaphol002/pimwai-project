"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react';
import RankUpOverlay from './RankUpOverlay';
import { calculateRankInfo } from '@/lib/rankUtils';

interface RankProgressBoxProps {
    totalExp: number;   // XP รวมปัจจุบัน (หลังจบเกม)
    earnedExp: number;  // XP ที่เพิ่งได้ตานี้
    shouldAnimate: boolean; // ✅ ควบคุมว่าให้เริ่มอนิเมชันตอนไหน
}

export default function RankProgressBox({ totalExp, earnedExp, shouldAnimate }: RankProgressBoxProps) {

    // 1. คำนวณ EXP เก่า (ก่อนเล่นจบรอบนี้)
    const previousTotalExp = totalExp - earnedExp;

    // 2. State สำหรับทำ Animation (เริ่มที่ค่าเก่า -> ไหลไปค่าใหม่)
    const [displayExp, setDisplayExp] = useState(previousTotalExp);

    // 3. เริ่ม Animation เมื่อได้รับสัญญาณ shouldAnimate
    useEffect(() => {
        if (!shouldAnimate) return;

        let startTime: number;
        let animationFrameId: number;
        const duration = 1500; // ระยะเวลาอนิเมชัน (ms)
        const startValue = previousTotalExp;
        const endValue = totalExp;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Easing function (ease-out)
            const easeOutQuad = (t: number) => t * (2 - t);
            const easedProgress = easeOutQuad(progress);

            const currentVal = Math.floor(startValue + (endValue - startValue) * easedProgress);
            setDisplayExp(currentVal);

            if (progress < 1) {
                animationFrameId = window.requestAnimationFrame(animate);
            }
        };

        // Delay start slightly
        const timer = setTimeout(() => {
            animationFrameId = window.requestAnimationFrame(animate);
        }, 300);

        return () => {
            clearTimeout(timer);
            if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
        };
    }, [totalExp, shouldAnimate, previousTotalExp]);

    // 4. Rank Up Logic
    const [showRankUp, setShowRankUp] = useState(false);

    const prevInfo = calculateRankInfo(previousTotalExp);
    const currentInfo = calculateRankInfo(totalExp);

    useEffect(() => {
        if (!shouldAnimate) return;

        // เช็คว่ามีการอัพ Rank หรือไม่
        if (currentInfo.rank > prevInfo.rank) {
            // รอให้หลอด EXP วิ่งเสร็จก่อน (ประมาณ 1.5s) แล้วค่อยขึ้น Rank Up
            const timer = setTimeout(() => {
                setShowRankUp(true);
            }, 1600);
            return () => clearTimeout(timer);
        }
    }, [shouldAnimate, currentInfo.rank, prevInfo.rank]);

    // คำนวณค่าสำหรับแสดงผล (ใช้ displayExp เพื่อให้เห็นหลอดขยับ)
    const { rank, rankName, thaiRankName, stars, currentBarExp, maxBarExp, badgeBg } = calculateRankInfo(displayExp);

    // ข้อมูลเป้าหมาย (ใช้ totalExp) เพื่อดูว่า "ปลายทาง" อยู่ตรงไหน
    const targetInfo = calculateRankInfo(totalExp);

    // คำนวณ % ความกว้างหลอดฟ้า (Current)
    const progressPercent = Math.min(100, Math.max(0, (currentBarExp / maxBarExp) * 100));

    // คำนวณ % ความกว้างหลอดขาว (Target)
    let targetPercent = 0;
    if (targetInfo.rank > rank || (targetInfo.rank === rank && targetInfo.stars > stars)) {
        targetPercent = 100;
    } else {
        targetPercent = Math.min(100, Math.max(0, (targetInfo.currentBarExp / targetInfo.maxBarExp) * 100));
    }

    return (
        <>
            <div className="w-full rounded-2xl border-1 border-gray-200 p-4 pr-6 flex items-center relative">
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                {/* --- ฝั่งซ้าย: รูป Rank --- */}
                <div className="flex-shrink-0 relative group p-2">
                    <div className="absolute inset-0 bg-blue-400/20 items-center blur-xl rounded-full scale-0 group-hover:scale-110 transition-transform duration-500"></div>
                    <Image
                        src={`/Rank${rank}.png`}
                        width={100}
                        height={100}
                        alt={rankName}
                        className="relative drop-shadow-md object-contain w-30 h-20 mt-[-10] transition-transform duration-300 hover:scale-110 hover:-rotate-6"
                    />
                    <div className="z-20 absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className={`px-3 py-0.5 bg-gradient-to-r ${badgeBg} text-white font-black text-[11px] rounded-full border-2 border-white tracking-wider uppercase shadow-sm`}>
                            {rankName}
                        </span>
                    </div>
                </div>

                {/* --- ฝั่งขวา: หลอด EXP และ ดาว --- */}
                <div className="flex-grow flex flex-col justify-center">

                    {/* หัวข้อ + ตัวเลข EXP */}
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-bold text-slate-700">Level Progress</span>

                        <span className="text-xs font-mono text-slate-500 flex items-center">
                            <span className="font-bold text-sm text-slate-700 tabular-nums">
                                {Math.floor(currentBarExp).toLocaleString()}
                            </span>

                            {earnedExp > 0 && (
                                <span className="ml-1 text-xs font-bold text-yellow-500 animate-pulse">
                                    (+{earnedExp.toLocaleString()})
                                </span>
                            )}

                            <span className="mx-1 text-slate-400">/</span>
                            {maxBarExp.toLocaleString()} XP

                        </span>
                    </div>

                    {/* หลอด EXP */}
                    <div className="relative h-2 w-full rounded-full overflow-hidden">

                        {/* Layer 1: พื้นหลังสีเทา (Base Track) - อยู่ล่างสุด */}
                        <div className="absolute inset-0 bg-slate-200" />

                        {/* Layer 2: แท่งสีขาว (EXP ที่ได้มาเพิ่ม) - เป้าหมาย */}
                        <div
                            className="absolute top-0 left-0 h-full bg-[#5cb5db] opacity-30 rounded-full transition-all duration-300"
                            style={{ width: `${targetPercent}%` }}
                        />

                        {/* Layer 3: แท่งสีฟ้า (EXP เดิม -> วิ่งไปทับ) */}
                        <div
                            className="absolute top-0 left-0 h-full bg-[#5cb5db] rounded-full shadow-[0_0_10px_rgba(92,181,219,0.5)]"
                            style={{ width: `${progressPercent}%` }}
                        >
                            {/* แสงเงาบนหลอดฟ้า (Glassy Shine) */}
                            <div className="absolute top-0 inset-x-0 h-[50%] to-transparent rounded-t-full"></div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-slate-400 font-bold mr-2 uppercase">Rank Stars</span>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <div key={s} className="relative flex items-center justify-center">
                                    <Star
                                        size={16}
                                        className={`transition-colors duration-300 ${s <= stars ? "fill-yellow-400 text-yellow-400" : "fill-slate-200 text-slate-200"}`}
                                    />
                                    {s <= stars && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <Star
                                                size={16}
                                                className="fill-yellow-400 text-yellow-400 animate-star-stamp"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* 🔥 RANK UP OVERLAY 🔥 */}
            {showRankUp && (
                <RankUpOverlay
                    prevRank={prevInfo.rank}
                    currentRank={currentInfo.rank}
                    currentRankName={currentInfo.rankName}
                    onClose={() => setShowRankUp(false)}
                />
            )}
        </>
    );
}