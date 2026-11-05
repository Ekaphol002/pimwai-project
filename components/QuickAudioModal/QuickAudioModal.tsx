"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Music,
  Play,
  Square,
  Trash2,
  Plus,
  Loader2,
  X,
  ChevronDown,
  Check
} from 'lucide-react';
import { soundManager, KEYBOARD_SOUNDS, BgmTrack } from '@/lib/soundEffects';
import toast from 'react-hot-toast';

interface QuickAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyboardSoundChange?: (soundId: string) => void;
}

export default function QuickAudioModal({
  isOpen,
  onClose,
  onKeyboardSoundChange,
}: QuickAudioModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const [selectedKbSound, setSelectedKbSound] = useState('kb1');
  const [isKbDropdownOpen, setIsKbDropdownOpen] = useState(false);
  const [sfxVolume, setSfxVolume] = useState(70);
  const [bgmVolume, setBgmVolume] = useState(40);
  const [selectedBgmTracks, setSelectedBgmTracks] = useState<string[]>(['bgm1', 'bgm2', 'bgm3']);
  const [allTracks, setAllTracks] = useState<BgmTrack[]>([]);
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);

  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const [isAddingYoutube, setIsAddingYoutube] = useState(false);

  useEffect(() => {
    const unsubscribe = soundManager.subscribe((state) => {
      setIsBgmPlaying(state.isBgmPlaying);
      setBgmVolume(Math.round(state.bgmVolume * 100));
      setSfxVolume(Math.round(state.sfxVolume * 100));
      setSelectedKbSound(state.selectedKbSound);
      setSelectedBgmTracks(state.selectedTracks);
      setAllTracks(state.allTracks);
      setPreviewingTrackId(state.previewingTrackId);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
      setIsKbDropdownOpen(false);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectKeyboardSound = (id: string) => {
    setSelectedKbSound(id);
    setIsKbDropdownOpen(false);
    soundManager.setKeyboardSound(id);
    if (onKeyboardSoundChange) {
      onKeyboardSoundChange(id);
    }
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

  const handlePlayTrackRow = (trackId: string) => {
    const isCurrentlyPlayingThis = isBgmPlaying && previewingTrackId === trackId;
    if (isCurrentlyPlayingThis) {
      soundManager.stopBgm();
    } else {
      if (!selectedBgmTracks.includes(trackId)) {
        soundManager.setSelectedTracks([...selectedBgmTracks, trackId]);
      }
      soundManager.togglePreviewTrack(trackId);
    }
  };

  const handleToggleTrackCheck = (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let nextTracks: string[];
    if (selectedBgmTracks.includes(trackId)) {
      if (selectedBgmTracks.length <= 1) {
        toast.error('ต้องเลือกเพลงอย่างน้อย 1 เพลง');
        return;
      }
      nextTracks = selectedBgmTracks.filter((id) => id !== trackId);
    } else {
      nextTracks = [...selectedBgmTracks, trackId];
    }
    soundManager.setSelectedTracks(nextTracks);
  };

  const handleRemoveCustomTrack = (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.removeCustomTrack(trackId);
    toast.success('ลบเพลงออกจากรายการแล้ว');
  };

  const handleAddYoutube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrlInput.trim()) {
      toast.error('กรุณาวางลิงก์เพลงจาก YouTube');
      return;
    }

    setIsAddingYoutube(true);
    try {
      const result = await soundManager.addYoutubeTrack(youtubeUrlInput);
      if (result.success) {
        setYoutubeUrlInput('');
        toast.success(`เปิดเพลง "${result.track?.title}" เรียบร้อย!`);
      } else {
        toast.error(result.error || 'ลิงก์ YouTube ไม่ถูกต้อง');
      }
    } finally {
      setIsAddingYoutube(false);
    }
  };

  const activeKbName = KEYBOARD_SOUNDS.find((k) => k.id === selectedKbSound)?.name || 'Keyboard 1';

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4 overscroll-none"
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl border border-gray-100 flex flex-col gap-5 text-gray-800 overscroll-contain transform-gpu"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Volume2 size={20} className="text-[#5cb5db]" />
            <h3 className="text-base font-black text-gray-800">ตั้งค่าเสียงและเพลง</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. เสียงแป้นพิมพ์ */}
        <div className="flex flex-col gap-3 pb-5 border-b border-gray-100">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-gray-600">เสียงแป้นพิมพ์</span>

            {/* Custom Dropdown เลือกเสียงคีย์บอร์ด */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsKbDropdownOpen(!isKbDropdownOpen)}
                className="flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-xs font-bold text-gray-700 transition cursor-pointer min-w-[140px]"
              >
                <span className="logo-font">{activeKbName}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isKbDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isKbDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-20">
                  {KEYBOARD_SOUNDS.map((sound) => {
                    const isSelected = selectedKbSound === sound.id;
                    return (
                      <button
                        key={sound.id}
                        type="button"
                        onClick={() => handleSelectKeyboardSound(sound.id)}
                        className={`w-full px-3.5 py-2 text-left text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? 'text-[#5cb5db] bg-blue-50/50'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="logo-font">{sound.name}</span>
                        {isSelected && <Check size={14} className="text-[#5cb5db]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* แถบปรับความดังเสียงคีย์บอร์ด */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSelectKeyboardSound(selectedKbSound === 'none' ? 'kb1' : 'none')}
              className="text-gray-400 hover:text-gray-600 transition cursor-pointer shrink-0"
              title={selectedKbSound === 'none' ? 'เปิดเสียงคีย์บอร์ด' : 'ปิดเสียงคีย์บอร์ด'}
            >
              {selectedKbSound === 'none' ? <VolumeX size={16} /> : <Volume2 size={16} className="text-[#5cb5db]" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              disabled={selectedKbSound === 'none'}
              value={selectedKbSound === 'none' ? 0 : sfxVolume}
              onChange={(e) => handleSfxVolumeChange(Number(e.target.value))}
              onMouseUp={handleSfxVolumeCommit}
              onTouchEnd={handleSfxVolumeCommit}
              className="flex-1 accent-[#5cb5db] cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none disabled:opacity-40"
              style={{
                background: `linear-gradient(to right, #5cb5db 0%, #5cb5db ${selectedKbSound === 'none' ? 0 : sfxVolume}%, #e5e7eb ${selectedKbSound === 'none' ? 0 : sfxVolume}%, #e5e7eb 100%)`,
              }}
            />
            <span className="text-xs font-bold text-gray-500 w-9 text-right logo-font">
              {selectedKbSound === 'none' ? 'ปิด' : `${sfxVolume}%`}
            </span>
          </div>
        </div>

        {/* 2. เพลงพื้นหลัง & YouTube */}
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600">เพลงพื้นหลัง</span>

            {/* แถบปรับความดังเพลง */}
            <div className="flex items-center gap-2.5 w-48">
              <button
                type="button"
                onClick={() => soundManager.toggleBgm()}
                title={isBgmPlaying ? 'หยุดเพลง' : 'เล่นเพลง'}
                className="cursor-pointer shrink-0"
              >
                <Music size={15} className={isBgmPlaying ? 'text-[#5cb5db]' : 'text-gray-400 hover:text-gray-600'} />
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={bgmVolume}
                onChange={(e) => handleBgmVolumeChange(Number(e.target.value))}
                className="flex-1 accent-[#5cb5db] cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
                style={{
                  background: `linear-gradient(to right, #5cb5db 0%, #5cb5db ${bgmVolume}%, #e5e7eb ${bgmVolume}%, #e5e7eb 100%)`,
                }}
              />
              <span className="text-xs font-bold text-gray-500 w-9 text-right logo-font">{bgmVolume}%</span>
            </div>
          </div>

          {/* ช่องวางลิงก์ YouTube */}
          <form
            onSubmit={handleAddYoutube}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gray-50 border border-gray-200/80 focus-within:border-[#5cb5db] focus-within:bg-white transition-all"
          >
            <img
              src="/youtube.png"
              alt="YouTube"
              className="w-5 h-5 object-contain shrink-0"
            />
            <input
              type="text"
              value={youtubeUrlInput}
              onChange={(e) => setYoutubeUrlInput(e.target.value)}
              placeholder="วางลิงก์ YouTube เพื่อเพิ่มเพลง..."
              className="flex-1 text-xs text-gray-800 placeholder:text-gray-400 bg-transparent outline-none min-w-0 py-1"
            />
            <button
              type="submit"
              disabled={isAddingYoutube || !youtubeUrlInput.trim()}
              className="p-1.5 rounded-xl text-[#5cb5db] hover:bg-blue-50 disabled:opacity-30 transition cursor-pointer shrink-0"
              title="เพิ่มและเล่นเพลง"
            >
              {isAddingYoutube ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
            </button>
          </form>

          {/* รายการเพลง: ซ้ายเป็นไอคอนเพลง ขวาเป็นกล่องเช็กเลือกเพลง (เลื่อนลื่นไหลและซ่อนแถบ Scrollbar) */}
          <div
            className="flex flex-col divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-gray-50/50 max-h-56 overflow-y-auto overscroll-contain transform-gpu [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{ WebkitOverflowScrolling: 'touch', willChange: 'scroll-position' }}
          >
            {allTracks.map((track) => {
              const isPlayingThis = isBgmPlaying && previewingTrackId === track.id;
              const isSelected = selectedBgmTracks.includes(track.id);

              return (
                <div
                  key={track.id}
                  onClick={() => handlePlayTrackRow(track.id)}
                  className={`px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer ${
                    isPlayingThis
                      ? 'bg-blue-50/60 text-[#5cb5db]'
                      : 'hover:bg-gray-100/70 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Music
                      size={15}
                      className={`shrink-0 ${isPlayingThis ? 'text-[#5cb5db]' : 'text-gray-400'}`}
                    />

                    {track.youtubeId && (
                      <img
                        src="/youtube.png"
                        alt="YouTube"
                        className="w-4 h-4 object-contain shrink-0"
                      />
                    )}

                    <span className={`text-xs truncate logo-font ${isPlayingThis ? 'font-bold text-[#5cb5db]' : 'font-medium text-gray-700'}`}>
                      {track.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {isPlayingThis && (
                      <span className="text-[10px] font-bold text-[#5cb5db]">กำลังเล่น</span>
                    )}

                    {track.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveCustomTrack(track.id, e)}
                        title="ลบเพลงนี้"
                        className="p-1 text-gray-400 hover:text-red-500 transition cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}

                    {/* กล่องเช็กเลือกเพลงที่จะให้เล่นวนลูป */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleTrackCheck(track.id, e)}
                      title={isSelected ? 'นำออกจากรายการเล่น' : 'เลือกเข้าในรายการเล่น'}
                      className={`w-4 h-4 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#5cb5db] text-white border border-[#5cb5db]'
                          : 'bg-white border border-gray-300 hover:border-[#5cb5db]'
                      }`}
                    >
                      {isSelected && <Check size={11} strokeWidth={3} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
