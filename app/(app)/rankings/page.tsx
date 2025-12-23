"use client";

import React, { useState, useEffect } from 'react';
import { Timer, User, Trophy, Loader2, Medal } from 'lucide-react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UserWithId {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
}

interface LeaderboardItem {
    id: string;
    userId: string;
    rankOrder: number | null;
    displayVal1: number;
    displayVal2: number;
    isSpeedMode: boolean;
    user: {
        username: string;
        id: string;
        rank?: number;
    };
}

export default function LeaderboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const userData = session?.user as UserWithId | undefined;
    const currentUserId = userData?.id;

    const [mode, setMode] = useState<'speed' | 'rank'>('speed');
    const [selectedTime, setSelectedTime] = useState<1 | 3 | 5>(1);

    const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
    const [myRankData, setMyRankData] = useState<LeaderboardItem | null>(null);

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isTableLoading, setIsTableLoading] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    const fetchLeaderboard = async (isFirstLoad = false) => {
        if (isFirstLoad) setIsInitialLoading(true);
        else setIsTableLoading(true);

        try {
            const res = await fetch(`/api/leaderboard?mode=${mode}&duration=${selectedTime}`);
            const data = await res.json();
            if (data.success) {
                setLeaderboardData(data.leaderboard);
                setMyRankData(data.myRank);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setIsInitialLoading(false);
            setIsTableLoading(false);
        }
    };
    useEffect(() => {
        if (status === "authenticated") {
            fetchLeaderboard(true);
        }
    }, [status]);

    useEffect(() => {
        if (!isInitialLoading) {
            fetchLeaderboard(false);
        }
    }, [mode, selectedTime]);

    const topUser = leaderboardData.length > 0 ? leaderboardData[0] : null;
    const isMeInList = (userId: string) => userId === currentUserId;

    // กรองข้อมูล (ถ้า Rank mode และ EXP 0 ไม่แสดง)
    const filteredLeaderboard = leaderboardData.filter(item => {
        if (mode === 'rank' && item.displayVal2 === 0) return false;
        return true;
    });

    if (status === "loading" || isInitialLoading) {
        return (
            <div className="h-[600px] flex flex-col items-center justify-center text-gray-400">
                <Loader2 size={64} className="animate-spin mb-4 text-[#5cb5db]" />
                <p className="text-xl font-bold">กำลังโหลดข้อมูล...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
            <style jsx global>{`
                @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-up { animation: fadeUp 0.5s ease-out forwards; }
            `}</style>

            <main className="flex-grow w-full max-w-7xl mx-auto px-6 pt-5 pb-4">

                {/* --- ส่วนหัว --- */}
                <div className="flex flex-col xl:flex-row justify-between items-end mb-6 gap-6 p-4 border-b-2 border-gray-300 animate-fadeInDown">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight mb-1 flex items-center gap-3">
                            {mode === 'speed' ? 'จัดอันดับความเร็ว' : 'จัดอันดับผู้เล่น'}
                        </h1>
                        <p className="text-lg text-gray-500 font-medium">
                            {mode === 'speed'
                                ? `สุดยอด 50 อันดับแรกที่มีความเร็วสูงสุด (${selectedTime} นาที)`
                                : `สุดยอด 50 ผู้เล่นที่มีเลเวลและประสบการณ์สูงสุด`
                            }
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 animate-fadeInDown">

                        {/* ✅ ส่วนเลือกเวลา (ปรับใหม่ตามรูปตัวอย่าง) */}
                        {mode === 'speed' && (
                            <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex items-center mr-2">
                                {[1, 3, 5].map((time) => (
                                    <button
                                        key={time}
                                        onClick={() => setSelectedTime(time as 1 | 3 | 5)}
                                        className={`
                                            px-4 py-2 rounded-lg font-bold text-sm transition-all min-w-[70px]
                                            ${selectedTime === time
                                                ? 'bg-[#5cb5db] text-white shadow-sm' // ปุ่มที่เลือก: สีฟ้า ตัวหนังสือขาว
                                                : 'text-gray-600 hover:bg-gray-50'   // ปุ่มปกติ: สีเทา พื้นหลังใส
                                            }
                                        `}
                                    >
                                        {time} นาที
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* ส่วนเลือกโหมด (Speed / Rank) คงเดิมไว้ */}
                        {/* ส่วนเลือกโหมด (Speed / Rank) - ดีไซน์เดียวกับปุ่มเวลา */}
                        <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex items-center">

                            {/* ปุ่ม Speed */}
                            <button
                                onClick={() => setMode('speed')}
                                className={`
                                    px-8 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all
                                    ${mode === 'speed'
                                        ? 'bg-[#5cb5db] text-white shadow-sm' // Active: สีฟ้าเหมือนปุ่มเวลา
                                        : 'text-gray-600 hover:bg-gray-50'   // Inactive: สีเทา
                                    }
                                `}
                            >
                                <span>Speed</span>
                            </button>

                            {/* ปุ่ม Rank */}
                            <button
                                onClick={() => setMode('rank')}
                                className={`
                                    px-8 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all
                                    ${mode === 'rank'
                                        ? 'bg-[#5cb5db] text-white shadow-sm' // Active: ใช้สีฟ้าเหมือนกัน เพื่อความคุมโทน
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }
                                `}
                            >
                                <span>Rank</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 h-[600px]">

                    {/* --- [ฝั่งซ้าย] Champion Show --- */}
                    <div className="w-full lg:w-1/3 h-full flex flex-col items-center justify-start relative animate-fadeInDown">
                        <div className="relative z-0 transition-transform duration-500 pt-3 mt-14">
                            <img src="/ranktest.png" alt="Trophy" className="max-h-[280px] object-contain animate-float" />
                        </div>

                        {topUser ? (
                            <div className="z-10 w-full max-w-[380px] relative">
                                {/* ✅ 1. Champion Loading Overlay */}
                                {isTableLoading && (
                                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white backdrop-blur-[2px] rounded-3xl">
                                        <Loader2 size={40} className="animate-spin text-[#5cb5db]" />
                                    </div>
                                )}

                                <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 flex flex-col items-center text-center transform transition-all duration-300 hover:scale-105 shadow-lg border border-white">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-yellow-700 font-bold tracking-widest text-xl uppercase bg-yellow-300 px-10 py-1 rounded-full shadow-sm">
                                            Champion
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-800 mt-2">{topUser.user.username}</h2>

                                    <div className="flex items-center gap-6 mt-3 text-sm">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs text-gray-400 font-bold uppercase mb-1">{mode === 'speed' ? 'Speed' : 'Rank'}</span>
                                            {mode === 'speed' ? (
                                                <span className="text-[#5cb5db] font-extrabold text-3xl">{topUser.displayVal1}</span>
                                            ) : (
                                                <img src={`/Rank${topUser.displayVal1}.png`} onError={(e) => e.currentTarget.src = '/Rank1.png'} className="w-20 h-10 object-contain" />
                                            )}
                                        </div>
                                        <div className="w-[1px] h-10 bg-gray-200"></div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs text-gray-400 font-bold uppercase mb-1">{mode === 'speed' ? 'Acc' : 'EXP'}</span>
                                            <span className="text-gray-600 font-extrabold text-2xl">
                                                {mode === 'speed' ? `${topUser.displayVal2}%` : topUser.displayVal2.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            !isTableLoading && (
                                <div className="z-10 w-full max-w-[380px] h-[200px] flex flex-col items-center justify-center text-gray-400 font-bold bg-white/80 p-4 rounded-3xl shadow-lg border border-white backdrop-blur-sm">
                                    <span>ยังไม่มีผู้เล่นในหมวดนี้</span>
                                </div>
                            )
                        )}
                    </div>

                    {/* --- [ฝั่งขวา] ตาราง --- */}
                    <div className="w-full lg:w-2/3 h-[500px] bg-white rounded-3xl flex flex-col overflow-hidden animate-fadeInDown shadow-sm border border-gray-100 relative">

                        <div className="overflow-y-auto flex-grow [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            <table className="w-full border-collapse relative">
                                <thead className="sticky top-0 bg-gray-50 border-b-1 border-gray-300 z-10 ">
                                    <tr>
                                        <th className="py-3 px-6 text-center font-bold text-white w-24 bg-[#5cb5db]">อันดับ</th>
                                        <th className="py-3 px-3 text-left font-bold text-white bg-[#5cb5db]">ชื่อผู้ใช้</th>
                                        <th className="py-3 px-6 text-right font-bold text-white w-32 bg-[#5cb5db]">{mode === 'speed' ? 'WPM' : 'Rank'}</th>
                                        <th className="py-3 px-6 text-right font-bold text-white w-32 bg-[#5cb5db]">{mode === 'speed' ? 'ACC' : 'EXP'}</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {isTableLoading ? (
                                        <tr>
                                            <td colSpan={4} className="h-[300px] text-center align-middle">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Loader2 size={48} className="animate-spin text-[#5cb5db] mb-2" />
                                                    <span className="text-gray-400 font-medium">กำลังโหลดข้อมูล...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredLeaderboard.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="h-[300px] text-center align-middle">
                                                <div className="flex flex-col items-center justify-center text-gray-400">
                                                    <Trophy size={48} className="mb-2 opacity-20" />
                                                    <span className="text-lg font-bold">ยังไม่มีข้อมูลการจัดอันดับ</span>
                                                    <span className="text-sm font-medium opacity-70">มาเริ่มเล่นเป็นคนแรกกันเถอะ!</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLeaderboard.map((user, index) => {
                                            const isMe = isMeInList(user.userId);
                                            const displayRank = index + 1;
                                            const displayName = user.user.username || (isMe ? (userData?.name || "You") : "User");

                                            let rowBgClass = 'transition-colors duration-150 group hover:bg-blue-50';
                                            if (isMe) rowBgClass = 'bg-blue-50';
                                            else if (displayRank === 1) rowBgClass = 'bg-yellow-50/50';

                                            return (
                                                <tr key={user.id} className={rowBgClass}>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex justify-center">
                                                            {displayRank === 1 ? <img src="/top1.png" className="w-8 h-8" /> :
                                                                displayRank === 2 ? <img src="/top2.png" className="w-7 h-7" /> :
                                                                    displayRank === 3 ? <img src="/top3.png" className="w-7 h-7" /> :
                                                                        <span className={`font-black text-xl ${isMe ? 'text-[#5cb5db]' : 'text-gray-600'}`}>{displayRank}</span>
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isMe ? 'bg-[#5cb5db] text-white border-[#5cb5db]' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                                <User size={20} />
                                                            </div>
                                                            <span className={`text-lg font-bold truncate max-w-[150px] ${isMe ? 'text-[#5cb5db]' : 'text-gray-700'}`}>
                                                                {displayName} {isMe && '(You)'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        {mode === 'speed' ? (
                                                            <span className={`font-extrabold text-2xl pr-5 ${displayRank <= 3 ? 'text-[#5cb5db]' : 'text-gray-500'}`}>
                                                                {user.displayVal1}
                                                            </span>
                                                        ) : (
                                                            <div className="flex justify-end">
                                                                <img src={`/Rank${user.displayVal1}.png`} alt="Rank" onError={(e) => e.currentTarget.src = '/Rank1.png'} className="w-20 h-10 object-contain drop-shadow-sm" />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <span className="font-bold text-2xl text-gray-600">
                                                            {mode === 'speed' ? `${user.displayVal2}%` : user.displayVal2.toLocaleString()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* --- Your Rank Bar --- */}
                        {myRankData && (
                            <div className="relative z-20 p-2 bg-[#5cb5db] border-t border-gray-100">
                                {/* ✅ 2. My Rank Loading Overlay */}
                                {isTableLoading && (
                                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#5cb5db] backdrop-blur-[1px]">
                                        <Loader2 size={32} className="animate-spin text-white" />
                                    </div>
                                )}

                                <div className="bg-white rounded-2xl p-2 pr-6 shadow-xl border border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 flex flex-col items-center justify-center border-r border-gray-100 pr-2">
                                            <span className="text-[10px] uppercase font-bold text-gray-400">Rank</span>
                                            <span className="text-3xl font-black text-gray-800 leading-none">
                                                {myRankData.rankOrder ? myRankData.rankOrder : "--"}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-bold text-gray-800">
                                                    {myRankData.user.username || userData?.name || "You"}
                                                </span>
                                                <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full">YOU</span>
                                            </div>
                                            <span className={`text-xs font-medium ${myRankData.rankOrder ? 'text-[#5cb5db]' : 'text-gray-400'}`}>
                                                {myRankData.rankOrder ? 'ติด Top 50!' : 'พยายามเข้านะ'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-14">
                                        <div className="text-right flex flex-col items-end">
                                            {mode === 'speed' ? (
                                                <div className="text-2xl font-black text-[#5cb5db]">{myRankData.displayVal1}</div>
                                            ) : (
                                                <img src={`/Rank${myRankData.displayVal1}.png`} onError={(e) => e.currentTarget.src = '/Rank1.png'} className="w-15 h-10 object-contain" />
                                            )}
                                            <div className="text-[9px] text-gray-400 font-bold uppercase">{mode === 'speed' ? 'WPM' : 'Rank'}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-gray-700">
                                                {mode === 'speed' ? `${myRankData.displayVal2}%` : myRankData.displayVal2.toLocaleString()}
                                            </div>
                                            <div className="text-[9px] text-gray-400 font-bold uppercase">{mode === 'speed' ? 'ACC' : 'EXP'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}