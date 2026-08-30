"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { soundManager } from '@/lib/soundEffects';

export default function GlobalAudioPlayer() {
    const { status } = useSession();
    const pathname = usePathname();

    // เช็คว่าเป็นหน้าที่ต้องเปิดเพลงพื้นหลัง (บทเรียน หรือ ทดสอบ) หรือไม่
    const isTargetPage = pathname?.startsWith('/lessons') || pathname?.startsWith('/tests');

    useEffect(() => {
        // เมื่ออยู่ในหน้า บทเรียน (/lessons) หรือ หน้าทดสอบ (/tests)
        if (status === "authenticated" && isTargetPage) {
            const isAutoPlayEnabled = localStorage.getItem('pimwai_bgm_autoplay') !== 'false';
            if (isAutoPlayEnabled && !soundManager.getIsBgmPlaying()) {
                soundManager.startBgm();
            }
        }
    }, [status, isTargetPage, pathname]);

    // ปลดล็อก Browser Autoplay Policy จากการคลิกหรือกดคีย์บอร์ดครั้งแรก
    useEffect(() => {
        const handleInteraction = () => {
            const currentPath = window.location.pathname;
            const inTargetPage = currentPath.startsWith('/lessons') || currentPath.startsWith('/tests');
            const isAutoPlayEnabled = localStorage.getItem('pimwai_bgm_autoplay') !== 'false';

            if (inTargetPage && isAutoPlayEnabled && !soundManager.getIsBgmPlaying()) {
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

    return null; // ไม่มี UI ปุ่มลอยเกะกะสายตา เล่นเพลงเบื้องหลังอย่างเดียว
}
