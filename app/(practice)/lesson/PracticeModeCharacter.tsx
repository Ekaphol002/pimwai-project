// components/PracticeModeCharacter.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CharacterConveyorBox from '@/components/CharacterConveyorBox/CharacterConveyorBox';
import Keyboard from '@/components/Keyboard/Keyboard';
import PracticeResultModal from '@/components/PracticeResultModal/PracticeResultModal';
import NewKeyIntro from '@/components/NewKeyIntro/NewKeyIntro'; // Import
import {
  reverseThaiKeyMap,
  thaiShiftKeyDisplayMap,
  leftHandKeys,
  rightHandKeys
} from '@/lib/keyMaps';

const CHARS_PER_LINE = 8;

function chunkTextIntoCharLines(text: string): string[][] {
  if (!text) return [[]];
  const chars = text.split(' ');
  const lines: string[][] = [];
  for (let i = 0; i < chars.length; i += CHARS_PER_LINE) {
    lines.push(chars.slice(i, i + CHARS_PER_LINE));
  }
  return lines;
}

type XpBreakdown = {
  base: number;
  quest: number;
  wpm: number;
  grinder: number;
  firstWin: number;
};

interface PracticeModeCharacterProps {
  initialText: string;
  subLessonId: string;
  nextUrl?: string;
}

