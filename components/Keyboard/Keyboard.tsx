// components/Keyboard/Keyboard.tsx
"use client";

import React from 'react';
import {
  row1, row2, row3, row4, row5,
  thaiKeyDisplayMap,
  thaiShiftKeyDisplayMap
} from '@/lib/keyMaps';

interface KeyboardProps {
  pressedKey: string | null;
  errorKey: string | null;
  expectedKey: string | null;
  highlightedShiftKey?: string | null;
  heatmapData?: { [key: string]: number }; // <-- ใช้ในหน้าสรุปผล เพื่อระบายสีปุ่มผิด
  useBlueBlink?: boolean; // New prop for Intro
}

const Keyboard = ({
  pressedKey,
  errorKey,
  expectedKey,
  highlightedShiftKey,
  heatmapData,
  useBlueBlink = false
}: KeyboardProps) => {

  const maxErrors = heatmapData
    ? Math.max(...Object.values(heatmapData), 1) // หาค่าผิดมากสุดเพื่อคำนวณความเข้มสี
    : 1;

  // --- ปรับสระให้ลอยอยู่บนปุ่มโดยไม่แสดง ◌ ---
  const formatKeyText = (char: string) => {
    const floatingChars = ['่', '้', '๊', '๋', 'ั', 'ิ', 'ี', 'ึ', 'ื', 'ุ', 'ู', 'ฺ', '็', '์', 'ํ'];
    if (floatingChars.includes(char)) {
      return `\u00A0${char}`; // ใช้ช่องว่างแทน ◌
    }
    return char;
  };
  // --- สิ้นสุดส่วนปรับสระ ---

  const renderRow = (keys: string[]) => {
    return (
      <div className="flex w-full justify-center gap-1 my-2">
        {keys.map((key) => {
          const isPressed = pressedKey === key;
          const isError = errorKey === key;
          const isExpected = expectedKey === key;
          const isShiftHighlight = key === highlightedShiftKey;
          const isShiftPressed = pressedKey === 'ShiftLeft' || pressedKey === 'ShiftRight';

          const unshiftedText = thaiKeyDisplayMap[key] || key;
          const shiftedText = thaiShiftKeyDisplayMap[key] || unshiftedText;
          const displayText = isShiftPressed ? shiftedText : unshiftedText;

          const specialKeysLeft = ['Tab', 'CapsLock', 'ShiftLeft', 'ControlLeft', 'AltLeft', 'CmdLeft'];
          const specialKeysRight = ['Backspace', 'Backslash', 'Enter', 'ShiftRight', 'AltRight', 'CmdRight', 'ControlRight'];
          const isSpecialKey = specialKeysLeft.includes(key) || specialKeysRight.includes(key) || key === 'Space';

          let keyStyle = 'h-9 rounded-md shadow-sm transition-all duration-75 ease-out flex ';

          // กำหนดความกว้างของปุ่มตามชนิดปุ่ม
          if (key === 'Space') { keyStyle += 'flex-[7]'; }
          else if (key === 'Backspace') { keyStyle += 'flex-[2]'; }
          else if (key === 'Tab' || key === 'Backslash') { keyStyle += 'flex-[1.5]'; }
          else if (key === 'CapsLock' || key === 'Enter') { keyStyle += 'flex-[1.75]'; }
          else if (key === 'ShiftLeft' || key === 'ShiftRight') { keyStyle += 'flex-[2.25]'; }
          else if (['ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'CmdLeft', 'CmdRight'].includes(key)) { keyStyle += 'flex-[1.1]'; }
          else { keyStyle += 'flex-1'; }

          // --- ส่วนนี้คือ Heatmap ของหน้าสรุปผล ---
          if (heatmapData) {
            const errorCount = heatmapData[unshiftedText] || heatmapData[shiftedText] || 0;
            if (errorCount > 0) {
              const intensity = errorCount / maxErrors; // คำนวณความเข้มสี
              if (intensity >= 0.8) keyStyle += ' bg-red-500 text-white font-bold';
              else if (intensity >= 0.5) keyStyle += ' bg-red-400 text-red-100 font-semibold';
              else if (intensity >= 0.4) keyStyle += ' bg-red-300 text-red-100 font-semibold';
              else keyStyle += ' bg-red-200 text-red-600';
            } else {
              keyStyle += ' bg-white text-gray-400';
            }
          }
          // --- สิ้นสุด Heatmap ---

          else {
            // สถานะปุ่มอื่น ๆ (กดแล้ว, ปุ่มคาดการณ์) สำหรับโหมดพิมพ์ปกติ
            if (isPressed && isError) {
              keyStyle += ' bg-red-500 text-white transform scale-95 shadow-inner';
            } else if ((isExpected || isShiftHighlight) && !isPressed) {
              if (useBlueBlink) {
                keyStyle += ' bg-blue-500 animate-blink-blue'; // Use new blink animation
              } else {
                keyStyle += ' bg-blue-500 text-white animate-pulse';
              }
            } else if (isPressed) {
              keyStyle += ' bg-white text-gray-700 transform scale-95 shadow-inner';
            } else {
              keyStyle += ' bg-white text-gray-700';
            }
          }

          // จัดวางปุ่มพิเศษ
          if (specialKeysLeft.includes(key)) {
            keyStyle += ' items-end justify-start text-xs p-1.5';
          } else if (specialKeysRight.includes(key)) {
            keyStyle += ' items-end justify-end text-xs p-1.5';
          } else {
            keyStyle += ' items-center justify-center text-base font-medium';
          }

          return (
            <div key={key} className={keyStyle}>
              {heatmapData && !isSpecialKey ? (
                // --- แสดงตัวเลข Heatmap บนปุ่ม ---
                <div className="relative w-full h-full">
                  <span className="absolute top-0.5 left-1 text-xs">{formatKeyText(shiftedText)}</span>
                  <span className="absolute bottom-0.5 right-1 text-sm">{formatKeyText(unshiftedText)}</span>
                </div>
              ) : (
                formatKeyText(displayText)
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`mx-auto w-full max-w-2xl rounded-xl p-3 shadow-md ${heatmapData ? 'bg-gray-200' : 'bg-gray-300'}`}>
      {renderRow(row1)}
      {renderRow(row2)}
      {renderRow(row3)}
      {renderRow(row4)}
      {renderRow(row5)}
    </div>
  );
};

export default Keyboard;