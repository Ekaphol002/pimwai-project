// components/PracticeNavbar/PracticeNavbar.tsx
"use client";

import Link from 'next/link';
import { ArrowLeft, RotateCcw, Volume2, VolumeX, Settings, Music, Check, X } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { soundManager, KEYBOARD_SOUNDS, BGM_TRACKS } from '@/lib/soundEffects';

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

  // Audio States (Real-time synced with soundManager)
  const [selectedKbSound, setSelectedKbSound] = useState('kb1');
  const [sfxVolume, setSfxVolume] = useState(70);
  const [bgmVolume, setBgmVolume] = useState(40);
  const [selectedBgmTracks, setSelectedBgmTracks] = useState<string[]>(['bgm1', 'bgm2', 'bgm3']);
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subscribe to soundManager updates so state is always 100% in sync
    const unsubscribe = soundManager.subscribe((state) => {
      setIsBgmPlaying(state.isBgmPlaying);
      setBgmVolume(Math.round(state.bgmVolume * 100));
      setSfxVolume(Math.round(state.sfxVolume * 100));
      setSelectedKbSound(state.selectedKbSound);
      setSelectedBgmTracks(state.selectedTracks);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // ปิด modal เมื่อคลิกด้านนอก
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowSettingsModal(false);
      }
    };
    if (showSettingsModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettingsModal]);

  const displayTitle = title || "แบบฝึกหัดพิมพ์ดีด";

  const handleRestart = () => {
    window.location.reload();
  };

  const handleSelectKeyboardSound = (id: string) => {
    setSelectedKbSound(id);
    soundManager.setKeyboardSound(id);
    if (id !== 'none') {
      soundManager.playKeySound(id);
    }
  };

  const handleSfxVolumeChange = (vol: number) => {
    setSfxVolume(vol);
    soundManager.setSfxVolume(vol / 100);
  };

  const handleSfxVolumeCommit = () => {
    if (selectedKbSound !== 'none') {
      soundManager.playKeySound();
    }
  };

  const handleBgmVolumeChange = (vol: number) => {
    setBgmVolume(vol);
    soundManager.setBgmVolume(vol / 100);
  };

  const handleToggleBgm = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.toggleBgm();
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

        {/* ฝั่งขวา: จับเวลา & ปุ่มเครื่องมือ & ปุ่มตั้งค่าเสียง */}
        <div className="flex-1 flex items-center justify-end gap-2 sm:gap-3">
          {timer && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg mr-2 text-[20px] font-bold bg-white/10">
              <span>{timer}</span>
            </div>
          )}

          <button onClick={handleRestart} className="p-2 rounded-md hover:bg-black/10 transition-colors cursor-pointer" title="เริ่มใหม่ (Restart)">
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* ปุ่มเปิด Quick Audio Settings Modal */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-md hover:bg-black/10 transition-colors cursor-pointer relative"
            title="ตั้งค่าเสียง (Audio Settings)"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Quick Sound Settings Popup Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            ref={modalRef}
            className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-100 flex flex-col gap-5 text-gray-800"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-[#3498db] rounded-xl">
                  <Volume2 size={24} />
                </div>
                <h3 className="text-lg font-black logo-font text-gray-800">Quick Audio Settings</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* 1. Keyboard Sound Selection */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700">เสียงแป้นพิมพ์</span>
                <span className="text-[11px] font-bold text-[#3498db] bg-blue-50 px-2.5 py-0.5 rounded-full logo-font">
                  {KEYBOARD_SOUNDS.find(k => k.id === selectedKbSound)?.name}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {KEYBOARD_SOUNDS.map((sound) => (
                  <button
                    key={sound.id}
                    type="button"
                    onClick={() => handleSelectKeyboardSound(sound.id)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                      selectedKbSound === sound.id
                        ? 'bg-[#3498db] text-white shadow-sm'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/60'
                    }`}
                  >
                    <span className="logo-font">{sound.name}</span>
                  </button>
                ))}
              </div>

              {/* SFX Volume Slider */}
              {selectedKbSound !== 'none' && (
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[11px] font-medium text-gray-500 w-20">ความดังปุ่ม:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sfxVolume}
                    onChange={(e) => handleSfxVolumeChange(Number(e.target.value))}
                    onMouseUp={handleSfxVolumeCommit}
                    onTouchEnd={handleSfxVolumeCommit}
                    className="flex-1 accent-[#3498db] cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
                    style={{
                      background: `linear-gradient(to right, #3498db 0%, #3498db ${sfxVolume}%, #e5e7eb ${sfxVolume}%, #e5e7eb 100%)`
                    }}
                  />
                  <span className="text-[11px] font-bold text-gray-600 w-8 text-right logo-font">{sfxVolume}%</span>
                </div>
              )}
            </div>

            {/* 2. Background Music Settings */}
            <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">เพลงพื้นหลัง (BGM)</span>
                <button
                  type="button"
                  onClick={handleToggleBgm}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    isBgmPlaying
                      ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                      : 'bg-[#3498db] hover:bg-[#2980b9] text-white'
                  }`}
                >
                  {isBgmPlaying ? 'หยุดเล่น' : 'เล่นเพลง'}
                </button>
              </div>

              {/* BGM Volume Slider */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-medium text-gray-500 w-20">ความดังเพลง:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={bgmVolume}
                  onChange={(e) => handleBgmVolumeChange(Number(e.target.value))}
                  className="flex-1 accent-[#3498db] cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
                  style={{
                    background: `linear-gradient(to right, #3498db 0%, #3498db ${bgmVolume}%, #e5e7eb ${bgmVolume}%, #e5e7eb 100%)`
                  }}
                />
                <span className="text-[11px] font-bold text-gray-600 w-8 text-right logo-font">{bgmVolume}%</span>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-full py-2.5 bg-[#3498db] hover:bg-[#2980b9] text-white rounded-2xl font-bold text-sm transition shadow-sm cursor-pointer"
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}