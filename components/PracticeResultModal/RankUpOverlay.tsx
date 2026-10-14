"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Star, Sparkles } from 'lucide-react';
import { RANK_TIERS, getRankMultiplierConfig } from '@/lib/rankUtils';

interface RankUpOverlayProps {
    prevRank?: number;
    currentRank?: number;
    currentRankName?: string;
    mode?: 'rank' | 'star';
    currentStars?: number;
    onClose: () => void;
}

const RANK_THEMES: Record<number, { bg: string; glow: string; textGrad: string }> = {
    1: { bg: 'from-amber-900/50 via-amber-950/30 to-black', glow: 'bg-amber-500/20', textGrad: 'from-amber-200 via-amber-400 to-amber-600' },
    2: { bg: 'from-yellow-700/50 via-amber-950/30 to-black', glow: 'bg-yellow-400/25', textGrad: 'from-yellow-200 via-yellow-400 to-amber-500' },
    3: { bg: 'from-cyan-900/50 via-blue-950/30 to-black', glow: 'bg-cyan-400/25', textGrad: 'from-cyan-200 via-cyan-400 to-blue-500' },
    4: { bg: 'from-slate-700/50 via-zinc-950/30 to-black', glow: 'bg-slate-300/20', textGrad: 'from-slate-100 via-slate-300 to-zinc-400' },
    5: { bg: 'from-emerald-900/50 via-teal-950/30 to-black', glow: 'bg-emerald-400/25', textGrad: 'from-emerald-200 via-emerald-400 to-teal-500' },
    6: { bg: 'from-rose-900/60 via-red-950/35 to-black', glow: 'bg-rose-500/30', textGrad: 'from-rose-200 via-rose-400 to-red-600' },
    7: { bg: 'from-purple-900/60 via-indigo-950/40 to-black', glow: 'bg-purple-500/30', textGrad: 'from-purple-200 via-indigo-300 to-pink-400' }
};

