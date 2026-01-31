"use client";

import React, { useState, useEffect } from 'react';
import { reverseThaiKeyMap, fingerMap, leftHandKeys } from '@/lib/keyMaps';
import Image from 'next/image';

interface NewKeyIntroProps {
    targetChar: string;
    onComplete: () => void;
    onCorrectPress: () => void;
}

// ฟังก์ชันหา path รูปมือซ้ายและขวา
function getFingerImages(keyCode: string): { left: string; right: string } {
    const finger = fingerMap[keyCode];
    const isLeftHand = leftHandKeys.has(keyCode);

    if (!finger) {
        // ไม่รู้จักปุ่ม ใช้มือเปล่าทั้งคู่
        return { left: '/Finger/9.png', right: '/Finger/10.png' };
    }

    if (isLeftHand) {
        // มือซ้ายใช้งาน (5-8), มือขวาเปล่า (10)
        return { left: `/Finger/${finger}.png`, right: '/Finger/10.png' };
    } else {
        // มือขวาใช้งาน (1-4), มือซ้ายเปล่า (9)
        return { left: '/Finger/9.png', right: `/Finger/${finger}.png` };
    }
}

export default function NewKeyIntro({ targetChar, onComplete, onCorrectPress }: NewKeyIntroProps) {
    const [phase, setPhase] = useState<1 | 2>(1);
    const [isAnimating, setIsAnimating] = useState(false);
    const [inputStatus, setInputStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');

    // Display Text Logic
    const displayChar = targetChar === ' ' ? 'SPACE' : targetChar;

    // หา KeyCode และรูปมือ
    let expectedCode = reverseThaiKeyMap[targetChar];
    if (targetChar === ' ') expectedCode = 'Space';
    const fingerImages = getFingerImages(expectedCode || '');

    // ปิด scroll เมื่อแสดง NewKeyIntro
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isAnimating) return;

            if (phase === 1) {
                // Determine expected key code
                let expectedCode = reverseThaiKeyMap[targetChar];
                if (targetChar === ' ') expectedCode = 'Space';

                // ต้องเช็คว่าพิมพ์ออกมาเป็นตัวไทยจริงๆ (ไม่ใช่แค่ตรงตำแหน่งปุ่มกายภาพ)
                const isThaiChar = /[\u0E00-\u0E7F]/.test(event.key) || event.key === ' ';

                // Check if correct key pressed:
                // 1. ต้องเป็นตัวอักษรไทย (หรือ Space)
                // 2. ตรงตำแหน่งปุ่มกายภาพ หรือ ตรงตัวอักษร
                const isCorrect = isThaiChar && ((expectedCode && event.code === expectedCode) || event.key === targetChar);

                if (isCorrect) {
                    setInputStatus('correct');
                    setIsAnimating(true);
                    onCorrectPress();

                    // Transition to phase 2
                    setTimeout(() => {
                        setPhase(2);
                        setIsAnimating(false);
                    }, 600);
                } else {
                    // Wrong key pressed
                    if (event.code !== 'ShiftLeft' && event.code !== 'ShiftRight' && !event.ctrlKey && !event.metaKey && !event.altKey) {
                        setInputStatus('wrong');
                    }
                }
            } else if (phase === 2) {
                if (event.key === 'Enter') {
                    onComplete();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [phase, targetChar, onComplete, onCorrectPress, isAnimating]);

    // Dynamic Classes based on Status
    const getKeyStyles = () => {
        if (inputStatus === 'correct') return 'bg-green-500 text-white scale-110';
        if (inputStatus === 'wrong') return 'bg-[#d52a32] text-white';
        return 'border-gray-300 text-slate-600 bg-white';
    };

    return (
        <div className="relative w-full">
            {/* Left Hand - Fixed to left edge */}
            <div className="fixed left-0 top-1/2 -translate-y-1/2 z-10 opacity-70">
                <Image
                    src={fingerImages.left}
                    alt="Left hand"
                    width={375}
                    height={375}
                    className="object-contain"
                />
            </div>

            {/* Main Content Box - Center */}
            <div className="flex justify-center w-full max-w-2xl mx-auto">
                <div className={`
                    w-full bg-white rounded-3xl shadow-xl
                    flex flex-col items-center justify-center overflow-hidden relative
                    ease-[cubic-bezier(0.34,1.56,0.64,1)]
                    ${phase === 1 ? 'h-50' : 'h-80'} 
                `}>
                    {/* Decorative Background Blob */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sky-400 via-[#5cb5db] to-sky-400"></div>

                    {/* --- Phase 1: Main Task (Always Visible) --- */}
                    <div className={`text-center transition-all duration-700 ${phase === 2 ? 'mt-10' : ''}`}>
                        <p className="text-slate-500 text-xl mb-4 font-medium tracking-wide">
                            เริ่มปุ่มใหม่! ลองใช้นิ้วของคุณ...
                        </p>
                        <div className="flex items-end justify-center gap-4 text-5xl font-bold text-slate-600">
                            <span className="mb-2">พิมพ์ปุ่ม</span>
                            <span
                                className={`
                                    ${/[ัิีึืฺุู็่้๊๋์ํ]/.test(targetChar) ? 'w-15 pl-5' : 'px-3'} py-5 border-1 rounded-sm transition-all duration-300 flex items-center justify-center
                                    ${getKeyStyles()}
                                `}
                            >
                                {displayChar}
                            </span>
                            <span className="mb-2">ดูสิ</span>
                        </div>
                    </div>

                    {/* --- Phase 2: Expanded Content (Slides In) --- */}
                    <div
                        className={`
                            w-full px-12 flex flex-col items-center justify-center
                            transition-all duration-200
                            ${phase === 2 ? 'opacity-100 translate-y-0 mt-8 mb-6' : 'opacity-0 translate-y-[-20] h-0 overflow-hidden'}
                        `}
                    >
                        {/* Separator Line */}
                        <div className="w-full h-px bg-slate-200 mb-6"></div>

                        <div className="w-full text-center">
                            <p className="text-base text-slate-500 font-medium leading-relaxed">
                                จำตำแหน่งของปุ่ม <span className={`inline-flex items-center justify-center border-1 rounded-sm py-1 ${/[ัิีึืฺุู็่้๊๋์ํ]/.test(targetChar) ? 'w-7 pl-2' : 'px-2'}`}>{displayChar}</span> นี้ไว้ให้ดี เพราะเรากำลังจะเริ่มบทฝึกสอนจริงแล้ว!
                            </p>
                        </div>

                        <div className="w-full pt-6 flex flex-col items-center">
                            <div className="flex items-center justify-center gap-3 text-lg text-slate-400 font-medium">
                                <span>กดปุ่ม</span>
                                <div className="text-sm px-3 border-1 rounded-sm items-center justify-center">
                                    ENTER
                                </div>
                                <span>เพื่อลุยเลย!</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Hand - Fixed to right edge */}
            <div className="fixed right-0 top-1/2 -translate-y-1/2 z-10 opacity-70">
                <Image
                    src={fingerImages.right}
                    alt="Right hand"
                    width={375}
                    height={375}
                    className="object-contain"
                />
            </div>
        </div>
    );
}

