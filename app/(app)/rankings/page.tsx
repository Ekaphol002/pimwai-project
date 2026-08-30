"use client";

import React, { useState, useEffect } from 'react';
import { User, Loader2, Star, Crown, Flame, Flag, AlertTriangle, X, Check } from 'lucide-react';
import { useSession } from "next-auth/react";
import toast, { Toaster } from 'react-hot-toast';

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
        image?: string | null;
    };
}

export default function LeaderboardPage() {
    const { data: session, status } = useSession();

    const userData = session?.user as UserWithId | undefined;
    const currentUserId = userData?.id;

    const [mode, setMode] = useState<'speed' | 'rank' | 'streak'>('speed');
    const [selectedTime, setSelectedTime] = useState<1 | 3 | 5>(1);

    const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
    const [myRankData, setMyRankData] = useState<LeaderboardItem | null>(null);

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isTableLoading, setIsTableLoading] = useState(false);

    // Custom Context Menu State (คลิกขวา)
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; userId: string; userName: string } | null>(null);

    // Report Modal State
    const [reportingUser, setReportingUser] = useState<{ id: string; name: string } | null>(null);
    const [reportReason, setReportReason] = useState('inappropriate_avatar');
    const [reportDetails, setReportDetails] = useState('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);

    const fetchLeaderboard = async (isFirstLoad = false) => {
        if (isFirstLoad) setIsInitialLoading(true);
        else setIsTableLoading(true);

        try {
            const res = await fetch(`/api/leaderboard?mode=${mode}&duration=${selectedTime}`);
            const data = await res.json();
            if (data.success) {
                setLeaderboardData(data.leaderboard || []);
                setMyRankData(data.myData || data.myRank || null);
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

    // ปิดเมนูคลิกขวาเมื่อคลิกที่อื่น
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // จัดการคลิกขวาที่แถว/ชื่อผู้ใช้
    const handleContextMenu = (e: React.MouseEvent, userId: string, userName: string, isMe: boolean) => {
        if (isMe) return; // ไม่เปิดเมนูรายงานตัวเอง
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            userId,
            userName
        });
    };

    const handleOpenReportFromContext = () => {
        if (!contextMenu) return;
        if (!session?.user) {
            toast.error('กรุณาเข้าสู่ระบบก่อนทำการรายงาน');
            return;
        }
        setReportingUser({ id: contextMenu.userId, name: contextMenu.userName });
        setReportReason('inappropriate_avatar');
        setReportDetails('');
        setContextMenu(null);
    };

    const handleSubmitReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reportingUser) return;

        setIsSubmittingReport(true);
        try {
            const res = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportedUserId: reportingUser.id,
                    reason: reportReason,
                    details: reportDetails
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success('ส่งรายงานเรียบร้อยแล้ว แอดมินจะตรวจสอบทันที');
                setReportingUser(null);
            } else {
                toast.error(data.error || 'เกิดข้อผิดพลาดในการส่งรายงาน');
            }
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setIsSubmittingReport(false);
        }
    };

    const topUser = leaderboardData.length > 0 ? leaderboardData[0] : null;
    const isMeInList = (userId: string) => userId === currentUserId;

    const filteredLeaderboard = leaderboardData.filter(item => {
        if (mode === 'rank' && item.displayVal2 === 0) return false;
        return true;
    });

    const calculateRankInfo = (exp: number) => {
        const RANK_1_CAP = 2500;
        const RANK_2_CAP = 8500;

        let rank = 1;
        let stars = 0;

        if (exp < RANK_1_CAP) {
            rank = 1;
            const expPerStar = 500;
            stars = Math.floor(exp / expPerStar);
        } else if (exp < RANK_2_CAP) {
            rank = 2;
            const expInRank = exp - RANK_1_CAP;
            const expPerStar = 1200;
            stars = Math.floor(expInRank / expPerStar);
        } else {
            rank = 3;
            const expInRank = exp - RANK_2_CAP;
            const expPerStar = 2000;
            stars = Math.floor(expInRank / expPerStar);
        }

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

    const top1 = filteredLeaderboard[0];
    const top2 = filteredLeaderboard[1];
    const top3 = filteredLeaderboard[2];

    return (
        <div className="min-h-screen bg-[#f4f7fb] flex flex-col font-sans relative overflow-x-hidden pb-10">
            <Toaster position="top-center" />

            <style jsx global>{`
                @keyframes slide-up { 0% { transform: translateY(30px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
                .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                @keyframes slide-up-podium { 0% { transform: translateY(400px); } 100% { transform: translateY(0); } }
                .animate-slide-up-podium { animation: slide-up-podium 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>

            <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 flex flex-col">
                <div className="bg-[#5cb5db] rounded-[2.5rem] p-4 sm:p-8 flex flex-col relative shadow-xl overflow-hidden min-h-[850px]">
                    {/* Top Header Row: Title & Subtitle on Left, Mode Selector on Right */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 z-20 gap-4">
                        <div className="flex flex-col">
                            <h2 className="text-white text-3xl sm:text-4xl font-black tracking-wide drop-shadow-sm logo-font">
                                Leaderboard
                            </h2>
                            <p className="text-white/80 text-xs sm:text-sm font-medium mt-1">
                                ตารางจัดอันดับผู้ฝึกพิมพ์ดีดที่มีความเร็ว ความแม่นยำ และความต่อเนื่องสูงสุด
                            </p>
                        </div>

                        {/* Mode Selector (Speed / Rank / Streak) placed at Top-Right */}
                        <div className="bg-white p-1 rounded-full flex items-center shadow-sm shrink-0">
                            <button
                                onClick={() => setMode('speed')}
                                className={`px-5 py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer ${mode === 'speed'
                                    ? 'bg-[#5cb5db] text-white shadow-xs'
                                    : 'text-[#5cb5db] hover:bg-gray-50'
                                    }`}
                            >
                                Speed
                            </button>
                            <button
                                onClick={() => setMode('rank')}
                                className={`px-5 py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer ${mode === 'rank'
                                    ? 'bg-[#5cb5db] text-white shadow-xs'
                                    : 'text-[#5cb5db] hover:bg-gray-50'
                                    }`}
                            >
                                Rank
                            </button>
                            <button
                                onClick={() => setMode('streak')}
                                className={`px-5 py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 flex items-center gap-1 cursor-pointer ${mode === 'streak'
                                    ? 'bg-[#5cb5db] text-white shadow-xs'
                                    : 'text-[#5cb5db] hover:bg-gray-50'
                                    }`}
                            >
                                <span>Streak</span>
                            </button>
                        </div>
                    </div>

                    {/* Sub-Row: Duration Selector (Speed Mode) on Left */}
                    <div className="flex items-center mb-4 z-20 min-h-[44px]">
                        {mode === 'speed' ? (
                            <div className="bg-white p-1 rounded-full flex items-center shadow-sm">
                                {[1, 3, 5].map((time) => (
                                    <button
                                        key={time}
                                        onClick={() => setSelectedTime(time as 1 | 3 | 5)}
                                        className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer ${selectedTime === time
                                            ? 'bg-[#5cb5db] text-white shadow-xs'
                                            : 'text-[#5cb5db] hover:bg-gray-50'
                                            }`}
                                    >
                                        {time} นาที
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="h-9"></div>
                        )}
                    </div>

                    {/* Top 3 Podium Container (Kept in DOM so images preload behind table smoothly) */}
                    <div className="relative min-h-[140px] sm:min-h-[220px] md:min-h-[280px] w-full flex items-end justify-center">
                        {filteredLeaderboard.length > 0 && (
                            <div
                                key={`${mode}-${selectedTime}`}
                                className={`flex justify-center items-end gap-2 sm:gap-6 md:gap-8 relative z-10 ${
                                    isTableLoading ? 'opacity-0' : 'animate-slide-up-podium'
                                }`}
                            >
                            {top2 && (
                                <div
                                    onContextMenu={(e) => handleContextMenu(e, top2.userId, top2.user.username, isMeInList(top2.userId))}
                                    className="relative flex flex-col items-center justify-end px-2 cursor-pointer"
                                >
                                    <div className="absolute bottom-0 w-full h-[35%] bg-slate-200 rounded-t-2xl z-0"></div>
                                    <div className="absolute -top-4 sm:-top-2 md:top-0 flex flex-col items-center z-30 transition-transform hover:scale-105">
                                        <div className="z-1 bg-slate-400 text-white text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full -mb-2 shadow-sm">อันดับที่ 2</div>
                                        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm pl-1 pr-3 sm:pr-4 py-1 rounded-full border border-gray-100 shadow-sm">
                                            <img
                                                src={top2.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(top2.user.username)}&background=eceff1`}
                                                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full object-cover"
                                                onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(top2.user.username)}&background=eceff1`; }}
                                            />
                                            <span className="text-[10px] sm:text-xs md:text-sm font-bold text-gray-800 truncate max-w-[60px] sm:max-w-[100px]">{top2.user.username}</span>
                                        </div>
                                    </div>
                                    <img src="/top2.png" className="h-35 sm:h-54 md:h-75 object-contain pointer-events-none relative z-10" alt="Rank 2" />
                                </div>
                            )}

                            {top1 && (
                                <div
                                    onContextMenu={(e) => handleContextMenu(e, top1.userId, top1.user.username, isMeInList(top1.userId))}
                                    className="relative flex flex-col items-center justify-end px-4 cursor-pointer"
                                >
                                    <div className="absolute bottom-0 w-full h-[45%] bg-yellow-300 rounded-t-2xl z-0"></div>
                                    <div className="absolute -top-4 sm:-top-2 md:-top-2 flex flex-col items-center z-30 transition-transform hover:scale-105">
                                        <div className="z-1 bg-yellow-500 text-white text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full -mb-2 shadow-sm">อันดับที่ 1</div>
                                        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm pl-1 pr-3 sm:pr-4 py-1 rounded-full border border-gray-100 shadow-sm">
                                            <img
                                                src={top1.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(top1.user.username)}&background=eceff1`}
                                                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full object-cover"
                                                onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(top1.user.username)}&background=eceff1`; }}
                                            />
                                            <span className="text-[10px] sm:text-xs md:text-sm font-bold text-gray-800 truncate max-w-[60px] sm:max-w-[100px]">{top1.user.username}</span>
                                            <img src="/ranktest.png" className="h-6 sm:h-8 w-auto object-contain" alt="Rank 1 Badge" />
                                        </div>
                                    </div>
                                    <img src="/top1.png" className="h-50 sm:h-70 md:h-90 object-contain pointer-events-none relative z-10" alt="Rank 1" />
                                </div>
                            )}

                                    {top3 && (
                                        <div
                                            onContextMenu={(e) => handleContextMenu(e, top3.userId, top3.user.username, isMeInList(top3.userId))}
                                            className="relative flex flex-col items-center justify-end px-2 cursor-pointer"
                                        >
                                            <div className="absolute bottom-0 w-full h-[30%] bg-orange-400 rounded-t-2xl z-0"></div>
                                            <div className="absolute -top-4 sm:-top-2 md:-top-2 flex flex-col items-center z-30 transition-transform hover:scale-105">
                                                <div className="z-1 bg-orange-500 text-white text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full -mb-2 shadow-sm">อันดับที่ 3</div>
                                                <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm pl-1 pr-3 sm:pr-4 py-1 rounded-full border border-gray-100 shadow-sm">
                                                    <img
                                                        src={top3.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(top3.user.username)}&background=eceff1`}
                                                        className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full object-cover"
                                                        onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(top3.user.username)}&background=eceff1`; }}
                                                    />
                                                    <span className="text-[10px] sm:text-xs md:text-sm font-bold text-gray-800 truncate max-w-[60px] sm:max-w-[100px]">{top3.user.username}</span>
                                                </div>
                                            </div>
                                            <img src="/top3.png" className="h-30 sm:h-40 md:h-60 object-contain pointer-events-none relative z-10" alt="Rank 3" />
                                        </div>
                                    )}
                                </div>
                            )}
                    </div>

                    {/* Leaderboard Table Container */}
                    <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] flex flex-col flex-grow shadow-inner overflow-hidden relative z-20 border border-white">
                        <div className="overflow-y-auto flex-grow h-[500px] sm:h-[600px] [&::-webkit-scrollbar]:hidden p-2 sm:p-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {isTableLoading ? (
                                <div className="flex flex-col gap-2 animate-pulse mt-2">
                                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                        <div key={i} className="h-[72px] sm:h-[88px] bg-gray-200/50 rounded-2xl w-full"></div>
                                    ))}
                                </div>
                            ) : filteredLeaderboard.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <img src="/ranktest.png" className="h-32 mb-4 opacity-30 grayscale" />
                                    <span className="text-gray-400 font-bold text-2xl">ยังไม่มีข้อมูลในหมวดหมู่นี้</span>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {filteredLeaderboard.map((user, index) => {
                                        const displayRank = index + 1;
                                        const isMe = isMeInList(user.userId);
                                        const displayName = user.user.username || (isMe ? (userData?.name || "You") : "User");
                                        const { rank: userRank, stars: userStars } = calculateRankInfo(user.displayVal2);

                                        let rankBadge = (
                                            <span className={`text-xl sm:text-2xl font-black w-10 text-center logo-font ${isMe ? 'text-white' : 'text-gray-500'}`}>
                                                {displayRank}
                                            </span>
                                        );

                                        let cardBgClass = 'bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md';
                                        let textColor = 'text-gray-800';

                                        if (isMe) {
                                            cardBgClass = 'bg-gradient-to-r from-[#5cb5db] to-[#3a90b5] border-none shadow-lg shadow-blue-200 scale-[1.01] z-10';
                                            textColor = 'text-white';
                                        }

                                        return (
                                            <div
                                                key={user.id}
                                                onContextMenu={(e) => handleContextMenu(e, user.userId, displayName, isMe)}
                                                className={`relative flex items-center justify-between p-3 sm:px-6 sm:py-4 rounded-2xl transition-all duration-300 select-none ${cardBgClass}`}
                                            >
                                                {/* Crown for Top 3 */}
                                                {displayRank <= 3 && (
                                                    <div className={`absolute top-1 right-2 sm:top-2 sm:right-3 rotate-12 drop-shadow-sm ${displayRank === 1 ? 'text-yellow-400 fill-yellow-400' :
                                                        displayRank === 2 ? 'text-slate-400 fill-slate-400' :
                                                            'text-orange-400 fill-orange-400'
                                                        }`}>
                                                        <Crown size={18} className={displayRank === 1 ? "fill-yellow-400" : displayRank === 2 ? "fill-slate-400" : "fill-orange-400"} />
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-3 sm:gap-6">
                                                    <div className="flex items-center justify-center w-12">
                                                        {rankBadge}
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className={`hidden sm:flex w-10 h-10 rounded-full items-center justify-center border-2 overflow-hidden ${isMe ? 'bg-white/20 border-white/30 text-white' : 'bg-gray-100 border-white text-gray-400 shadow-inner'}`}>
                                                            {user.user.image ? (
                                                                <img
                                                                    src={user.user.image}
                                                                    alt={displayName}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=eceff1&color=9ca3af`;
                                                                    }}
                                                                />
                                                            ) : (
                                                                <User size={18} />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className={`text-base sm:text-lg font-bold truncate max-w-[150px] sm:max-w-[250px] ${textColor}`}>
                                                                    {displayName}
                                                                </h4>
                                                                {isMe && (
                                                                    <span className="bg-white text-[#5cb5db] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">You</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 sm:gap-8">
                                                    {mode === 'rank' && !isMe && (
                                                        <div className="hidden md:flex flex-col items-center opacity-90">
                                                            <img src={`/Rank${userRank}.png`} onError={(e) => e.currentTarget.src = '/Rank1.png'} className="h-10 object-contain " />
                                                            <div className="flex gap-0.5 mt-1">
                                                                {[1, 2, 3, 4, 5].map((starNum) => (
                                                                    <Star key={starNum} size={10} className={starNum <= userStars ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="text-right flex flex-col items-end justify-center">
                                                        <div className={`flex items-center gap-1 text-xl sm:text-2xl font-black logo-font ${isMe ? 'text-white' : (mode === 'streak' ? 'text-orange-500' : 'text-[#5cb5db]')}`}>
                                                            {mode === 'streak' && <Flame size={20} fill="currentColor" />}
                                                            {mode === 'speed' ? user.displayVal1 : (mode === 'streak' ? user.displayVal1 : user.displayVal2.toLocaleString())}
                                                        </div>
                                                        <div className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-widest ${isMe ? 'text-white/80' : 'text-gray-400'}`}>
                                                            {mode === 'speed' ? `WPM • ${user.displayVal2}% ACC` : (mode === 'streak' ? 'วัน' : 'EXP')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Sticky "My Rank" Bottom Bar */}
                        {myRankData && !isTableLoading && (
                            <div className="border-t border-gray-100 bg-gray-50/90 backdrop-blur-md p-4 sm:px-8 sm:py-5 flex items-center justify-between">
                                <div className="flex items-center gap-4 sm:gap-6">
                                    <div className="flex flex-col items-center justify-center border-r border-gray-200 pr-4 sm:pr-6">
                                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-1">Your Rank</span>
                                        <span className="text-3xl sm:text-4xl font-black text-[#5cb5db] logo-font">
                                            {((mode === 'rank' && myRankData.displayVal2 === 0) || (mode === 'streak' && myRankData.displayVal1 === 0)) ? "--" : (myRankData.rankOrder || "--")}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-800 font-bold text-lg sm:text-xl flex items-center gap-2">
                                            {userData?.name || "You"}
                                            <span className="bg-[#5cb5db] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>
                                        </span>
                                        <span className={`text-xs sm:text-sm font-medium mt-1 ${myRankData.rankOrder ? 'text-[#5cb5db]' : 'text-gray-500'}`}>
                                            {((mode === 'rank' && myRankData.displayVal2 === 0) || (mode === 'streak' && myRankData.displayVal1 === 0)) ? 'เริ่มต้นฝึกพิมพ์เพื่อไต่อันดับเลย!' : (myRankData.rankOrder ? 'ยอดเยี่ยม! คุณติดอันดับแล้ว' : 'พยายามอีกนิดเพื่อติด Top 50!')}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end">
                                    <div className={`flex items-end gap-1 ${mode === 'streak' ? 'text-orange-500' : 'text-gray-800'}`}>
                                        {mode === 'streak' && <Flame size={24} fill="currentColor" className="mb-1" />}
                                        <span className="text-2xl sm:text-3xl font-black logo-font">
                                            {mode === 'speed' ? myRankData.displayVal1 : (mode === 'streak' ? myRankData.displayVal1 : myRankData.displayVal2.toLocaleString())}
                                        </span>
                                        <span className="text-xs sm:text-sm text-gray-500 font-bold mb-1">{mode === 'speed' ? 'WPM' : (mode === 'streak' ? 'วัน' : 'EXP')}</span>
                                    </div>
                                    {mode !== 'streak' && (
                                        <span className="text-[10px] sm:text-xs text-[#5cb5db] font-bold uppercase mt-1">
                                            {mode === 'speed' ? `${myRankData.displayVal2}% Accuracy` : 'Total Score'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Custom Right-Click Context Menu */}
            {contextMenu && (
                <div
                    style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
                    className="fixed z-50 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 px-1 min-w-[170px] animate-in fade-in zoom-in-95 duration-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-3 py-1.5 border-b border-gray-100 text-[11px] font-bold text-gray-400 truncate max-w-[160px]">
                        {contextMenu.userName}
                    </div>
                    <button
                        type="button"
                        onClick={handleOpenReportFromContext}
                        className="w-full px-3 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition flex items-center gap-2 cursor-pointer"
                    >
                        <Flag size={14} />
                        <span>รายงานผู้ใช้นี้</span>
                    </button>
                </div>
            )}

            {/* Report User Modal */}
            {reportingUser && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-gray-100 flex flex-col gap-5 text-gray-800">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 text-red-500 rounded-xl">
                                    <AlertTriangle size={30} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black logo-font text-gray-800">รายงานผู้ใช้</h3>
                                    <p className="text-xs text-gray-400">รายงาน: <span className="font-bold text-gray-700">{reportingUser.name}</span></p>
                                </div>
                            </div>
                            <button
                                onClick={() => setReportingUser(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitReport} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-700">สาเหตุที่รายงาน</label>
                                <select
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    className="px-4 py-2.5 rounded-2xl border border-gray-200 focus:border-[#5cb5db] outline-none text-sm bg-gray-50"
                                >
                                    <option value="inappropriate_avatar">รูปโปรไฟล์ไม่เหมาะสม / อนาจาร</option>
                                    <option value="inappropriate_name">ชื่อผู้ใช้ไม่เหมาะสม / คำหยาบคาย</option>
                                    <option value="cheating">สงสัยว่าใช้บอท / โกงความเร็ว</option>
                                    <option value="other">สาเหตุอื่นๆ</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-700">รายละเอียดเพิ่มเติม (ถ้ามี)</label>
                                <textarea
                                    value={reportDetails}
                                    onChange={(e) => setReportDetails(e.target.value)}
                                    rows={3}
                                    placeholder="ระบุข้อมูลเพิ่มเติมเพื่อให้แอดมินตรวจสอบได้รวดเร็วขึ้น..."
                                    className="px-4 py-2.5 rounded-2xl border border-gray-200 focus:border-[#5cb5db] outline-none text-sm resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setReportingUser(null)}
                                    className="px-5 py-2.5 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingReport}
                                    className="px-6 py-2.5 rounded-2xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition shadow-sm cursor-pointer flex items-center gap-2"
                                >
                                    {isSubmittingReport ? <Loader2 size={16} className="animate-spin" /> : <Flag size={14} />}
                                    <span>ส่งรายงาน</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}