export default function RankUpOverlay({
    prevRank = 1,
    currentRank = 2,
    currentRankName,
    mode = 'rank',
    currentStars = 0,
    onClose
}: RankUpOverlayProps) {
    const [activeMode] = useState<'rank' | 'star'>(mode);
    const [curRank] = useState<number>(currentRank);
    const [oldRank] = useState<number>(prevRank);
    const [curStars] = useState<number>(mode === 'rank' ? 0 : Math.max(1, currentStars));
    const [animKey] = useState<number>(0);

    const [showNewRank, setShowNewRank] = useState(false);
    const [isNewRankLoaded, setIsNewRankLoaded] = useState(false);

    const tierInfo = RANK_TIERS.find(t => t.rank === curRank) || RANK_TIERS[curRank - 1] || RANK_TIERS[0];
    const theme = RANK_THEMES[curRank] || RANK_THEMES[1];
    
    // คำนวณ Multiplier: โหมด Rank Up (ขึ้นแรงค์ใหม่) ถือเป็น 0 ดาว ส่วนโหมด Star จะใช้ curStars (1 - 5)
    const effectiveStars = activeMode === 'rank' ? 0 : curStars;
    const multConfig = getRankMultiplierConfig(curRank, effectiveStars);

    // เล่นเสียงเมื่อแอนิเมชันเปิดขึ้น
    const playSound = (sfx: string = '/sounds/sfx/star.mp3') => {
        try {
            const audio = new Audio(sfx);
            audio.volume = 0.65;
            audio.play().catch(() => {});
        } catch (e) {}
    };

    useEffect(() => {
        setIsNewRankLoaded(false);
        setShowNewRank(false);

        const fallbackTimer = setTimeout(() => {
            setIsNewRankLoaded(true);
        }, 300);

        return () => clearTimeout(fallbackTimer);
    }, [curRank, animKey, activeMode]);

    useEffect(() => {
        if (isNewRankLoaded) {
            const timer = setTimeout(() => {
                setShowNewRank(true);
                playSound();
            }, activeMode === 'rank' ? 550 : 200);
            return () => clearTimeout(timer);
        }
    }, [isNewRankLoaded, activeMode]);

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center overflow-y-auto overflow-x-hidden cursor-pointer select-none p-4"
            onClick={onClose}
        >
            {/* Ambient Dynamic Background Light Burst */}
            <div
                className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${theme.bg} animate-pulse pointer-events-none transition-colors duration-700`}
            ></div>

            {/* Rotating Starburst Rays */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_black_90%)] pointer-events-none"></div>

            {/* Hidden Preloader for Target Rank Image */}
            <div className="absolute opacity-0 pointer-events-none">
                <Image
                    src={`/Rank${curRank}.png`}
                    width={600}
                    height={400}
                    alt=""
                    priority
                    onLoad={() => setIsNewRankLoaded(true)}
                />
            </div>

            <div className="relative z-10 flex flex-col items-center max-w-2xl sm:max-w-4xl w-full my-auto max-h-[96vh] justify-center py-4 px-4">

                {/* Main Heading (Pure Glowing Typography - Grand & Punchy) */}
                {activeMode === 'rank' ? (
                    <div className="flex flex-col items-center animate-slideUpFade">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles size={20} className="text-yellow-400 fill-yellow-400 animate-pulse" />
                            <span className="text-xs sm:text-sm font-black tracking-[0.3em] uppercase text-yellow-300 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]">
                                TIER PROMOTION
                            </span>
                            <Sparkles size={20} className="text-yellow-400 fill-yellow-400 animate-pulse" />
                        </div>
                        <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-400 to-yellow-600 tracking-wider drop-shadow-[0_4px_30px_rgba(250,204,21,0.6)] logo-font">
                            RANK UP!
                        </h2>
                    </div>
                ) : (
                    <div className="flex flex-col items-center animate-slideUpFade">
                        <div className="flex items-center gap-2 mb-1">
                            <Star size={20} className="text-yellow-400 fill-yellow-400 animate-pulse" />
                            <span className="text-xs sm:text-sm font-black tracking-[0.3em] uppercase text-yellow-300 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]">
                                STAR ADVANCEMENT
                            </span>
                            <Star size={20} className="text-yellow-400 fill-yellow-400 animate-pulse" />
                        </div>
                        <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-300 to-yellow-500 tracking-wider drop-shadow-[0_4px_30px_rgba(250,204,21,0.6)] logo-font">
                            STAR UP!
                        </h2>
                    </div>
                )}

                {/* Central Animation Stage (Bigger Keyboard & Impressive Presence) */}
                <div key={animKey} className="relative w-[320px] h-[190px] sm:w-[520px] sm:h-[260px] md:h-[280px] flex items-center justify-center my-2 sm:my-3">
                    {activeMode === 'rank' ? (
                        <>
                            {/* Old Rank (Rotating & Fading Out) */}
                            {!showNewRank && (
                                <div className="absolute inset-0 animate-rank-out flex items-center justify-center">
                                    <Image
                                        src={`/Rank${oldRank}.png`}
                                        width={440}
                                        height={280}
                                        alt="Old Rank"
                                        priority
                                        className="object-contain max-h-[160px] sm:max-h-[220px] md:max-h-[250px] w-auto filter grayscale opacity-40 drop-shadow-md"
                                    />
                                </div>
                            )}

                            {/* New Rank (Slamming & Popping In) */}
                            {showNewRank && (
                                <div className="absolute inset-0 animate-rank-in flex items-center justify-center">
                                    <div className={`absolute inset-0 ${theme.glow} blur-[65px] animate-pulse rounded-full pointer-events-none`}></div>
                                    <Image
                                        src={`/Rank${curRank}.png`}
                                        width={540}
                                        height={340}
                                        alt="New Rank"
                                        priority
                                        className="object-contain max-h-[180px] sm:max-h-[240px] md:max-h-[270px] w-auto drop-shadow-[0_0_45px_rgba(255,255,255,0.7)]"
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        /* Star Up Mode: Shows current keyboard with star impact */
                        <div className="flex flex-col items-center justify-center animate-slideUpFade">
                            <div className="relative flex items-center justify-center mb-2">
                                <div className={`absolute inset-0 ${theme.glow} blur-[60px] rounded-full pointer-events-none`}></div>
                                <Image
                                    src={`/Rank${curRank}.png`}
                                    width={480}
                                    height={280}
                                    alt="Rank Keyboard"
                                    priority
                                    className="object-contain max-h-[145px] sm:max-h-[200px] md:max-h-[225px] w-auto drop-shadow-[0_0_35px_rgba(255,255,255,0.6)]"
                                />
                            </div>

                            {/* 5 Stars Stamping Row */}
                            <div className="flex items-center gap-2.5 sm:gap-4 mt-2">
                                {[1, 2, 3, 4, 5].map((s) => {
                                    const isNewlyStamped = s === curStars;
                                    const isFilled = s <= curStars;
                                    return (
                                        <div key={s} className="relative flex items-center justify-center">
                                            <Star
                                                size={32}
                                                className={`transition-all duration-300 ${
                                                    isFilled
                                                        ? 'fill-yellow-400 text-yellow-300 drop-shadow-[0_0_14px_rgba(250,204,21,0.85)]'
                                                        : 'fill-white/10 text-white/20'
                                                }`}
                                            />
                                            {isNewlyStamped && showNewRank && (
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <Star
                                                        size={32}
                                                        className="fill-yellow-300 text-yellow-100 animate-star-stamp drop-shadow-[0_0_30px_rgba(255,255,255,1)]"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Pure Typography Name & Details: Thai on Top, English Headline on Bottom */}
                {showNewRank && (
                    <div className="flex flex-col items-center animate-slideUpFade text-center select-none mt-2">
                        {/* 1. Thai Name (Top Label) */}
                        <span className="text-sm sm:text-base font-bold tracking-widest text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]">
                            {tierInfo.thaiName}
                        </span>

                        {/* 2. English Name (Main Big Headline) - NO DOT, ON SAME LINE */}
                        <h3 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-wide mt-1 drop-shadow-[0_4px_25px_rgba(255,255,255,0.7)] logo-font uppercase whitespace-nowrap flex items-center justify-center gap-2 sm:gap-3.5">
                            <span>{tierInfo.name}</span>
                            {activeMode === 'star' && (
                                <span className="text-yellow-300 drop-shadow-[0_0_14px_rgba(250,204,21,0.7)]">
                                    ★ {curStars}
                                </span>
                            )}
                        </h3>

                        {/* Multiplier Details */}
                        <div className="flex items-center gap-2 sm:gap-3 mt-2 text-xs sm:text-sm md:text-base text-amber-200/90 font-semibold drop-shadow-sm flex-wrap justify-center">
                            <span>Base x{(multConfig.totalBaseMultiplier).toFixed(2)}</span>
                            <span className="text-white/40">•</span>
                            <span>Max Cap x{multConfig.maxMultiplierCap.toFixed(1)}</span>
                            {activeMode === 'star' && curStars > 0 && (
                                <>
                                    <span className="text-white/40">•</span>
                                    <span className="text-emerald-400 font-bold">+โบนัสดาวสะสม x{(multConfig.starBonus).toFixed(2)}</span>
                                </>
                            )}
                        </div>
                    </div>
                )}

                <p className="mt-4 sm:mt-6 text-gray-400 text-xs sm:text-sm animate-pulse tracking-wide select-none">
                    คลิกตรงที่ว่างเพื่อปิด
                </p>
            </div>
        </div>
    );
}
