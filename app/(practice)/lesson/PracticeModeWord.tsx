"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ConveyorBox from '@/components/ConveyorBox/ConveyorBox';
import Keyboard from '@/components/Keyboard/Keyboard';
import PracticeResultModal from '@/components/PracticeResultModal/PracticeResultModal';
import useSound from '@/lib/useSound'; // ✅ 1. เพิ่มบรรทัดนี้
import {
  reverseThaiKeyMap,
  thaiShiftKeyDisplayMap,
  leftHandKeys,
  rightHandKeys
} from '@/lib/keyMaps';

type CharStatus = 'correct' | 'incorrect' | 'pending';
const CHARS_PER_LINE = 47;

function chunkTextIntoCharLines(text: string): string[][] {
  if (!text) return [[]];
  const words = text.split(' ');
  const lines: string[][] = [];
  let currentLine: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let wordChars = word.split('');
    if (i < words.length - 1) {
      wordChars.push(' ');
    }
    if (currentLine.length + wordChars.length > CHARS_PER_LINE && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = [];
    }
    currentLine.push(...wordChars);
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  return lines;
}

interface PracticeModeWordProps {
  initialText: string;
  subLessonId: string;
  isTestMode?: boolean;
  nextUrl?: string;
}

export default function PracticeModeWord({
  initialText,
  subLessonId,
  isTestMode = false,
  nextUrl
}: PracticeModeWordProps) {
  const router = useRouter();

  // ✅ 1. เพิ่ม State เก็บข้อความที่ขยายแล้ว (คูณ 4) เพื่อใช้คำนวณ WPM ตอนจบ
  const [expandedText, setExpandedText] = useState('');

  const [lines, setLines] = useState<string[][]>([[]]);
  const [statuses, setStatuses] = useState<CharStatus[][]>([[]]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndexInLine, setCurrentCharIndexInLine] = useState(0);

  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorEffect, setErrorEffect] = useState<'none' | 'shake-box' | 'shake-text'>('none');

  // State สำหรับสถิติ
  const [isFinished, setIsFinished] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalErrors, setTotalErrors] = useState(0);
  const [problemKeys, setProblemKeys] = useState<{ [key: string]: number }>({});

  const [finalWPM, setFinalWPM] = useState(0);
  const [finalAcc, setFinalAcc] = useState(0);
  const [finalStars, setFinalStars] = useState(0);
  const [finalTime, setFinalTime] = useState("0:00");

  const [earnedXP, setEarnedXP] = useState(0);
  const [completedQuest, setCompletedQuest] = useState<{ text: string; xp: number } | null>(null);

  const playTypeSound = useSound('/type.wav', 0.6);
  const playErrorSound = useSound('/error.mp3', 0.5);

  const handleNextLesson = () => {
    if (nextUrl) {
      window.location.href = nextUrl;
    } else {
      router.push('/lessons');
    }
  };

  // ✅ 2. แก้ไข useEffect ให้คูณข้อความ (x4) ก่อนนำไปใช้งาน
  useEffect(() => {
    if (initialText) {
      // สร้าง array ขนาด 4 ช่อง ใส่ text เดิมลงไป แล้ว join ด้วยช่องว่าง
      const multipliedText = Array(4).fill(initialText).join(' ');
      
      setExpandedText(multipliedText); // เก็บไว้คำนวณคะแนน
      const chunkedLines = chunkTextIntoCharLines(multipliedText); // ตัดบรรทัดจากตัวที่คูณแล้ว
      
      setLines(chunkedLines);
      resetLesson(chunkedLines);
    }
  }, [initialText]);

  const saveResultToDb = async (wpm: number, accuracy: number, stars: number, duration: number) => {
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
          setCompletedQuest(data.completedQuest);
      }

    } catch (error) {
      console.error('บันทึกผลล้มเหลว:', error);
    }
  };

  const calculateResults = (endTime: number) => {
    if (!startTime) return;

    const durationMs = endTime - startTime;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    setFinalTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);

    const durationInSeconds = Math.round(durationMs / 1000);
    const durationInMinutes = durationMs / 60000;

    // ✅ 3. ใช้ expandedText (ตัวคูณแล้ว) ในการคำนวณ WPM และ Accuracy
    const totalChars = expandedText.replace(/ /g, '').length; // ใช้ expandedText แทน initialText
    
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

  const resetLesson = (newLines?: string[][]) => {
    setIsFinished(false);
    setCurrentLineIndex(0);
    setCurrentCharIndexInLine(0);
    setErrorEffect('none');
    setStatuses((newLines || lines).map(line => line.map(() => 'pending')));

    setStartTime(null);
    setTotalErrors(0);
    setProblemKeys({});
    setFinalWPM(0);
    setFinalAcc(0);
    setFinalStars(0);
    setFinalTime("0:00");
    setEarnedXP(0); 
    setCompletedQuest(null);
    window.scrollTo(0, 0);
  };

  const goToLessonsPage = () => { router.push('/lessons'); };

  const expectedChar = lines[currentLineIndex]?.[currentCharIndexInLine];
  // ป้องกันกรณี expectedChar เป็น undefined (จบเกมแล้วแต่ render รอบสุดท้าย)
  const expectedKeyCode = expectedChar ? reverseThaiKeyMap[expectedChar] : '';
  const isShiftRequired = expectedChar ? Object.values(thaiShiftKeyDisplayMap).includes(expectedChar) : false;

  let highlightedShiftKey = null;
  if (isShiftRequired) {
    if (leftHandKeys.has(expectedKeyCode)) highlightedShiftKey = 'ShiftRight';
    else if (rightHandKeys.has(expectedKeyCode)) highlightedShiftKey = 'ShiftLeft';
  }

  const moveCursorForward = () => {
    const isLastCharOfLine = currentCharIndexInLine === lines[currentLineIndex].length - 1;
    const isLastLine = currentLineIndex === lines.length - 1;

    if (isLastCharOfLine && !isLastLine) {
      setCurrentLineIndex(prev => prev + 1);
      setCurrentCharIndexInLine(0);
    } else if (!isLastCharOfLine) {
      setCurrentCharIndexInLine(prev => prev + 1);
    } else if (isLastLine) {
      const endTime = Date.now();
      calculateResults(endTime);
      setIsFinished(true);
      window.scrollTo(0, 0);
    } else {
      setCurrentLineIndex(prev => prev + 1);
      setCurrentCharIndexInLine(0);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isFinished) return;

      if (!expectedChar || errorEffect !== 'none') {
        // อนุญาตให้กดได้เฉพาะกรณีที่ไม่ได้อยู่ในสถานะ error สั่น
        // แต่ถ้าจบเกมแล้ว (expectedChar ไม่มี) ก็ห้ามกด
        if(!expectedChar) event.preventDefault();
        return;
      };

      if (!startTime && event.key !== 'Backspace' && event.key.length === 1) {
        setStartTime(Date.now());
      }

      const typedKeyCode = event.code;
      const typedKey = event.key;
      setPressedKey(typedKeyCode);
      
      // ป้องกัน Default action เช่น Spacebar เลื่อนหน้าจอ
      if(typedKey === ' ' || typedKey.length === 1) {
          event.preventDefault();
      }

      // --- Logic ปุ่ม Backspace ---
      if (typedKey === 'Backspace') {
        setErrorKey(null);
        setErrorEffect('none');

        let newCharIndex = currentCharIndexInLine;
        let newLineIndex = currentLineIndex;

        if (newCharIndex > 0) {
          newCharIndex--;
        } else if (newLineIndex > 0) {
          newLineIndex--;
          newCharIndex = lines[newLineIndex].length - 1;
        } else {
          return;
        }

        const newStatuses = [...statuses];
        if (newStatuses[newLineIndex]) {
          const updatedLineStatus = [...newStatuses[newLineIndex]];
          updatedLineStatus[newCharIndex] = 'pending';
          newStatuses[newLineIndex] = updatedLineStatus;
          setStatuses(newStatuses);
        }

        setCurrentLineIndex(newLineIndex);
        setCurrentCharIndexInLine(newCharIndex);
        return;
      }
      // --- สิ้นสุด Logic Backspace ---

      if (event.key.length > 1 && event.key !== 'Space') return;
      const shiftPressed = event.shiftKey;
      let isCorrect = typedKey === expectedChar;
      
      // ตรวจสอบ Shift
      if (isShiftRequired && !shiftPressed) isCorrect = false;
      // ถ้าไม่ได้ต้องการ Shift แต่กด Shift (ยกเว้น Spacebar)
      if (!isShiftRequired && shiftPressed && typedKey !== ' ') isCorrect = false;

      const newStatuses = [...statuses];

      if (isCorrect) {
        playTypeSound();
        if (newStatuses[currentLineIndex]) {
          const newLineStatus = [...newStatuses[currentLineIndex]];
          newLineStatus[currentCharIndexInLine] = 'correct';
          newStatuses[currentLineIndex] = newLineStatus;
          setStatuses(newStatuses);
        }
        setErrorKey(null);
        moveCursorForward();
      } else {
        playErrorSound();
        setErrorKey(typedKeyCode);
        setTotalErrors((prev) => prev + 1);
        const char = expectedChar;
        setProblemKeys((prev) => ({
          ...prev,
          [char]: (prev[char] || 0) + 1,
        }));

        let prevCharStatus: CharStatus | null = null;
        if (currentCharIndexInLine > 0 && statuses[currentLineIndex]) {
          prevCharStatus = statuses[currentLineIndex][currentCharIndexInLine - 1];
        } else if (currentLineIndex > 0 && statuses[currentLineIndex - 1]) {
          const prevLine = statuses[currentLineIndex - 1];
          prevCharStatus = prevLine[prevLine.length - 1];
        }

        if (prevCharStatus === 'incorrect') {
          setErrorEffect('shake-text');
          setTimeout(() => { setErrorEffect('none'); }, 300);
        } else {
          setErrorEffect('shake-box');
          if (newStatuses[currentLineIndex]) {
            const newLineStatus = [...newStatuses[currentLineIndex]];
            newLineStatus[currentCharIndexInLine] = 'incorrect';
            newStatuses[currentLineIndex] = newLineStatus;
            setStatuses(newStatuses);
          }

          setTimeout(() => {
            setErrorEffect('none');
            moveCursorForward();
          }, 300);
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => { setPressedKey(null); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };

  }, [lines, statuses, currentLineIndex, currentCharIndexInLine, expectedChar, isShiftRequired, errorEffect, startTime, totalErrors, isFinished]); 
  // เอา initialText ออกจาก dependency array ของ useEffect นี้เพราะไม่ได้ใช้โดยตรง

  return (
    <div className="pt-4 pb-10 flex flex-col items-center gap-8">
      {isFinished ? (
        <PracticeResultModal
          wpm={finalWPM}
          acc={finalAcc}
          stars={finalStars}
          time={finalTime}
          problemKeys={problemKeys}
          onRetry={() => resetLesson()}
          onGoToLessons={goToLessonsPage}
          onNextLesson={handleNextLesson}
          isTestMode={isTestMode}
          earnedXP={earnedXP}
          completedQuest={completedQuest}
        />
      ) : (
        <>
          <ConveyorBox
            lines={lines}
            statuses={statuses}
            currentLineIndex={currentLineIndex}
            currentCharIndexInLine={currentCharIndexInLine}
            lineHeightPx={60}
            errorEffect={errorEffect}
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