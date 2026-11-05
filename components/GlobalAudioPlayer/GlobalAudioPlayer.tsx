"use client";

import { useEffect, useRef } from 'react';
import { soundManager } from '@/lib/soundEffects';

export default function GlobalAudioPlayer() {
    const hasAttachedRef = useRef(false);

    useEffect(() => {
        if (hasAttachedRef.current) return;
        hasAttachedRef.current = true;

        // พยายามเล่นต่อจากจุดเดิมทันทีที่โหลดหน้าเว็บ (ถ้าเคยเปิดเพลงไว้ก่อนรีเฟรช)
        soundManager.restoreBgmOnLoad();

        // กรณีเบราว์เซอร์บล็อก Autoplay ตอนเพิ่งเปิดแท็บใหม่ ให้เริ่มเล่นต่อเมื่อผู้ใช้คลิกหรือกดปุ่มครั้งแรกเท่านั้น (โดยไม่รีเซ็ตเพลงที่กำลังเล่นอยู่แล้ว)
        const handleUserGesture = () => {
            const unlocked = soundManager.unlockBgmOnGesture();
            if (unlocked) {
                window.removeEventListener('click', handleUserGesture);
                window.removeEventListener('keydown', handleUserGesture);
                window.removeEventListener('touchstart', handleUserGesture);
                window.removeEventListener('pointerdown', handleUserGesture);
            }
        };

        window.addEventListener('click', handleUserGesture, { passive: true });
        window.addEventListener('keydown', handleUserGesture, { passive: true });
        window.addEventListener('touchstart', handleUserGesture, { passive: true });
        window.addEventListener('pointerdown', handleUserGesture, { passive: true });

        return () => {
            window.removeEventListener('click', handleUserGesture);
            window.removeEventListener('keydown', handleUserGesture);
            window.removeEventListener('touchstart', handleUserGesture);
            window.removeEventListener('pointerdown', handleUserGesture);
        };
    }, []);

    return null;
}
