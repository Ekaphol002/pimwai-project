"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { soundManager } from '@/lib/soundEffects';

export default function GlobalAudioPlayer() {
    const { status } = useSession();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentVolume, setCurrentVolume] = useState(40);

    useEffect(() => {
        // Real-time synchronization กับ soundManager
        const unsubscribe = soundManager.subscribe((state) => {
            setIsPlaying(state.isBgmPlaying);
            setCurrentVolume(Math.round(state.bgmVolume * 100));
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // เล่นเพลงทันทีเมื่อตรวจพบว่าผู้ใช้ล็อกอินสำเร็จ
    useEffect(() => {
        if (status === "authenticated") {
            const isAutoPlayEnabled = localStorage.getItem('pimwai_bgm_autoplay') !== 'false';
            if (isAutoPlayEnabled && !soundManager.getIsBgmPlaying()) {
                soundManager.startBgm();
            }
        }
    }, [status]);

    // ปลดล็อก Browser Autoplay Policy จากคลิกหรือพิมพ์แรก
    useEffect(() => {
        const handleInteraction = () => {
            const isAutoPlayEnabled = localStorage.getItem('pimwai_bgm_autoplay') !== 'false';
            if (isAutoPlayEnabled && !soundManager.getIsBgmPlaying()) {
                soundManager.startBgm();
            }
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('keydown', handleInteraction);

        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };
    }, []);

    const togglePlay = () => {
        soundManager.toggleBgm();
    };

    const handleVolumeChange = (val: number) => {
        setCurrentVolume(val);
        soundManager.setBgmVolume(val / 100);
    };

    return (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 group">
            {/* Popover slider on hover */}
            <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-gray-200/80 flex items-center gap-3 transition-all duration-300 transform scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 group-hover:pointer-events-auto">
                <Music size={16} className={`text-[#5cb5db] ${isPlaying ? 'animate-bounce' : ''}`} />
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentVolume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-20 accent-[#5cb5db] cursor-pointer h-1.5 bg-gray-200 rounded-lg"
                    title="ระดับเสียงเพลง"
                />
                <span className="text-[11px] font-bold text-gray-600 logo-font w-7 text-right">{currentVolume}%</span>
            </div>

            {/* Main Floating Button */}
            <button
                type="button"
                onClick={togglePlay}
                title={isPlaying ? "หยุดเพลงพื้นหลัง (BGM)" : "เล่นเพลงพื้นหลัง (BGM)"}
                className={`p-3.5 rounded-full shadow-xl border-2 border-white transition-all transform active:scale-95 cursor-pointer flex items-center justify-center ${
                    isPlaying
                        ? 'bg-[#5cb5db] text-white ring-4 ring-[#5cb5db]/20 animate-pulse'
                        : 'bg-white hover:bg-gray-50 text-gray-500 shadow-md'
                }`}
            >
                {isPlaying ? <Music size={18} /> : <VolumeX size={18} />}
            </button>
        </div>
    );
}
