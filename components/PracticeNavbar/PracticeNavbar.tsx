// components/PracticeNavbar/PracticeNavbar.tsx
"use client";

import Link from 'next/link';
import { ArrowLeft, RotateCcw, Settings, Volume2, VolumeX, Music } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { soundManager } from '@/lib/soundEffects';
import QuickAudioModal from '@/components/QuickAudioModal/QuickAudioModal';

type Props = {
  title?: string;
  timer?: string;
  currentScreen?: number;
  totalScreens?: number;
  backHref?: string;
};

export default function PracticeNavbar({
  title,
  timer,
  currentScreen = 1,
  totalScreens = 1,
  backHref
}: Props) {
  const pathname = usePathname();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedKbSound, setSelectedKbSound] = useState('kb1');
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);

  useEffect(() => {
    const unsubscribe = soundManager.subscribe((state) => {
      setIsBgmPlaying(state.isBgmPlaying);
      setSelectedKbSound(state.selectedKbSound);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const displayTitle = title || "แบบฝึกหัดพิมพ์ดีด";

  const handleRestart = () => {
    window.location.reload();
  };

  const backLink = backHref || (pathname?.includes('test') ? "/tests" : "/lessons");

  return (
    <>
      <nav className="w-full h-14 bg-[#3498db] text-white flex items-center justify-between px-4 shadow-sm z-40 relative">

        {/* ฝั่งซ้าย: ปุ่มย้อนกลับ */}
        <div className="flex-1 flex items-center gap-3">
          <Link href={backLink} className="p-1 rounded-md hover:bg-black/10 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <span className="font-bold text-xl logo-font">PIMWAI</span>
        </div>

        {/* ตรงกลาง: ชื่อบทเรียน และ ตัวนับด่าน */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <span className="text-sm font-semibold line-clamp-1 px-2">{displayTitle}</span>

          {!timer && (
            <span className="text-xs text-white/80">
              Screen {currentScreen} of {totalScreens}
            </span>
          )}
        </div>

        {/* ฝั่งขวา: จับเวลา & ปุ่มเครื่องมือ & ปุ่มตั้งค่าเสียง/เพลง */}
        <div className="flex-1 flex items-center justify-end gap-2 sm:gap-3">
          {timer && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg mr-2 text-[20px] font-bold bg-white/10">
              <span>{timer}</span>
            </div>
          )}

          <button onClick={handleRestart} className="p-2 rounded-md hover:bg-black/10 transition-colors cursor-pointer" title="เริ่มใหม่ (Restart)">
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* ปุ่มเปิด Quick Audio & YouTube Music Settings Modal */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-md hover:bg-black/10 transition-colors cursor-pointer"
            title="ตั้งค่าเสียงและเพลง (Audio Settings)"
          >
            <Music className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Unified Quick Audio & YouTube Music Settings Modal */}
      <QuickAudioModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </>
  );
}
