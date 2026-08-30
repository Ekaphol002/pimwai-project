"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { soundManager } from '@/lib/soundEffects';

export default function GlobalAudioPlayer() {
    const { status } = useSession();

    // เล่นเพลงทันทีเมื่อผู้ใช้ล็อกอินสำเร็จในทุกๆ หน้า
    useEffect(() => {
        if (status === "authenticated") {
            const isAutoPlayEnabled = localStorage.getItem('pimwai_bgm_autoplay') !== 'false';
            if (isAutoPlayEnabled && !soundManager.getIsBgmPlaying()) {
                soundManager.startBgm();
            }
        }
    }, [status]);

    // ปลดล็อก Browser Autoplay Policy จากการคลิกหรือกดแป้นพิมพ์ใดๆ ครั้งแรกในเว็บ
    useEffect(() => {
        const handleInteraction = () => {
            if (status === "authenticated") {
                const isAutoPlayEnabled = localStorage.getItem('pimwai_bgm_autoplay') !== 'false';
                if (isAutoPlayEnabled && !soundManager.getIsBgmPlaying()) {
                    soundManager.startBgm();
                }
            }
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('keydown', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);

        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };
    }, [status]);

    // ไม่ต้อง Render ปุ่ม UI ลอยให้เกะกะสายตา แต่ทำงานเบื้องหลังตลอดเวลา
    return null;
}
