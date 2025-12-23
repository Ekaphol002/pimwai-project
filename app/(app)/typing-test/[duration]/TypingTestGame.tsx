// app/typing-test/[duration]/TypingTestGame.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import ConveyorBox from '@/components/ConveyorBox/ConveyorBox';
import PracticeResultModal from '@/components/PracticeResultModal/PracticeResultModal';
import PracticeNavbar from '@/components/PracticeNavbar/PracticeNavbar';
import { SENTENCES_POOL } from '@/data/sentences';
import { thaiShiftKeyDisplayMap } from '@/lib/keyMaps';
import useSound from '@/lib/useSound';

const CHARS_PER_LINE = 45;

function generateRandomText(minLength: number): string {
  let text = "";
  while (text.length < minLength) {
    const randomIndex = Math.floor(Math.random() * SENTENCES_POOL.length);
    text += (text ? " " : "") + SENTENCES_POOL[randomIndex];
  }
  return text;
}

function chunkTextIntoSmartLines(text: string, limit: number): string[][] {
  const words = text.split(' ');
  const lines: string[][] = [];
  let currentLineChars: string[] = [];
  let currentLength = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordChars = word.split('');
    const spaceCost = currentLineChars.length > 0 ? 1 : 0;
    if (currentLength + spaceCost + wordChars.length > limit) {
      if (currentLineChars.length > 0) lines.push(currentLineChars);
      currentLineChars = [...wordChars];
      currentLength = wordChars.length;
    } else {
      if (spaceCost > 0) { currentLineChars.push(' '); currentLength++; }
      currentLineChars.push(...wordChars);
      currentLength += wordChars.length;
    }
  }
  if (currentLineChars.length > 0) lines.push(currentLineChars);
  return lines;
}

// ✅ รับ duration ผ่าน Props แทน useParams
interface TypingTestGameProps {
  durationParam: string;
}

