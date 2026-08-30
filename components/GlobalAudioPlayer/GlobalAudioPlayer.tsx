"use client";

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { soundManager } from '@/lib/soundEffects';

export default function GlobalAudioPlayer() {
    const { status } = useSession();
    const hasTriggeredRef = useRef(false);

    useEffect(() => {
        const tryPlayBgm = () => {
            if (status === "authenticated") {
                const isAutoPlayEnabled = localStorage.getItem('pimwai_bgm_autoplay') !== 'false';
                if (isAutoPlayEnabled && !soundManager.getIsBgmPlaying()) {
                    soundManager.startBgm();
                }
            }
        };

        tryPlayBgm();

        const handleUserGesture = () => {
            if (!hasTriggeredRef.current && status === "authenticated") {
                soundManager.startBgm();
                hasTriggeredRef.current = true;
            }
        };

        window.addEventListener('click', handleUserGesture);
        window.addEventListener('keydown', handleUserGesture);
        window.addEventListener('touchstart', handleUserGesture);
        window.addEventListener('pointerdown', handleUserGesture);

        return () => {
            window.removeEventListener('click', handleUserGesture);
            window.removeEventListener('keydown', handleUserGesture);
            window.removeEventListener('touchstart', handleUserGesture);
            window.removeEventListener('pointerdown', handleUserGesture);
        };
    }, [status]);

    return null;
}
