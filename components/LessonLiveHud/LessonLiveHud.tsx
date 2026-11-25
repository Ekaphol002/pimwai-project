"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Flame, Star, Clock, Zap, Volume2, VolumeX, ChevronDown, Check } from 'lucide-react';
import { soundManager, KEYBOARD_SOUNDS } from '@/lib/soundEffects';

interface LessonLiveHudProps {
  completedChars: number;
  totalChars: number;
  liveAcc: number;
  currentStars?: number;
  combo: number;
  startTime: number | null;
  isFinished?: boolean;
  isTestMode?: boolean;
  overrideTimeText?: string;
  overrideWpm?: number;
  overrideProgressPct?: number;
}

export default function LessonLiveHud({
  completedChars,
  totalChars,
  liveAcc,
  currentStars = 0,
  combo,
  startTime,
  isFinished = false,
  isTestMode = false,
  overrideTimeText,
  overrideWpm,
  overrideProgressPct,
}: LessonLiveHudProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [selectedKbSound, setSelectedKbSound] = useState<string>('kb1');
  const [isSoundMenuOpen, setIsSoundMenuOpen] = useState(false);
  const soundMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = soundManager.subscribe((state) => {
      setSelectedKbSound(state.selectedKbSound);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isSoundMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (soundMenuRef.current && !soundMenuRef.current.contains(e.target as Node)) {
        setIsSoundMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSoundMenuOpen]);

  useEffect(() => {
    if (!startTime) {
      setElapsedMs(0);
      return;
    }
    if (isFinished) return;

    const update = () => setElapsedMs(Math.max(0, Date.now() - startTime));
    update();
    const timer = setInterval(update, 500);
    return () => clearInterval(timer);
  }, [startTime, isFinished]);

  const safeTotal = Math.max(1, totalChars);
  const progressPct =
    typeof overrideProgressPct === 'number'
      ? Math.min(100, Math.max(0, Math.round(overrideProgressPct)))
      : Math.min(100, Math.round((completedChars / safeTotal) * 100));

  const totalSec = Math.floor(elapsedMs / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const timeText = overrideTimeText ?? `${mins}:${secs.toString().padStart(2, '0')}`;

  const liveWpm =
    typeof overrideWpm === 'number'
      ? overrideWpm
      : startTime && elapsedMs >= 1000 && completedChars > 0
        ? Math.max(0, Math.round((completedChars / 4) / (elapsedMs / 60000)))
        : 0;

  const currentSoundObj = KEYBOARD_SOUNDS.find((s) => s.id === selectedKbSound) || KEYBOARD_SOUNDS[1];

  return (
    <div className="w-full max-w-3xl px-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px] text-gray-500 select-none">
      {/* 1. Compact Progress Bar (แสดงเฉพาะโหมดบทเรียน ส่วนโหมดทดสอบใช้หลอดลดเวลาติด Navbar แทน) */}
      {!isTestMode && (
        <div className="flex items-center gap-2">
          <div className="w-24 sm:w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#5cb5db] rounded-full transition-all duration-150"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="font-mono font-semibold text-gray-500">
            {Math.min(completedChars, safeTotal)}/{safeTotal}
          </span>
        </div>
      )}

      {/* 2. Live Timer */}
      <div className="flex items-center gap-1 font-mono font-semibold text-gray-600">
        <Clock size={12} className="text-gray-400" />
        <span>{timeText}</span>
      </div>

      {/* 3. Live WPM */}
      <div className="flex items-center gap-1 font-mono font-semibold text-gray-600">
        <Zap size={12} className="text-[#5cb5db]" />
        <span>{liveWpm} WPM</span>
      </div>

      {/* 4. Live Accuracy (& Stars for Lesson Mode) */}
      <div className="flex items-center gap-1.5">
        {!isTestMode && (
          <div className="flex items-center gap-0.5">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                size={12}
                className={s <= currentStars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300'}
              />
            ))}
          </div>
        )}
        <span className="font-mono font-semibold text-gray-600">
          {isTestMode ? `แม่นยำ ${liveAcc}%` : `${liveAcc}%`}
        </span>
      </div>

      {/* 5. Compact Combo */}
      <div className="flex items-center gap-1 font-mono font-semibold">
        <Flame
          size={12}
          className={combo >= 10 ? 'text-orange-600 fill-orange-500' : 'text-gray-400'}
        />
        <span className={combo >= 10 ? 'text-orange-600 font-bold' : 'text-gray-600'}>
          {combo}x
        </span>
      </div>

      {/* 6. Custom Keyboard Sound Popover (Gray icon, sleek white popup) */}
      <div className="relative" ref={soundMenuRef}>
        <button
          type="button"
          onClick={(e) => {
            setIsSoundMenuOpen((prev) => !prev);
            e.currentTarget.blur();
          }}
          className="flex items-center gap-1 text-[11px] font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer py-0.5 px-1.5 rounded-lg hover:bg-gray-200/60"
        >
          {selectedKbSound === 'none' ? (
            <VolumeX size={13} className="text-gray-400 shrink-0" />
          ) : (
            <Volume2 size={13} className="text-gray-400 shrink-0" />
          )}
          <span>{currentSoundObj.name}</span>
          <ChevronDown
            size={12}
            className={`text-gray-400 transition-transform duration-200 ${isSoundMenuOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isSoundMenuOpen && (
          <div className="absolute right-0 bottom-full mb-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl py-1.5 z-50">
            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              เสียงคีย์บอร์ด
            </div>
            <div className="py-1">
              {KEYBOARD_SOUNDS.map((opt) => {
                const isSelected = opt.id === selectedKbSound;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={(e) => {
                      soundManager.setKeyboardSound(opt.id);
                      if (opt.id !== 'none') {
                        soundManager.playKeySound(opt.id);
                      }
                      setIsSoundMenuOpen(false);
                      e.currentTarget.blur();
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer hover:bg-gray-100 ${
                      isSelected ? 'font-bold text-[#5cb5db]' : 'font-medium text-gray-700'
                    }`}
                  >
                    <span className="truncate">{opt.name}</span>
                    {isSelected && <Check size={13} strokeWidth={2.5} className="text-[#5cb5db] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
