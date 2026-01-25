"use client";

import React, { useState, useEffect } from 'react';
import { User, Loader2, Star } from 'lucide-react';
import { useSession } from "next-auth/react";

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

    const userData = session?.user as UserWithId | undefined;
    const currentUserId = userData?.id;

    const [mode, setMode] = useState<'speed' | 'rank'>('speed');
    const [selectedTime, setSelectedTime] = useState<1 | 3 | 5>(1);

    const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
    const [myRankData, setMyRankData] = useState<LeaderboardItem | null>(null);

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isTableLoading, setIsTableLoading] = useState(false);

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

    const filteredLeaderboard = leaderboardData.filter(item => {
        if (mode === 'rank' && item.displayVal2 === 0) return false;
        return true;
    });

    // ==========================================
    // 🧠 Logic เดียวกับ TodayStats เป๊ะๆ 100%
    // ==========================================
    const calculateRankInfo = (exp: number) => {
        const RANK_1_CAP = 2500;
        const RANK_2_CAP = 8500;

        let rank = 1;
        let stars = 0;

        if (exp < RANK_1_CAP) {
            // === RANK 1: BEGINNER ===
            rank = 1;
            const expPerStar = 500;
            stars = Math.floor(exp / expPerStar);

        } else if (exp < RANK_2_CAP) {
            // === RANK 2: INTERMEDIATE ===
            rank = 2;
            const expInRank = exp - RANK_1_CAP;
            const expPerStar = 1200;
            stars = Math.floor(expInRank / expPerStar);

        } else {
            // === RANK 3: ADVANCED ===
            rank = 3;
            const expInRank = exp - RANK_2_CAP;
            const expPerStar = 2000;
            stars = Math.floor(expInRank / expPerStar);
        }

        // กันเหนียว: ดาวต้องไม่เกิน 5 (ตาม UI TodayStats)
        if (stars > 5) stars = 5;

        return { rank, stars };
    };

    const championRankInfo = (topUser && mode === 'rank') ? calculateRankInfo(topUser.displayVal2) : { rank: 1, stars: 0 };

    if (status === "loading" || isInitialLoading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-gray-400">
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
                <div className="my-6 pb-8 border-b-1 animate-fadeInDown">
                    <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight mb-1 flex items-center gap-3">
                        {mode === 'speed' ? 'จัดอันดับความเร็ว' : 'จัดอันดับผู้เล่น'}
                    </h1>
                    <p className="text-lg text-gray-500 font-medium">
                        {mode === 'speed'
                            ? `สุดยอด 50 อันดับแรกที่มีความเร็วสูงสุด`
                            : `สุดยอด 50 ผู้เล่นที่มีเลเวลและประสบการณ์สูงสุด`
                        }
                    </p>
                </div>

                <div className="bg-[#5cb5db] rounded-[2rem] my-10 p-2 lg:p-10 shadow-xl animate-fade-up">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-white tracking-widest uppercase">
                                LEADERBOARD
                            </h2>
                            <p className="text-white text-sm font-medium mt-1">
                                อันดับคะแนนสูงสุด
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto justify-end">
                            {mode === 'speed' && (
                                <div className="bg-white p-1 rounded-xl flex items-center">
                                    {[1, 3, 5].map((time) => (
                                        <button key={time} onClick={() => setSelectedTime(time as 1 | 3 | 5)}
                                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all min-w-[70px] ${selectedTime === time ? 'bg-[#5cb5db] text-white shadow-md' : 'text-[#5cb5db] hover:bg-white/10'}`}>
                                            {time} นาที
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="bg-white p-1 rounded-xl flex items-center">
                                <button onClick={() => setMode('speed')} className={`px-8 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${mode === 'speed' ? 'bg-[#5cb5db] text-white shadow-md' : 'text-[#5cb5db]'}`}>
                                    <span>Speed</span>
                                </button>
                                <button onClick={() => setMode('rank')} className={`px-8 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${mode === 'rank' ? 'bg-[#5cb5db] text-white' : 'text-[#5cb5db] hover:bg-white/10'}`}>
                                    <span>Rank</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6 h-full">
                        <div className="w-full lg:w-1/3 h-70 flex flex-col items-center justify-start relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-white via-white to-white blur-[140px] rounded-full -z-10"></div>
                            <div className="relative z-0 transition-transform duration-500 pt-3 mt-5">
                                <img src="/ranktest.png" alt="Trophy" className="max-h-[280px] object-contain animate-float" />
                            </div>

                            {topUser ? (
                                <div className="z-10 w-full max-w-[380px] relative">
                                    {isTableLoading && (
                                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white backdrop-blur-[2px] rounded-3xl"><Loader2 size={40} className="animate-spin text-[#5cb5db]" /></div>
                                    )}
                                    <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 flex flex-col items-center text-center transform transition-all duration-300 hover:scale-105 shadow-lg border border-white">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-yellow-700 font-bold tracking-widest text-xl uppercase bg-yellow-300 px-10 py-1 rounded-full shadow-sm">Champion</span>
                                        </div>
                                        <h2 className="text-2xl font-black text-gray-800 mt-2">{topUser.user.username}</h2>
                                        <div className="flex items-center gap-6 mt-3 text-sm">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs text-gray-400 font-bold uppercase mb-1">{mode === 'speed' ? 'Speed' : 'Rank'}</span>
                                                {mode === 'speed' ? (
                                                    <span className="text-[#5cb5db] font-extrabold text-3xl">{topUser.displayVal1}</span>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center">
                                                        <img src={`/Rank${championRankInfo.rank}.png`} onError={(e) => e.currentTarget.src = '/Rank1.png'} className="h-10 object-contain" />
                                                        <div className="flex gap-0.5 mt-1">
                                                            {/* ✅ แสดง 5 ดาว ตาม TodayStats */}
                                                            {[1, 2, 3, 4, 5].map((starNum) => (
                                                                <Star key={starNum} size={12} className={starNum <= championRankInfo.stars ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"} />
                                                            ))}
                                                        </div>
                                                    </div>
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

                        <div className="w-full lg:w-2/3 h-[520px] bg-white rounded-3xl flex flex-col overflow-hidden shadow-sm border border-gray-100 relative">
                            <div className="overflow-y-auto flex-grow [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                <table className="w-full border-collapse relative">
                                    <thead className="sticky top-0 bg-gray-100 border-b-2 border-gray-200 z-10">
                                        <tr>
                                            <th className="py-3 px-6 text-center font-bold text-gray-700 w-32 bg-gray-100">อันดับ</th>
                                            <th className="py-3 px-3 text-left font-bold text-gray-700 bg-gray-100">ชื่อผู้ใช้</th>
                                            <th className="py-3 px-6 text-right font-bold text-gray-700 w-32 bg-gray-100">{mode === 'speed' ? 'WPM' : 'Rank'}</th>
                                            <th className="py-3 px-6 text-right font-bold text-gray-700 w-32 bg-gray-100">{mode === 'speed' ? 'ACC' : 'EXP'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {isTableLoading ? (
                                            <tr><td colSpan={4} className="h-[300px] text-center align-middle"><div className="flex flex-col items-center justify-center"><Loader2 size={48} className="animate-spin text-[#5cb5db] mb-2" /><span className="text-gray-400 font-medium">กำลังโหลดข้อมูล...</span></div></td></tr>
                                        ) : filteredLeaderboard.length === 0 ? (
                                            <tr><td colSpan={4} className="h-[300px] text-center align-middle"><div className="flex flex-col items-center justify-center text-gray-400"><span className="text-lg font-bold">ยังไม่มีข้อมูลการจัดอันดับ</span></div></td></tr>
                                        ) : (
                                            filteredLeaderboard.map((user, index) => {
                                                const isMe = isMeInList(user.userId);
                                                const displayRank = index + 1;
                                                const displayName = user.user.username || (isMe ? (userData?.name || "You") : "User");
                                                const { rank: userRank, stars: userStars } = calculateRankInfo(user.displayVal2);

                                                let rowBgClass = 'transition-colors duration-150 group hover:bg-blue-50';
                                                if (isMe) rowBgClass = 'bg-blue-50';
                                                else if (displayRank === 1) rowBgClass = 'bg-yellow-50/50';

                                                return (
                                                    <tr key={user.id} className={rowBgClass}>
                                                        <td className="py-3">
                                                            <div className="flex items-center justify-center"><div className="flex items-center justify-center gap-1 w-20">
                                                                <div className="w-8 flex justify-center items-center">
                                                                    {displayRank === 1 && <img src="/top1.png" className="w-8 h-8 object-contain" />}
                                                                    {displayRank === 2 && <img src="/top2.png" className="w-7 h-7 object-contain" />}
                                                                    {displayRank === 3 && <img src="/top3.png" className="w-7 h-7 object-contain" />}
                                                                </div>
                                                                <div className="w-6 text-left mr-4"><span className={`font-black text-2xl ${isMe ? 'text-[#5cb5db]' : 'text-gray-600'}`}>{displayRank}</span></div>
                                                            </div></div>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isMe ? 'bg-[#5cb5db] text-white border-[#5cb5db]' : 'bg-gray-100 text-gray-500 border-gray-200'}`}><User size={20} /></div>
                                                                <span className={`text-lg font-bold truncate max-w-[300px] ${isMe ? 'text-[#5cb5db]' : 'text-gray-700'}`}>{displayName} {isMe && '(You)'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 text-right">
                                                            {mode === 'speed' ? (
                                                                <span className={`font-extrabold text-2xl pr-5 ${displayRank <= 3 ? 'text-[#5cb5db]' : 'text-gray-500'}`}>{user.displayVal1}</span>
                                                            ) : (
                                                                <div className="flex flex-col items-end justify-center">
                                                                    <img src={`/Rank${userRank}.png`} onError={(e) => e.currentTarget.src = '/Rank1.png'} className="h-8 object-contain" />
                                                                    <div className="flex gap-0.5 mt-1">
                                                                        {/* ✅ แสดง 5 ดาว ในตารางด้วย */}
                                                                        {[1, 2, 3, 4, 5].map((starNum) => (
                                                                            <Star key={starNum} size={10} className={starNum <= userStars ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"} />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-3 text-right">
                                                            <span className="font-bold text-2xl text-gray-600">{mode === 'speed' ? `${user.displayVal2}%` : user.displayVal2.toLocaleString()}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {myRankData && (
                                <div className="relative z-20 p-2 bg-gray-100 border-t border-gray-200">
                                    {isTableLoading && <div className="absolute inset-0 z-30 flex items-center justify-center bg-gray-100/80 backdrop-blur-[1px]"><Loader2 size={32} className="animate-spin text-[#5cb5db]" /></div>}
                                    <div className="bg-white rounded-2xl p-2 pl-8 shadow-xl border border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 flex flex-col items-center justify-center border-r border-gray-100 pr-2">
                                                <span className="text-[10px] uppercase font-bold text-gray-400">Rank</span>
                                                <span className="text-3xl font-black text-gray-800 leading-none">{(mode === 'rank' && myRankData.displayVal2 === 0) ? "--" : (myRankData.rankOrder ? myRankData.rankOrder : "--")}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 pl-6">
                                                    <span className="text-lg font-bold text-gray-800">{(mode === 'rank' && myRankData.displayVal2 === 0) ? "คุณ (ยังไม่มีสถิติ)" : (myRankData.user.username || userData?.name || "You")}</span>
                                                    <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full">YOU</span>
                                                </div>
                                                <span className={`text-xs font-medium pl-6 ${myRankData.rankOrder && !(mode === 'rank' && myRankData.displayVal2 === 0) ? 'text-[#5cb5db]' : 'text-gray-400'}`}>
                                                    {(mode === 'rank' && myRankData.displayVal2 === 0) ? 'พยายามเข้านะ' : (myRankData.rankOrder ? 'ติด Top 50!' : 'พยายามเข้านะ')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-10">
                                            {mode === 'speed' && <div className="text-right"><div className="text-3xl font-black pr-5 text-[#5cb5db]">{myRankData.displayVal1}</div></div>}
                                            <div className="text-right"><div className="text-3xl font-bold text-gray-700 pr-4 logo-font">{mode === 'speed' ? `${myRankData.displayVal2}%` : `${myRankData.displayVal2.toLocaleString()} Exp`}</div></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}