export default function PracticeModeCharacter({ initialText, subLessonId, nextUrl }: PracticeModeCharacterProps) {
  const router = useRouter();

  // Intro State
  const [showIntro, setShowIntro] = useState(true); // Default show intro for now
  const [isIntroPhase1Complete, setIsIntroPhase1Complete] = useState(false);

  const [lines, setLines] = useState<string[][]>([[]]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharInLineIndex, setCurrentCharInLineIndex] = useState(0);
  const [isCurrentCharCorrect, setIsCurrentCharCorrect] = useState<boolean | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  // ตัวแปรเก็บค่าสถิติ
  const [isFinished, setIsFinished] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalErrors, setTotalErrors] = useState(0);
  const [problemKeys, setProblemKeys] = useState<{ [key: string]: number }>({});

  // คะแนนสำหรับ Modal
  const [finalWPM, setFinalWPM] = useState(0);
  const [finalAcc, setFinalAcc] = useState(0);
  const [finalStars, setFinalStars] = useState(0);
  const [finalTime, setFinalTime] = useState("0:00");

  const [earnedXP, setEarnedXP] = useState(0);
  const [completedQuest, setCompletedQuest] = useState<{ text: string; xp: number } | null>(null);
  const [xpBreakdown, setXpBreakdown] = useState<XpBreakdown | null>(null);
  const [questText, setQuestText] = useState<string | null>(null);
  const [totalXP, setTotalXP] = useState(0);

  // ใช้ Ref เพื่อป้องกันการส่งข้อมูลซ้ำ (Double Submit)
  const isSubmittingRef = useRef(false);

  const handleNextLesson = () => {
    if (nextUrl) {
      window.location.href = nextUrl;
    } else {
      router.push('/lessons');
    }
  };

  useEffect(() => {
    if (initialText) {
      const chunkedLines = chunkTextIntoCharLines(initialText);
      setLines(chunkedLines);
      resetLesson(chunkedLines);
    }
  }, [initialText]);

  // --- ฟังก์ชันบันทึกผลลง Database ---
  const saveResultToDb = async (wpm: number, accuracy: number, stars: number, duration: number) => {
    if (isSubmittingRef.current) return; // ป้องกันส่งซ้ำ
    isSubmittingRef.current = true;

    try {
      const res = await fetch('/api/save-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subLessonId,
          wpm,
          accuracy,
          stars,
          duration
        }),
      });

      const data = await res.json();

      if (data.success) {
        console.log('บันทึกผลสำเร็จ! ได้รับ EXP:', data.earnedXP);
        setEarnedXP(data.earnedXP);
        setXpBreakdown(data.xpBreakdown);
        setTotalXP(data.totalXP);
        if (data.completedQuest) {
          setQuestText(data.completedQuest.text);
        } else {
          setQuestText(null);
        }
      }

    } catch (error) {
      console.error('บันทึกผลล้มเหลว:', error);
    }
  };

  // -----------------------------
  // ฟังก์ชันคำนวณผล
  // -----------------------------
  const calculateResults = (endTime: number) => {
    if (!startTime) return;

    const durationMs = endTime - startTime;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    setFinalTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);

    const durationInSeconds = Math.round(durationMs / 1000);

    const durationInMinutes = durationMs / 60000;
    const totalChars = initialText.replace(/ /g, '').length;
    const grossWPM = (totalChars / 4) / durationInMinutes;
    const errorPenalty = totalErrors / durationInMinutes;
    const netWPM = Math.round(grossWPM - errorPenalty);
    const calculatedWPM = netWPM < 0 ? 0 : netWPM;
    setFinalWPM(calculatedWPM);

    const totalKeystrokes = totalChars + totalErrors;
    const accuracy = totalKeystrokes > 0 ? Math.round((totalChars / totalKeystrokes) * 100) : 100;
    setFinalAcc(accuracy);

    let stars = 0;
    if (accuracy >= 95) stars = 3;
    else if (accuracy >= 90) stars = 2;
    else if (accuracy >= 85) stars = 1;
    setFinalStars(stars);

    saveResultToDb(calculatedWPM, accuracy, stars, durationInSeconds);
  };

  // -----------------------------
  // ฟังก์ชัน reset
  // -----------------------------
  const resetLesson = (newLines?: string[][]) => {
    setIsFinished(false);
    setIsFinished(false);
    setShowIntro(true); // Show intro on reset
    setIsIntroPhase1Complete(false);
    isSubmittingRef.current = false;
    setCurrentLineIndex(0);
    setCurrentCharInLineIndex(0);
    setIsCurrentCharCorrect(null);
    setErrorCount(0);

    setStartTime(null);
    setTotalErrors(0);
    setProblemKeys({});
    setFinalWPM(0);
    setFinalAcc(0);
    setFinalStars(0);
    setFinalTime("0:00");
    setEarnedXP(0);
    window.scrollTo(0, 0);
  };

  const goToLessonsPage = () => { router.push('/lessons'); };

  const expectedChar = lines[currentLineIndex]?.[currentCharInLineIndex];
  const expectedKeyCode = reverseThaiKeyMap[expectedChar];
  const isShiftRequired = Object.values(thaiShiftKeyDisplayMap).includes(expectedChar);

  let highlightedShiftKey = null;
  if (isShiftRequired) {
    if (leftHandKeys.has(expectedKeyCode)) highlightedShiftKey = 'ShiftRight';
    else if (rightHandKeys.has(expectedKeyCode)) highlightedShiftKey = 'ShiftLeft';
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {

      if (isFinished || showIntro) return; // Disable game input during intro
      if (event.repeat) return; // ป้องกันการกดแช่

      // ❌ ลบเงื่อนไขที่บล็อกการพิมพ์ออก (isCurrentCharCorrect !== null) เพื่อให้พิมพ์ต่อเนื่องได้ทันที
      if (!expectedChar) return;

      if (event.key === 'Shift') {
        setPressedKey(event.code);
        return;
      }

      if (!startTime && event.key !== 'Backspace' && event.key.length === 1) {
        setStartTime(Date.now());
      }

      const typedKeyCode = event.code;
      const typedKey = event.key;
      setPressedKey(typedKeyCode);
      event.preventDefault();
      const shiftPressed = event.shiftKey;

      // ------------------------------------
      // Logic ตรวจคำ (เหมือนเดิม 100%)
      // ------------------------------------
      if (isShiftRequired && !shiftPressed) {
        // กรณีต้องกด Shift แต่ไม่กด -> ผิด
        setIsCurrentCharCorrect(false);
        setErrorKey(typedKeyCode);
        setErrorCount((count) => count + 1);
        setTotalErrors(prev => prev + 1);
        setProblemKeys((prev) => ({ ...prev, [expectedChar]: (prev[expectedChar] || 0) + 1 }));
        setTimeout(() => { setIsCurrentCharCorrect(null); }, 300); // Shake effect ยังคงไว้
        return;
      }

      if (typedKey === expectedChar) {
        // ✅ กรณีพิมพ์ถูก: ขยับทันที ไม่ต้องรอ setTimeout
        setIsCurrentCharCorrect(true); // เซ็ตเพื่อให้สีเขียวขึ้นแป๊บเดียว หรือ Conveyor ขยับ
        setErrorKey(null);

        const isLastCharOfLine = currentCharInLineIndex === lines[currentLineIndex].length - 1;
        const isLastLine = currentLineIndex === lines.length - 1;

        // ขยับ Cursor ทันที
        if (isLastCharOfLine && !isLastLine) {
          setCurrentLineIndex(prev => prev + 1);
          setCurrentCharInLineIndex(0);
        } else if (!isLastCharOfLine) {
          setCurrentCharInLineIndex(prev => prev + 1);
        } else if (isLastLine) {
          // จบเกม
          const endTime = Date.now();
          calculateResults(endTime);
          setIsFinished(true);
          setCompletedQuest(null);
          window.scrollTo(0, 0);
        }

        // Reset สถานะกลับเป็นปกติทันทีเพื่อให้พร้อมรับตัวต่อไป
        // ไม่ต้องรอ 100ms
        setIsCurrentCharCorrect(null);

      } else {
        // กรณีพิมพ์ผิดทั่วไป
        setIsCurrentCharCorrect(false);
        setErrorKey(typedKeyCode);
        setErrorCount((count) => count + 1);
        setTotalErrors(prev => prev + 1);
        setProblemKeys((prev) => ({ ...prev, [expectedChar]: (prev[expectedChar] || 0) + 1 }));
        setTimeout(() => { setIsCurrentCharCorrect(null); }, 300);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      setPressedKey(null);
      setErrorKey(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };

  }, [lines, currentLineIndex, currentCharInLineIndex, expectedChar, isShiftRequired, initialText, startTime, totalErrors, problemKeys, isFinished, showIntro]); // Added showIntro

  return (
    <div className="pt-4 pb-10 flex flex-col items-center gap-8">
      {isFinished ? (
        <PracticeResultModal
          wpm={finalWPM}
          acc={finalAcc}
          stars={finalStars}
          time={finalTime}
          problemKeys={problemKeys}
          onRetry={() => resetLesson(lines)}
          onGoToLessons={goToLessonsPage}
          onNextLesson={handleNextLesson}
          earnedXP={earnedXP}
          xpBreakdown={xpBreakdown}
          questText={questText}
          totalXP={totalXP}
        />
      ) : showIntro ? (
        // Intro Screen
        <>
          <NewKeyIntro
            targetChar={lines[0][0] || ' '}
            onComplete={() => setShowIntro(false)}
            onCorrectPress={() => setIsIntroPhase1Complete(true)} // Stop blinking when correct
          />
          {/* Show Keyboard during intro highlighting the target key */}
          <Keyboard
            pressedKey={pressedKey} // Still show press effect? Maybe
            errorKey={null}
            expectedKey={!isIntroPhase1Complete ? (reverseThaiKeyMap[lines[0][0]] || 'Space') : 'Enter'}
            highlightedShiftKey={null} // Simplify for intro for now
            useBlueBlink={!isIntroPhase1Complete} // Blink only in Phase 1
          />
        </>
      ) : (
        <>
          <CharacterConveyorBox
            lines={lines}
            currentLineIndex={currentLineIndex}
            currentCharIndexInLine={currentCharInLineIndex}
            isCurrentCharCorrect={isCurrentCharCorrect}
            shakeTrigger={errorCount}
          />
          <Keyboard
            pressedKey={pressedKey}
            errorKey={errorKey}
            expectedKey={expectedKeyCode}
            highlightedShiftKey={highlightedShiftKey}
          />
        </>
      )}
    </div>
  );
}