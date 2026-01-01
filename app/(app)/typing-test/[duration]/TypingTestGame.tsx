"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import ConveyorBox from '@/components/ConveyorBox/ConveyorBox';
import PracticeResultModal from '@/components/PracticeResultModal/PracticeResultModal';
import PracticeNavbar from '@/components/PracticeNavbar/PracticeNavbar';
// ❌ ไม่ต้องใช้ Keyboard ในโหมดทดสอบ (หรือถ้าอยากใส่ก็ uncomment ได้)
// import Keyboard from '@/components/Keyboard/Keyboard'; 
import { SENTENCES_POOL } from '@/data/sentences';
import { thaiShiftKeyDisplayMap } from '@/lib/keyMaps';

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

interface TypingTestGameProps {
  durationParam: string;
}

export default function TypingTestGame({ durationParam }: TypingTestGameProps) {
  const router = useRouter();
  const timeLimitMinutes = parseInt(durationParam.split('-')[0]) || 1;
  const timeLimitSeconds = timeLimitMinutes * 60;

  // --- Game State ---
  const [lines, setLines] = useState<string[][]>([[]]);
  const [statuses, setStatuses] = useState<any[][]>([[]]); // เก็บ status 'correct' | 'incorrect' | 'pending'
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

  // 1. Setup Text & Init Statuses
  useEffect(() => {
    setIsLoading(true);
    // สร้าง Text ให้ยาวพอสำหรับเวลาที่เลือก
    const text = generateRandomText(Math.max(timeLimitMinutes * 400, 500)); 
    const chunked = chunkTextIntoSmartLines(text, CHARS_PER_LINE);
    
    setLines(chunked);
    // สร้าง Status Array ให้ตรงกับ Lines
    setStatuses(chunked.map(line => line.map(() => 'pending')));
    
    setIsLoading(false);
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

    // คำนวณผล
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

  // --- Keyboard Logic (Copy from PracticeModeWord) ---
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
      // 1. เช็คสถานะเกม
      if (isFinished || isLoading) return;

      // ✅ ป้องกันการกดค้าง (Key Hold)
      if (e.repeat) return;

      // เริ่มจับเวลาเมื่อกดปุ่มแรก (ที่ไม่ใช่ Backspace)
      if (!hasStarted && e.key.length === 1 && e.key !== 'Backspace') setHasStarted(true);

      // ถ้าอยู่ในจังหวะสั่น (Error Effect) ห้ามกด
      if (!expectedChar || errorEffect !== 'none') { 
        if(!expectedChar) e.preventDefault();
        return; 
      }

      const typedKey = e.key;
      
      // ป้องกัน Spacebar เลื่อนหน้าจอ
      if(typedKey === ' ' || typedKey.length === 1) e.preventDefault();

      // --- Logic Backspace (ลบย้อนหลัง) ---
      if (typedKey === 'Backspace') {
        setErrorEffect('none'); // หยุดสั่นทันทีถ้ากดลบ

        let newC = currentCharIndexInLine, newL = currentLineIndex;
        
        if (newC > 0) {
            newC--; 
        } else if (newL > 0) { 
            newL--; 
            newC = lines[newL].length - 1; 
        } else {
            return; // อยู่ตัวแรกสุด ลบไม่ได้
        }

        // Reset status ของตัวที่จะลบกลับเป็น pending
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

      // กรองปุ่มที่ไม่ใช่ตัวอักษร
      if (e.key.length > 1 && e.key !== 'Space') return;

      const shift = e.shiftKey;
      let isCorrect = typedKey === expectedChar;
      
      // ตรวจสอบ Shift
      if (isShiftRequired && !shift) isCorrect = false;
      if (!isShiftRequired && shift && typedKey !== ' ') isCorrect = false;

      const newS = [...statuses];

      if (isCorrect) {
        // --- กรณีพิมพ์ถูก ---
        if (newS[currentLineIndex]) {
            const newLine = [...newS[currentLineIndex]];
            newLine[currentCharIndexInLine] = 'correct';
            newS[currentLineIndex] = newLine;
            setStatuses(newS);
        }
        setCorrectCharsCount(p => p + 1);
        moveCursorForward();
      } else {
        // --- กรณีพิมพ์ผิด ---
        setTotalErrors(p => p + 1);
        setProblemKeys(p => ({ ...p, [expectedChar]: (p[expectedChar] || 0) + 1 }));

        // เช็คตัวก่อนหน้าเพื่อเลือก Effect
        let prevCharStatus = null;
        if (currentCharIndexInLine > 0 && statuses[currentLineIndex]) {
            prevCharStatus = statuses[currentLineIndex][currentCharIndexInLine - 1];
        } else if (currentLineIndex > 0 && statuses[currentLineIndex - 1]) {
            const prevLine = statuses[currentLineIndex - 1];
            prevCharStatus = prevLine[prevLine.length - 1];
        }

        if (prevCharStatus === 'incorrect') {
            // ถ้าตัวก่อนหน้าก็ผิด -> สั่นแค่ตัวอักษร (shake-text)
            setErrorEffect('shake-text');
            setTimeout(() => { setErrorEffect('none'); }, 300);
        } else {
            // ถ้าเป็นความผิดพลาดใหม่ -> สั่นทั้งกล่อง (shake-box)
            setErrorEffect('shake-box');
            
            // Mark เป็น incorrect แล้วข้ามไป (เหมือน Word Mode)
            if (newS[currentLineIndex]) {
                const newLine = [...newS[currentLineIndex]];
                newLine[currentCharIndexInLine] = 'incorrect';
                newS[currentLineIndex] = newLine;
                setStatuses(newS);
            }

            // รอสั่นเสร็จค่อยเลื่อน Cursor
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

  // --- Render ---
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
            onGoToLessons={() => router.push('/tests')} // แก้ Path ตามที่คุณต้องการ
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
            lines={lines}
            statuses={statuses}
            currentLineIndex={currentLineIndex}
            currentCharIndexInLine={currentCharIndexInLine}
            lineHeightPx={60}
            errorEffect={errorEffect}
            visibleLines={7} // ปรับจำนวนบรรทัดที่แสดงได้ตามใจชอบ
          />
        )}
      </div>
    </div>
  );
}