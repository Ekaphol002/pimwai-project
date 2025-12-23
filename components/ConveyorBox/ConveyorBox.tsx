// components/ConveyorBox/ConveyorBox.tsx
import React from 'react';

type ConveyorBoxProps = {
  lines: string[][];
  statuses: ('correct' | 'incorrect' | 'pending')[][];
  currentLineIndex: number;
  currentCharIndexInLine: number;
  lineHeightPx: number;
  isError?: boolean;
  errorEffect?: 'none' | 'shake-box' | 'shake-text';
  visibleLines?: number;
};

export default function ConveyorBox({
  lines,
  statuses,
  currentLineIndex,
  currentCharIndexInLine,
  lineHeightPx,
  isError,
  errorEffect = 'none',
  // (แก้ตรงนี้) ตั้งค่า default เป็น 3 เพื่อให้หน้าฝึกปกติสูง 3 บรรทัด
  visibleLines = 3.6
}: ConveyorBoxProps) {

  // --- 1. ตั้งค่าขนาดและตัวอักษรพิเศษ ---
  const boxHeight = lineHeightPx * visibleLines; // ความสูงรวมของกล่องใหญ่
  const lineGap = 11; // ช่องว่างระหว่างบรรทัด

  const UPPER_VOWELS = 'ิีึืุูั็';
  const TONES = '่้๊๋์็';
  const HIDE_TRIGGER_VOWELS = UPPER_VOWELS + TONES + 'ำ';
  const ALL_VOWELS_AND_TONES = HIDE_TRIGGER_VOWELS;

  return (
    // --- 2. กรอบนอกสุด (Fixed Size, Hidden Overflow) ---
    <div
      className="w-full max-w-5xl bg-white rounded-lg p-4 pt-1 overflow-hidden relative"
      style={{ height: `${boxHeight}px` }}
    >
      {/* --- 3. แผ่นเลื่อน (Moveable Layer) เลื่อนขึ้นตามบรรทัด --- */}
      <div
        className="absolute w-full transition-transform duration-300"
        style={{
          transform: `translateY(-${currentLineIndex * (lineHeightPx + lineGap)}px)`,
          left: 0,
          right: 0,
        }}
      >
        {lines.map((line, lineIdx) => (
          // --- 4. แต่ละบรรทัด ---
          <div
            key={lineIdx}
            className="whitespace-nowrap border-b border-gray-200"
            style={{ height: `${lineHeightPx}px`, marginBottom: `${lineGap}px` }}
          >
            {/* จัดเรียงตัวอักษรในบรรทัด (ชิดล่าง) */}
            <div className="flex items-end h-full pl-2 pb-2">
              {line.map((char, charIdx) => {
                // ดึงสถานะ (ถูก/ผิด/กำลังพิมพ์)
                const status = statuses[lineIdx][charIdx];
                const isCurrent = lineIdx === currentLineIndex && charIdx === currentCharIndexInLine;

                let textClass = 'text-gray-500';
                let bgClass = '';

                // --- 5. กำหนดสีพื้นหลังและตัวอักษร ---
                if (status === 'correct') {
                  bgClass = 'bg-[#cef7b5]';
                  textClass = 'text-green-500';
                } else if (status === 'incorrect') {
                  bgClass = 'bg-red-100';
                  textClass = 'text-red-400';
                }

                let boxAnimationClass = '';
                let textAnimationClass = '';

                // --- 6. จัดการเอฟเฟกต์สั่น (Shake) ---
                if (isCurrent) {
                  if (errorEffect === 'shake-box') {
                    textClass = 'text-red-500';
                    bgClass = '';
                    boxAnimationClass = 'animate-shake';
                    textAnimationClass = 'animate-shake';
                  } else if (errorEffect === 'shake-text') {
                    textClass = 'text-red-500';
                    bgClass = '';
                    textAnimationClass = 'animate-shake';
                  } else {
                    textClass = 'text-blue-500'; // ตัวปัจจุบันสีฟ้า
                  }
                }

                // --- 7. Logic ซ่อนสีเขียว (รอพิมพ์สระให้ครบก่อนค่อยเขียว) ---
                const isConsonant = !ALL_VOWELS_AND_TONES.includes(char) && char !== ' ';
                const nextChar = line[charIdx + 1];
                const nextStatus = statuses[lineIdx] ? statuses[lineIdx][charIdx + 1] : undefined;
                const nextNextChar = line[charIdx + 2];
                const nextNextStatus = statuses[lineIdx] ? statuses[lineIdx][charIdx + 2] : undefined;
                const isToneBeforeAm = TONES.includes(char) && nextChar === 'ำ';

                if (status === 'correct') {
                  if (isConsonant) {
                    // เช็คตัวถัดไปว่าเป็นสระไหม
                    const isNextSpecial = nextChar && HIDE_TRIGGER_VOWELS.includes(nextChar);
                    const isNextPending = nextStatus === 'pending';
                    const isNextNextSpecial = nextNextChar && HIDE_TRIGGER_VOWELS.includes(nextNextChar);
                    const isNextNextPending = nextNextStatus === 'pending';

                    // ถ้าตัวหลังยังไม่พิมพ์ ให้ซ่อนสีเขียวตัวหน้าไว้ก่อน
                    if (isNextSpecial && isNextPending) bgClass = '';
                    else if (isNextSpecial && !isNextPending && isNextNextSpecial && isNextNextPending) bgClass = '';
                  }
                  else if (isToneBeforeAm && nextStatus === 'pending') {
                    bgClass = '';
                  }
                }

                const displayChar = char === ' ' ? '\u00A0' : char;
                const isSpace = char === ' ';
                const paddingClass = isSpace ? 'px-1' : '';
                const isCharVowelOrTone = ALL_VOWELS_AND_TONES.includes(char);

                // --- 8. Logic ดันวรรณยุกต์ขึ้น (หลบสระล่าง/สระอำ) ---
                const isTone = TONES.includes(char);
                const prevChar = charIdx > 0 ? line[charIdx - 1] : '';
                const isPrevUpperVowel = UPPER_VOWELS.includes(prevChar) || prevChar === 'ำ';
                const shouldLift = (isTone && isPrevUpperVowel) || (isTone && nextChar === 'ำ');

                // --- 9. Logic จัดขนาดกล่อง (Layout) ---
                const isFloatingChar = UPPER_VOWELS.includes(char) || TONES.includes(char);
                const hasFloatingFollower = nextChar && (UPPER_VOWELS.includes(nextChar) || TONES.includes(nextChar));

                let layoutClass = 'w-auto h-12 min-w-[10px]'; // (ปกติ)

                if (isFloatingChar) {
                  // (วรรณยุกต์) หุบกล่องเล็ก ดึงกลับมาซ้อนตัวหน้า พื้นหลังใส
                  layoutClass = 'w-0 h-12 -ml-[0.1em] overflow-visible z-10';
                  bgClass = 'bg-transparent';
                } else if (hasFloatingFollower) {
                  // (ตัวแม่ที่มีลูกน้อง) ขยายกล่องให้กว้างขึ้นรับวรรณยุกต์
                  layoutClass = 'w-5 h-12';
                }

                return (
                  <span key={charIdx} className={`relative text-3xl ${boxAnimationClass}`}>

                    {/* ตัวกล่องสีพื้นหลัง */}
                    <span className={`
                        ${textClass} ${bgClass} rounded-sm mx-px ${paddingClass} ${textAnimationClass}
                        inline-flex items-end justify-center 
                        ${layoutClass} 
                    `}>
                      {/* ตัวอักษร (ดันขึ้นถ้าจำเป็น) */}
                      <span
                        className="relative"
                        style={{ top: shouldLift ? '-12px' : '0px' }}
                      >
                        {displayChar}
                      </span>
                    </span>

                    {/* เส้น Cursor สีฟ้ากระพริบ */}
                    {isCurrent && errorEffect === 'none' && (
                      isCharVowelOrTone ? (
                        // กรณี: สระลอย/วรรณยุกต์ (ขีดเล็กๆ ด้านขวา)
                        <span className="absolute -bottom-1.5 right-full w-4.5 h-0.5 bg-blue-500 rounded-full animate-blink-custom" />
                      ) : isSpace ? (
                        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-blue-500 rounded-full animate-blink-custom" />
                      ) : (
                        // กรณี: ตัวอักษรปกติ (ขีดเส้นใต้เต็มตัว)
                        <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-blue-500 rounded-full animate-blink-custom" />
                      )
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}