export default function TypingTestGame({ durationParam }: TypingTestGameProps) {
  const { status } = useSession();
  const router = useRouter();
  
  // ✅ Logic เดิม
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const timeLimitMinutes = parseInt(durationParam.split('-')[0]) || 1;
  const timeLimitSeconds = timeLimitMinutes * 60;

  // Game State
  const [lines, setLines] = useState<string[][]>([[]]);
  const [statuses, setStatuses] = useState<any[][]>([[]]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndexInLine, setCurrentCharIndexInLine] = useState(0);
  const [errorEffect, setErrorEffect] = useState<'none' | 'shake-box' | 'shake-text'>('none');
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Stats
  const [totalErrors, setTotalErrors] = useState(0);
  const [correctCharsCount, setCorrectCharsCount] = useState(0);
  const [problemKeys, setProblemKeys] = useState<{ [key: string]: number }>({});
  const [finalWPM, setFinalWPM] = useState(0);
  const [finalAcc, setFinalAcc] = useState(0);
  const [earnedXP, setEarnedXP] = useState(0);

  const playTypeSound = useSound('/type.wav', 0.6);
  const playErrorSound = useSound('/error.mp3', 0.5);
  const isSubmittingRef = useRef(false);

  // Setup Text
  useEffect(() => {
    if (status !== "authenticated") return;

    setIsLoading(true);
    const text = generateRandomText(Math.max(timeLimitMinutes * 400, 500));
    const chunked = chunkTextIntoSmartLines(text, CHARS_PER_LINE);
    setLines(chunked);
    setStatuses(chunked.map(line => line.map(() => 'pending')));
    setIsLoading(false);
  }, [timeLimitMinutes, status]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (hasStarted && !isFinished && timeLeft > 0 && !isSubmittingRef.current) {
      interval = setInterval(() => {
        setTimeLeft(p => {
          if (p <= 1) { finishTest(); return 0; }
          return p - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [hasStarted, isFinished, timeLeft]);

  // Finish Logic
  const finishTest = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsFinished(true);

    const grossWPM = (correctCharsCount / 5) / timeLimitMinutes;
    const netWPM = Math.max(0, Math.round(grossWPM));
    const totalKeystrokes = correctCharsCount + totalErrors;
    const accuracy = totalKeystrokes > 0 ? Math.round((correctCharsCount / totalKeystrokes) * 100) : 0;

    setFinalWPM(netWPM);
    setFinalAcc(accuracy);

    try {
      const res = await fetch('/api/save-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: timeLimitMinutes,
          wpm: netWPM,
          accuracy,
          mistakes: problemKeys
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEarnedXP(data.earnedXP);
      }
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  // Keyboard Logic
  const expectedChar = lines[currentLineIndex]?.[currentCharIndexInLine];
  const isShiftRequired = Object.values(thaiShiftKeyDisplayMap).includes(expectedChar);

  const moveCursorForward = () => {
    const isLastChar = currentCharIndexInLine === lines[currentLineIndex].length - 1;
    const isLastLine = currentLineIndex === lines.length - 1;
    if (isLastChar && !isLastLine) { setCurrentLineIndex(p => p + 1); setCurrentCharIndexInLine(0); }
    else if (!isLastChar) { setCurrentCharIndexInLine(p => p + 1); }
    else if (isLastLine) { finishTest(); }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished || isLoading || status !== "authenticated") return;
      if (!hasStarted && e.key.length === 1 && e.key !== 'Backspace') setHasStarted(true);

      if (!expectedChar || errorEffect !== 'none') { e.preventDefault(); return; }
      const typedKey = e.key;
      e.preventDefault();
      if (typedKey === 'Backspace') {
        setErrorEffect('none');
        let newC = currentCharIndexInLine, newL = currentLineIndex;
        if (newC > 0) newC--; else if (newL > 0) { newL--; newC = lines[newL].length - 1; } else return;
        const newS = [...statuses]; newS[newL][newC] = 'pending'; setStatuses(newS);
        setCurrentLineIndex(newL); setCurrentCharIndexInLine(newC);
        return;
      }
      if (e.key.length > 1 && e.key !== 'Space') return;
      const shift = e.shiftKey;
      let isCorrect = typedKey === expectedChar;
      if (isShiftRequired && !shift) isCorrect = false;
      if (!isShiftRequired && shift && typedKey !== ' ') isCorrect = false;

      const newS = [...statuses];
      if (isCorrect) {
        playTypeSound();
        newS[currentLineIndex][currentCharIndexInLine] = 'correct';
        setStatuses(newS); setCorrectCharsCount(p => p + 1); moveCursorForward();
      } else {
        playErrorSound();
        setTotalErrors(p => p + 1);
        setProblemKeys(p => ({ ...p, [expectedChar]: (p[expectedChar] || 0) + 1 }));
        setErrorEffect('shake-box');
        newS[currentLineIndex][currentCharIndexInLine] = 'incorrect';
        setStatuses(newS);
        setTimeout(() => { setErrorEffect('none'); moveCursorForward(); }, 300);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lines, statuses, currentLineIndex, currentCharIndexInLine, expectedChar, hasStarted, isFinished, isLoading, errorEffect, isShiftRequired, status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <Loader2 size={64} className="animate-spin text-[#5cb5db] mb-4" />
        <h2 className="text-xl font-bold text-gray-600">กำลังตรวจสอบสิทธิ์...</h2>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <PracticeNavbar title={`ทดสอบ ${timeLimitMinutes} นาที`} timer={`${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`} />
      <div className="pt-10 pb-10 flex flex-col items-center gap-8 w-full max-w-5xl mx-auto px-6">
        {isFinished ? (
          <PracticeResultModal
            wpm={finalWPM}
            acc={finalAcc}
            stars={0}
            time={`${timeLimitMinutes}:00`}
            problemKeys={problemKeys}
            onRetry={() => window.location.reload()}
            onGoToLessons={() => router.push('/tests')}
            onNextLesson={() => router.push('/tests')}
            isTestMode={true}
            earnedXP={earnedXP}
          />
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 font-bold text-2xl">
            <Loader2 size={48} className="animate-spin text-[#5cb5db] mb-4" />
            <span>กำลังโหลดบททดสอบ...</span>
          </div>
        ) : (
          <ConveyorBox
            lines={lines} statuses={statuses} currentLineIndex={currentLineIndex}
            currentCharIndexInLine={currentCharIndexInLine} lineHeightPx={60}
            errorEffect={errorEffect} visibleLines={7}
          />
        )}
      </div>
    </div>
  );
}