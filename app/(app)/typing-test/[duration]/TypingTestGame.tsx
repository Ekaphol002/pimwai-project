"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import ConveyorBox from '@/components/ConveyorBox/ConveyorBox';
import PracticeResultModal from '@/components/PracticeResultModal/PracticeResultModal';
import PracticeNavbar from '@/components/PracticeNavbar/PracticeNavbar';
import { SENTENCES_POOL } from '@/data/sentences';
import { thaiShiftKeyDisplayMap } from '@/lib/keyMaps';

// ลดจำนวนตัวอักษรต่อบรรทัดลงเล็กน้อยเพื่อให้ตัดคำภาษาไทยสวยขึ้น
const CHARS_PER_LINE = 45; 

// --- Helper 1: สุ่มประโยคแบบไม่ซ้ำ (Shuffle) ---
function generateRandomText(minLength: number): string {
  let text = "";
  // สับตำแหน่งประโยคใน Pool (Fisher-Yates Shuffle แบบย่อ)
  let pool = [...SENTENCES_POOL].sort(() => 0.5 - Math.random());
  let poolIndex = 0;

  while (text.length < minLength) {
    // ถ้าใช้ประโยคหมด Pool แล้ว ให้สับใหม่อีกรอบ
    if (poolIndex >= pool.length) {
      pool = [...SENTENCES_POOL].sort(() => 0.5 - Math.random());
      poolIndex = 0;
    }

    const sentence = pool[poolIndex];
    // ถ้ามี Text อยู่แล้วให้เติม Space คั่นก่อนต่อประโยคใหม่
    text += (text ? " " : "") + sentence;
    poolIndex++;
  }
  return text;
}

// --- Helper 2: ตัดคำภาษาไทยและจัดบรรทัด (Smart Line Break) ---
function chunkTextIntoSmartLines(text: string, limit: number): string[][] {
  const lines: string[][] = [];
  let currentLineChars: string[] = [];
  
  // ใช้ Intl.Segmenter สำหรับตัดคำภาษาไทย (แม่นยำกว่า split space)
  const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
  const segments = [...segmenter.segment(text)].map(s => s.segment);

  for (const word of segments) {
    const wordChars = word.split('');

    // กรณี 1: คำเดียวโดดๆ ยาวเกินบรรทัด (เช่น URL หรือคำมั่วๆ ยาวๆ)
    // จำเป็นต้องตัดทิ้งดื้อๆ เพื่อไม่ให้ UI พัง
    if (wordChars.length > limit) {
        // ถ้าบรรทัดปัจจุบันมีของอยู่ ให้ push เก็บไปก่อน
        if (currentLineChars.length > 0) {
            lines.push([...currentLineChars]);
            currentLineChars = [];
        }
        // ทยอยตัดคำยาวๆ ใส่บรรทัดใหม่
        let remainingChars = [...wordChars];
        while (remainingChars.length > 0) {
             const chunk = remainingChars.splice(0, limit);
             lines.push(chunk);
        }
        continue; // ข้ามไปคำต่อไป
    }

    // กรณี 2: คำปกติ
    // เช็คว่าถ้าเติมคำนี้ลงไป จะล้นบรรทัดไหม?
    if (currentLineChars.length + wordChars.length > limit) {
      // ถ้าล้น -> เอาบรรทัดเก่าเก็บเข้า lines
      lines.push([...currentLineChars]);
      // เริ่มบรรทัดใหม่ด้วยคำนี้
      currentLineChars = [...wordChars];
      
      // *ทริค*: ถ้าขึ้นบรรทัดใหม่แล้วตัวแรกเป็น "space" ให้ลบทิ้ง (Trim Start)
      if (currentLineChars.length > 0 && currentLineChars[0] === ' ') {
          currentLineChars.shift();
      }
    } else {
      // ถ้าไม่ล้น -> ต่อคำเข้าไป
      currentLineChars.push(...wordChars);
    }
  }

  // อย่าลืมเก็บเศษบรรทัดสุดท้าย
  if (currentLineChars.length > 0) lines.push(currentLineChars);
  
  return lines;
}

interface TypingTestGameProps {
  durationParam: string;
}

