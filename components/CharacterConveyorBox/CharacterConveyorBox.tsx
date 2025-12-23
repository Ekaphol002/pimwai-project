// components/CharacterConveyorBox/CharacterConveyorBox.tsx
import React from 'react';

// (1. กำหนด Props)
// นี่คือ "พิมพ์เขียว" บอกว่า Component นี้รับข้อมูลอะไรบ้าง
type CharacterConveyorBoxProps = {
  lines: string[][]; // (ข้อมูลตัวอักษร เช่น [['ก','ด'], ['น','ห']])
  currentLineIndex: number; // (แถวที่กำลังพิมพ์)
  currentCharIndexInLine: number; // (ตัวที่กำลังพิมพ์)
  isCurrentCharCorrect: boolean | null; // (สัญญาณ ถูก/ผิด/รอตรวจ)
  shakeTrigger: number; // (สัญญาณสั่น: รับ errorCount มา)
};

export default function CharacterConveyorBox({
  lines,
  currentLineIndex,
  currentCharIndexInLine,
  isCurrentCharCorrect,
  shakeTrigger, // (2. รับข้อมูล 5 อย่างนี้มาจาก "สมอง")
}: CharacterConveyorBoxProps) {

  return (
    // (กล่องใหญ่สุดที่ครอบทั้งหมด)
    <div className="w-full max-w-4xl overflow-hidden">

      {/* (3. ตัวเลื่อน) 
             * นี่คือ "สายพาน" (Conveyor) ที่ใช้ 'translateX' 
             * เพื่อเลื่อนไปทางซ้าย 100% เมื่อ 'currentLineIndex' (แถว) เปลี่ยน
            */}
      <div
        className="flex transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(-${currentLineIndex * 100}%)` }}
      >
        {/* (4. วนลูปสร้าง "แถว") */}
        {lines.map((line, lineIndex) => (

          <div
            key={`line-${lineIndex}`}
            className="w-full flex-shrink-0 flex items-center justify-center p-4"
          >
            {/* (5. เพิ่ม pt-6 เพื่อเว้นที่ให้เครื่องหมาย ✓/✗ ข้างบน) */}
            <div className="flex items-center gap-2 pt-6">

              {/* (6. วนลูปสร้าง "กล่องตัวอักษร" ในแถว) */}
              {line.map((char, charIndex) => {

                // (7. Logic เช็คสถานะ: พิมพ์แล้ว, ปัจจุบัน, ยังไม่ถึง)
                let charState: 'typed' | 'current' | 'upcoming' = 'upcoming';
                if (lineIndex === currentLineIndex) {
                  if (charIndex < currentCharIndexInLine) {
                    charState = 'typed'; // (พิมพ์ผ่านไปแล้ว)
                  } else if (charIndex === currentCharIndexInLine) {
                    charState = 'current'; // (ตัวที่กำลังพิมพ์)
                  }
                } else if (lineIndex < currentLineIndex) {
                  charState = 'typed'; // (แถวที่พิมพ์ผ่านไปแล้ว)
                }

                // (8. Logic สไตล์กล่อง: สร้าง CSS ตามสถานะ)
                let boxStyle = "w-20 h-20 rounded-lg flex items-center justify-center text-4xl font-mono ";
                if (charState === 'typed') {
                  boxStyle += "bg-[#cef7b5] text-green-600"; // (สีเขียว)
                } else if (charState === 'upcoming') {
                  boxStyle += "bg-white border-2 border-gray-300 text-gray-500"; // (สีขาวเทา)
                } else {
                  boxStyle += "text-white font-bold shadow-inner ";
                  // (9. เช็คว่า พิมพ์ผิดหรือไม่ จาก 'isCurrentCharCorrect')
                  if (lineIndex === currentLineIndex && isCurrentCharCorrect === false) {
                    boxStyle += "bg-red-500"; // (ถ้าผิด -> กล่องแดง)
                  } else {
                    boxStyle += "bg-blue-500"; // (ปกติ -> กล่องน้ำเงิน)
                  }
                }

                // (10. Logic สั่น: ถ้าเป็น 'current' ให้ key = shakeTrigger)
                // (เพื่อบังคับให้ React re-render <span> ✗ ใหม่ทุกครั้งที่ errorCount เปลี่ยน)
                const key = (charState === 'current') ? shakeTrigger : `char-${lineIndex}-${charIndex}`;

                return (
                  // (11. "ห่อ" กล่องด้วย div (relative) เพื่อให้ ✓/✗ ลอยอยู่ข้างบนได้)
                  <div key={key} className="relative">

                    {/* (เครื่องหมาย ✓ เมื่อพิมพ์ถูก) */}
                    {charState === 'typed' && (
                      <span className="
                 			absolute -top-10 left-0 right-0 
                 			text-center text-green-500 font-bold text-2xl 
                 			animate-pop-up-check
                      ">
                        ✔
                      </span>
                    )}

                    {/* (เครื่องหมาย ✗ เมื่อพิมพ์ผิด) */}
                    {charState === 'current' && isCurrentCharCorrect === false && (
                      <span
                        key={`error-${shakeTrigger}`} // (key นี้จะทำให้ ✗ สั่นใหม่ทุกครั้ง)
                        className="
                 			absolute -top-10 left-0 right-0 
                 			text-center text-red-500 font-bold text-2xl 
                 			animate-shake
                      "
                      >
                        ✖
                      </span>
                    )}

                    {/* (12. กล่องสี่เหลี่ยมจริงๆ ที่โชว์ตัวอักษร) */}
                    <div className={boxStyle}>
                      {char === ' ' ? '_' : char}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}