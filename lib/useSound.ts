// hooks/useSound.ts
import { useCallback, useEffect, useState } from 'react';

export default function useSound(soundPath: string, volume: number = 0.5) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // โหลดไฟล์เสียงเตรียมไว้ (Preload)
    const audioObj = new Audio(soundPath);
    audioObj.volume = volume;
    setAudio(audioObj);
  }, [soundPath, volume]);

  const play = useCallback(() => {
    if (audio) {
      // เทคนิคสำคัญ: Clone Node เพื่อให้เล่นเสียงซ้อนกันได้ (พิมพ์รัวๆ แล้วเสียงไม่หาย)
      const soundClone = audio.cloneNode() as HTMLAudioElement;
      soundClone.volume = volume;
      soundClone.playbackRate = 0.95 + Math.random() * 0.1; 
      soundClone.play();
      
      soundClone.play().catch((e) => {
        // กัน Error กรณี Browser บล็อกเสียงถ้ายังไม่ได้ Interact
        console.error("Audio play failed", e);
      });
    }
  }, [audio, volume]);

  return play;
}