export default function TypingTestGame({ durationParam }: TypingTestGameProps) {
  const router = useRouter();
  const timeLimitMinutes = parseInt(durationParam.split('-')[0]) || 1;
  const timeLimitSeconds = timeLimitMinutes * 60;

  // --- Game State ---
  const [lines, setLines] = useState<string[][]>([[]]);
  const [statuses, setStatuses] = useState<any[][]>([[]]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndexInLine, setCurrentCharIndexInLine] = useState(0);
  
  // Effect State
  const [errorEffect, setErrorEffect] = useState<'none' | 'shake-box' | 'shake-text'>('none');
  
  // Timer & Status State
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
  const isSubmittingRef = useRef(false);
  const [xpBreakdown, setXpBreakdown] = useState(null);

  // 1. Setup Text & Init Statuses
  useEffect(() => {
    setIsLoading(true);
    // สร้าง Text (คำนวณเผื่อไว้: 1 นาทีพิมพ์ได้ประมาณ 300-400 ตัวอักษรสำหรับคนเก่งๆ)
    const textLength = Math.max(timeLimitMinutes * 500, 600); 
    const text = generateRandomText(textLength); 
    
    const chunked = chunkTextIntoSmartLines(text, CHARS_PER_LINE);
    
    setLines(chunked);
    setStatuses(chunked.map(line => line.map(() => 'pending')));
    
    setIsLoading(false);
    
    // Reset state อื่นๆ เมื่อเปลี่ยนเวลาทดสอบ
    setHasStarted(false);
    setIsFinished(false);
    setTimeLeft(timeLimitMinutes * 60);
    setCurrentLineIndex(0);
    setCurrentCharIndexInLine(0);
    setCorrectCharsCount(0);
    setTotalErrors(0);
    isSubmittingRef.current = false;

  }, [timeLimitMinutes]);

  // 2. Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (hasStarted && !isFinished && timeLeft > 0 && !isSubmittingRef.current) {
      interval = setInterval(() => {
        setTimeLeft(p => {
          if (p <= 1) { 
            finishTest(); 
            return 0; 
          }
          return p - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [hasStarted, isFinished, timeLeft]);

  // 3. Finish & Save Logic
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
        setXpBreakdown(data.xpBreakdown)
      }
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  const expectedChar = lines[currentLineIndex]?.[currentCharIndexInLine];
  const isShiftRequired = Object.values(thaiShiftKeyDisplayMap).includes(expectedChar);

  const moveCursorForward = () => {
    const isLastChar = currentCharIndexInLine === lines[currentLineIndex].length - 1;
    const isLastLine = currentLineIndex === lines.length - 1;
    
    if (isLastChar && !isLastLine) { 
      setCurrentLineIndex(p => p + 1); 
      setCurrentCharIndexInLine(0); 
    } else if (!isLastChar) { 
      setCurrentCharIndexInLine(p => p + 1); 
    } else if (isLastLine) { 
      finishTest(); 
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished || isLoading) return;
      if (e.repeat) return;

      // เริ่มจับเวลาเมื่อกดปุ่มแรก
      if (!hasStarted && e.key.length === 1 && e.key !== 'Backspace') setHasStarted(true);

      if (!expectedChar || errorEffect !== 'none') { 
        if(!expectedChar) e.preventDefault();
        return; 
      }

      const typedKey = e.key;
      if(typedKey === ' ' || typedKey.length === 1) e.preventDefault();

      // --- Logic Backspace ---
      if (typedKey === 'Backspace') {
        setErrorEffect('none');
        let newC = currentCharIndexInLine, newL = currentLineIndex;
        
        if (newC > 0) {
            newC--; 
        } else if (newL > 0) { 
            newL--; 
            newC = lines[newL].length - 1; 
        } else {
            return; 
        }

        const newS = [...statuses];
        if (newS[newL]) {
            const updatedLine = [...newS[newL]];
            updatedLine[newC] = 'pending';
            newS[newL] = updatedLine;
            setStatuses(newS);
        }
        
        setCurrentLineIndex(newL); 
        setCurrentCharIndexInLine(newC);
        return;
      }

      if (e.key.length > 1 && e.key !== 'Space') return;

      const shift = e.shiftKey;
      let isCorrect = typedKey === expectedChar;
      
      if (isShiftRequired && !shift) isCorrect = false;
      if (!isShiftRequired && shift && typedKey !== ' ') isCorrect = false;

      const newS = [...statuses];

      if (isCorrect) {
        if (newS[currentLineIndex]) {
            const newLine = [...newS[currentLineIndex]];
            newLine[currentCharIndexInLine] = 'correct';
            newS[currentLineIndex] = newLine;
            setStatuses(newS);
        }
        setCorrectCharsCount(p => p + 1);
        moveCursorForward();
      } else {
        setTotalErrors(p => p + 1);
        setProblemKeys(p => ({ ...p, [expectedChar]: (p[expectedChar] || 0) + 1 }));

        let prevCharStatus = null;
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
            if (newS[currentLineIndex]) {
                const newLine = [...newS[currentLineIndex]];
                newLine[currentCharIndexInLine] = 'incorrect';
                newS[currentLineIndex] = newLine;
                setStatuses(newS);
            }
            setTimeout(() => {
                setErrorEffect('none');
                moveCursorForward();
            }, 300);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lines, statuses, currentLineIndex, currentCharIndexInLine, expectedChar, hasStarted, isFinished, isLoading, errorEffect, isShiftRequired]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <PracticeNavbar 
        title={`ทดสอบ ${timeLimitMinutes} นาที`} 
        timer={`${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`} 
      />
      
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
            xpBreakdown={xpBreakdown}
          />
        ) : isLoading ? (
          <div className="h-screen flex flex-col items-center justify-center py-20 text-gray-400 font-bold text-2xl">
            <Loader2 size={48} className="animate-spin text-[#5cb5db] mb-4" />
            <span>กำลังโหลดบททดสอบ...</span>
          </div>
        ) : (
          <ConveyorBox
            lines={lines}
            statuses={statuses}
            currentLineIndex={currentLineIndex}
            currentCharIndexInLine={currentCharIndexInLine}
            lineHeightPx={60}
            errorEffect={errorEffect}
            visibleLines={7}
          />
        )}
      </div>
    </div>
  );
}