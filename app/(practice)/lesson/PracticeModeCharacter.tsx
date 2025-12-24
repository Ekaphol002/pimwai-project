// components/PracticeModeCharacter.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CharacterConveyorBox from '@/components/CharacterConveyorBox/CharacterConveyorBox';
import Keyboard from '@/components/Keyboard/Keyboard';
import PracticeResultModal from '@/components/PracticeResultModal/PracticeResultModal';
import useSound from '@/lib/useSound'; // ✅ 1. เพิ่มบรรทัดนี้
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

interface PracticeModeCharacterProps {
  initialText: string;
  subLessonId: string;
  nextUrl?: string;
}

export default function PracticeModeCharacter({ initialText, subLessonId, nextUrl }: PracticeModeCharacterProps) {
  const router = useRouter();

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

  // ✅ เพิ่ม: State สำหรับเก็บ XP ที่ได้รับ
  const [earnedXP, setEarnedXP] = useState(0);
  const [completedQuest, setCompletedQuest] = useState<{ text: string; xp: number } | null>(null);

  const playTypeSound = useSound('/type.wav', 0.6);   // เสียงพิมพ์ (ปรับความดังได้)
  const playErrorSound = useSound('/error.mp3', 0.5); // เสียงผิด

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
    try {
      // ✅ 1. รับค่า Response จาก API
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

      const data = await res.json(); // แปลงเป็น JSON

      if (data.success) {
        console.log('บันทึกผลสำเร็จ! ได้รับ EXP:', data.earnedXP);
        // ✅ 2. เอาค่า XP ที่ได้มาใส่ State
        setEarnedXP(data.earnedXP);
        setCompletedQuest(data.completedQuest); 
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
    setEarnedXP(0); // Reset XP ด้วย
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

      if (isFinished) return;

      if (event.repeat) return;

      if (!expectedChar || isCurrentCharCorrect !== null) return;

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

      if (isShiftRequired && !shiftPressed) {
        playErrorSound();
        setIsCurrentCharCorrect(false);
        setErrorKey(typedKeyCode);
        setErrorCount((count) => count + 1);
        setTotalErrors(prev => prev + 1);
        setProblemKeys((prev) => ({ ...prev, [expectedChar]: (prev[expectedChar] || 0) + 1 }));
        setTimeout(() => { setIsCurrentCharCorrect(null); }, 300);
        return;
      }

      if (typedKey === expectedChar) {
        playTypeSound();
        setIsCurrentCharCorrect(true);
        setErrorKey(null);

        const isLastCharOfLine = currentCharInLineIndex === lines[currentLineIndex].length - 1;
        const isLastLine = currentLineIndex === lines.length - 1;

        setTimeout(() => {
          if (isLastCharOfLine && !isLastLine) {
            setCurrentLineIndex(prev => prev + 1);
            setCurrentCharInLineIndex(0);
          } else if (!isLastCharOfLine) {
            setCurrentCharInLineIndex(prev => prev + 1);
          } else if (isLastLine) {
            const endTime = Date.now();
            calculateResults(endTime);
            setIsFinished(true);
            setCompletedQuest(null);
            window.scrollTo(0, 0);
          }
          setIsCurrentCharCorrect(null);
        }, 100);

      } else {
        playErrorSound();
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

  }, [lines, currentLineIndex, currentCharInLineIndex, expectedChar, isShiftRequired, initialText, startTime, totalErrors, problemKeys, isCurrentCharCorrect, isFinished]);

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
          // ✅ 3. ส่งค่า earnedXP ไปให้ Modal แสดงผล (เป็นตัวเลขเฉยๆ)
          earnedXP={earnedXP}
          completedQuest={completedQuest}
          
        />
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