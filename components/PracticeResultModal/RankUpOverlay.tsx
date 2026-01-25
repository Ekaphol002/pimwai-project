"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface RankUpOverlayProps {
    prevRank: number;
    currentRank: number;
    currentRankName: string;
    onClose: () => void;
}

export default function RankUpOverlay({ prevRank, currentRank, currentRankName, onClose }: RankUpOverlayProps) {
    const [showNewRank, setShowNewRank] = useState(false);

    useEffect(() => {
        // หลังจาก Rank เก่าหายไป (rank-out 0.6s) ให้ Rank ใหม่โผล่มา
        const timer = setTimeout(() => setShowNewRank(true), 600);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center overflow-hidden" onClick={onClose}>

            {/* Background Light Burst */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-black to-black animate-pulse"></div>

            <div className="relative z-10 flex flex-col items-center">

                <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 mb-2">
                    RANK UP!
                </h2>

                <div className="relative w-160 h-100 flex items-center justify-center">

                    {/* OLD RANK (Fading Out) */}
                    {!showNewRank && (
                        <div className="absolute inset-0 animate-rank-out flex items-center justify-center">
                            <Image
                                src={`/Rank${prevRank}.png`}
                                width={300}
                                height={300}
                                alt="Old Rank"
                                className="object-contain filter grayscale opacity-50"
                            />
                        </div>
                    )}

                    {/* NEW RANK (Popping In) */}
                    {showNewRank && (
                        <div className="absolute inset-0 animate-rank-in flex items-center justify-center">
                            <div className="absolute inset-0 bg-yellow-400/20 blur-[50px] animate-pulse rounded-full"></div>
                            <Image
                                src={`/Rank${currentRank}.png`}
                                width={700}
                                height={700}
                                alt="New Rank"
                                className="object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]"
                            />
                        </div>
                    )}
                </div>

                {showNewRank && (
                    <div className="text-white text-2xl font-bold tracking-widest animate-slideUpFade">
                        {currentRankName}
                    </div>
                )}

                <p className="mt-12 text-gray-400 text-sm animate-pulse">Click anywhere to close</p>
            </div>
        </div>
    );
}
