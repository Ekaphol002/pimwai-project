import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ==========================================
// 🛠️ 1. Core Generator (สร้างไส้ใน: ตัวอักษรเรียงกันมา)
// ==========================================
function generatePattern(chars: string, length: number, style: 'block' | 'alternate' | 'random' | 'mixed' | 'anchor') {
  const charArray = chars.split('');
  let result: string[] = [];

  // ฟังก์ชันเช็คว่าเป็นวรรณยุกต์/สระลอย หรือไม่ (Match: ั ิ ี ึ ื ุ ู ฺ ็ ่ ้ ๊ ๋ ์ ํ)
  const isThaiTone = (c: string) => /[ัิีึืฺุู็่้๊๋์ํ]/.test(c);

  if (style === 'block') {
    // Block: ดดด...กกก...
    const repeatPerChar = Math.ceil(length / charArray.length);
    for (const char of charArray) {
      for (let i = 0; i < repeatPerChar; i++) result.push(char);
    }
  } else if (style === 'alternate') {
    // Alternate: ดกดก...
    for (let i = 0; i < length; i++) result.push(charArray[i % charArray.length]);
  } else if (style === 'anchor') {
    // Anchor: ดกดา...
    const anchor = charArray[0];
    const targets = charArray.slice(1);
    for (let i = 0; i < length; i++) {
      result.push(i % 2 === 0 ? anchor : targets[Math.floor(i / 2) % targets.length]);
    }
  } else if (style === 'mixed') {
    // Mixed: สุ่มแบบเกาะกลุ่ม
    let last = '';
    while (result.length < length) {
      let char;
      // พยายามสุ่มไม่ให้ซ้ำตัวเดิม
      do { char = charArray[Math.floor(Math.random() * charArray.length)]; }
      while (char === last && charArray.length > 1);
      last = char;

      // ✅ แก้ไข: ถ้าเป็นวรรณยุกต์ ให้ซ้ำได้แค่ 1-2 ตัว (พยัญชนะซ้ำได้ 1-3 ตัว)
      const maxRep = isThaiTone(char) ? 2 : 3;
      const rep = Math.floor(Math.random() * maxRep) + 1;

      for (let i = 0; i < rep && result.length < length; i++) result.push(char);
    }
  } else {
    // Random: มั่ว
    for (let i = 0; i < length; i++) result.push(charArray[Math.floor(Math.random() * charArray.length)]);
  }
  return result.slice(0, length);
}

// ==========================================
// 🛠️ 2. Gen Drill (Character Mode: เว้นวรรคทุกตัว)
// ==========================================
// Output: "ด ก ด า"
function genDrill(chars: string, length: number = 30, style: 'block' | 'alternate' | 'random' | 'mixed' | 'anchor' = 'mixed') {
  return generatePattern(chars, length, style).join(' ');
}

// ==========================================
// 🛠️ 3. Gen Words (Word Mode: คำมั่ว + สุ่มเว้นวรรค + 🛡️ กันวรรณยุกต์ซ้อนเกิน 2)
// ==========================================
// Output Equal: "ดอแ ดอแ ดอแ"
// Output Variable: "ดอ แดออ อแ ด"
function genWords(chars: string, length: number = 40, style: 'block' | 'alternate' | 'random' | 'mixed' | 'anchor' = 'mixed', spacing: 'equal' | 'variable' = 'variable') {
  const isThaiTone = (c: string) => /[ัิีึืฺุู็่้๊๋์ํ]/.test(c);

  // 1. สร้างไส้ในมาก่อน
  const rawChars = generatePattern(chars, length, style);

  // 🛡️ 2. ขั้นตอน Sanitize: ตรวจสอบไม่ให้วรรณยุกต์ติดกันเกิน 2 ตัว (เช่น ่่่ -> ่่ก)
  const validConsonants = chars.split('').filter(c => !isThaiTone(c)); // หาพยัญชนะในชุดนั้นๆ

  if (validConsonants.length > 0) { // ถ้ามีพยัญชนะให้เปลี่ยน (กันเหนียวกรณีด่านฝึกวรรณยุกต์ล้วน)
    for (let i = 2; i < rawChars.length; i++) {
      // ถ้าตัวปัจจุบัน + ตัวก่อนหน้า + ตัวก่อนหน้านู้น เป็นวรรณยุกต์หมดเลย (3 ตัวติด)
      if (isThaiTone(rawChars[i]) && isThaiTone(rawChars[i - 1]) && isThaiTone(rawChars[i - 2])) {
        // เปลี่ยนตัวที่ 3 เป็นพยัญชนะสุ่มแทน
        rawChars[i] = validConsonants[Math.floor(Math.random() * validConsonants.length)];
      }
    }
  }

  let result = "";
  let index = 0;

  while (index < rawChars.length) {
    // 3. กำหนดขนาดคำ (Chunk Size)
    let chunkSize = 3; // Default เท่ากัน

    if (spacing === 'variable') {
      // สุ่มความยาวคำ 2 ถึง 5 ตัวอักษร
      chunkSize = Math.floor(Math.random() * 4) + 2;
    }

    // 4. ตัดคำออกมา
    const end = Math.min(index + chunkSize, rawChars.length);
    let chunk = rawChars.slice(index, end).join('');

    result += chunk;
    index = end;

    // 5. เติม Space (ถ้ายังไม่จบ)
    if (index < rawChars.length) {
      if (spacing === 'variable') {
        // สุ่มเว้นวรรคเล็กน้อย (ปกติ 1, บางที 2, นานๆที 3)
        const r = Math.random();
        if (r > 0.8) result += "   ";
        else if (r > 0.4) result += " ";
        else result += "  ";
      } else {
        result += " ";
      }
    }
  }
  return result;
}

// =====================================================================
// 🟢 LEVEL 1: BEGINNER
// Character: สุ่มตัวอักษร (60-80 ตัว)
// Word: สุ่มคำและเบิ้ล 3 รอบ
// =====================================================================
const beginnerLessons = [
  // =======================================================
  // บทที่ 1: ด ่ พ (นิ้วชี้ เหย้า-บน)
  // Anchors: ด (Home L), ่ (Home R)
  // =======================================================
  {
    title: "บทที่ 1: จุดเริ่มต้น",
    subLessons: [
      {
        slug: "home-row-left-index-middle",
        title: "ฝึกปุ่ม ด",
        mode: "character",
        content: genDrill("ด", 20, "block"), // ด เป็นเหย้าอยู่แล้ว
        newKeys: ["ด"]
      },
      {
        slug: "home-row-words-left-basic",
        title: "ฝึกปุ่ม ไม้เอก",
        mode: "word",
        content: genWords("่", 30, "block", "equal"), // ่ เป็นเหย้าอยู่แล้ว
        newKeys: ["่"]
      },
      {
        slug: "home-row-right-index-middle",
        title: "ฝึกปุ่ม พ",
        mode: "character",
        content: genDrill("ดพ", 20, "anchor"), // พ ต้องคู่กับ ด (เหย้า)
        newKeys: ["พ"]
      },
      {
        slug: "home-row-words-right-basic",
        title: "ผสม ด-่",
        mode: "word", content: genWords("ด่", 40, "mixed", "variable")
      },
      {
        slug: "home-row-switch-index",
        title: "ผสม ด-พ",
        mode: "character", content: genDrill("ดพ", 30, "alternate")
      },
      {
        slug: "home-row-words-tones-1",
        title: "ผสม ่-พ",
        mode: "word", content: genWords("่ดพ", 40, "anchor", "equal")
      },
      {
        slug: "home-row-switch-middle",
        title: "รวม 3 ปุ่ม",
        mode: "character", content: genDrill("ด่พ", 35, "mixed")
      },
      {
        slug: "home-row-words-middle-focus",
        title: "สร้างคำมั่ว",
        mode: "word", content: genWords("ด่พ", 45, "random", "variable")
      },
      {
        slug: "home-row-4-keys-mastery",
        title: "สลับนิ้ว",
        mode: "word", content: genWords("ด่พ", 45, "anchor", "variable")
      },
      {
        slug: "home-row-chapter-1-test",
        title: "บอส ด ่ พ",
        mode: "word", content: genWords("ด่พ", 50, "random", "variable")
      }
    ]
  },

  // =======================================================
  // บทที่ 2: ี ก ำ (นิ้วชี้บน-กลางเหย้า-กลางบน)
  // Anchors: ่ (Home Index R -> ี), ก (Home Middle L), ก (Home Middle L -> ำ)
  // =======================================================
  {
    title: "บทที่ 2: มือขวาและวรรณยุกต์",
    subLessons: [
      {
        slug: "home-row-left-ring-pinky",
        title: "ฝึกปุ่ม สระอี",
        mode: "character",
        content: genDrill("่ี", 20, "anchor"), // ี คู่กับ ่ (เหย้า)
        newKeys: ["ี"]
      },
      {
        slug: "home-row-words-left-extended",
        title: "ฝึกปุ่ม ก",
        mode: "word",
        content: genWords("ก", 30, "block", "variable"), // ก เป็นเหย้า
        newKeys: ["ก"]
      },
      {
        slug: "home-row-right-ring-pinky",
        title: "ฝึกปุ่ม สระอำ",
        mode: "character",
        content: genDrill("กำ", 20, "anchor"), // ำ คู่กับ ก (เหย้า)
        newKeys: ["ำ"]
      },
      {
        slug: "home-row-words-right-extended",
        title: "ผสม ี-ก",
        mode: "word", content: genWords("่ีก", 40, "alternate", "equal")
      },
      {
        slug: "home-row-left-hand-full",
        title: "ผสม ก-ำ",
        mode: "character", content: genDrill("กำ", 30, "mixed")
      },
      {
        slug: "home-row-words-left-hand",
        title: "รวม 3 ปุ่ม",
        mode: "word", content: genWords("่ีกำ", 40, "anchor", "variable")
      },
      {
        slug: "home-row-right-hand-full",
        title: "รวม 3 ปุ่ม แบบสุ่ม",
        mode: "character", content: genDrill("่ีกำ", 35, "random")
      },
      {
        slug: "home-row-words-right-hand",
        title: "ทบทวนบท 1",
        mode: "word", content: genWords("ด่พ่ีกำ", 45, "mixed", "variable")
      },
      {
        slug: "home-row-8-keys-drill",
        title: "สร้างคำมั่ว",
        mode: "word", content: genWords("่ีกำ", 45, "mixed", "variable")
      },
      {
        slug: "home-row-chapter-2-test",
        title: "บอส ี ก ำ",
        mode: "word", content: genWords("่ีกำ", 50, "random", "variable")
      }
    ]
  },

  // =======================================================
  // บทที่ 3: า ร ห (นิ้วกลางขวา-นางซ้าย)
  // Anchors: า (Home R), า (Home R -> ร), ห (Home L)
  // =======================================================
  {
    title: "บทที่ 3: ปิดจบแป้นเหย้า",
    subLessons: [
      {
        slug: "home-row-center-reach",
        title: "ฝึกปุ่ม า",
        mode: "character",
        content: genDrill("า", 20, "block"), // า เป็นเหย้า
        newKeys: ["า"]
      },
      {
        slug: "home-row-words-center",
        title: "ฝึกปุ่ม ร",
        mode: "word",
        content: genWords("าร", 30, "anchor", "equal"), // ร คู่กับ า
        newKeys: ["ร"]
      },
      {
        slug: "home-row-switch-d-e",
        title: "ฝึกปุ่ม ห",
        mode: "character",
        content: genDrill("ห", 20, "block"), // ห เป็นเหย้า
        newKeys: ["ห"]
      },
      {
        slug: "home-row-words-mixed-1",
        title: "ผสม า-ร",
        mode: "word", content: genWords("าร", 40, "alternate", "variable")
      },
      {
        slug: "home-row-switch-tones",
        title: "ผสม ร-ห",
        mode: "character", content: genDrill("หร", 30, "mixed")
      },
      {
        slug: "home-row-words-tones-2",
        title: "รวม 3 ปุ่ม",
        mode: "word", content: genWords("ารห", 40, "anchor", "equal")
      },
      {
        slug: "home-row-full-drill",
        title: "รวม 3 ปุ่ม แบบสุ่ม",
        mode: "character", content: genDrill("ารห", 35, "random")
      },
      {
        slug: "home-row-words-full",
        title: "ทบทวนบทเก่า",
        mode: "word", content: genWords("ารหก", 45, "mixed", "variable")
      },
      {
        slug: "home-row-accuracy-drill",
        title: "ฝึกความแม่นยำ",
        mode: "character", content: genDrill("ารห", 40, "mixed")
      },
      {
        slug: "home-row-chapter-3-test",
        title: "บอส า ร ห",
        mode: "word", content: genWords("ารห", 50, "random", "variable")
      }
    ]
  },

  // =======================================================
  // บทที่ 4: ส น ไ (นิ้วนางขวา-ซ้ายบน)
  // Anchors: ส (Home R), ส (Home R -> น), ห (Home L -> ไ)
  // =======================================================
  {
    title: "บทที่ 4: บุกแถวบนซ้าย",
    subLessons: [
      {
        slug: "upper-row-left-index",
        title: "ฝึกปุ่ม ส",
        mode: "character",
        content: genDrill("ส", 20, "block"), // ส เป็นเหย้า
        newKeys: ["ส"]
      },
      {
        slug: "upper-row-words-left",
        title: "ฝึกปุ่ม น",
        mode: "word",
        content: genWords("สน", 30, "anchor", "variable"), // น คู่กับ ส
        newKeys: ["น"]
      },
      {
        slug: "upper-row-right-index",
        title: "ฝึกปุ่ม สระไ",
        mode: "character",
        content: genDrill("หไ", 20, "anchor"), // ไ คู่กับ ห (เหย้า)
        newKeys: ["ไ"]
      },
      {
        slug: "upper-row-words-right",
        title: "ผสม ส-น",
        mode: "word", content: genWords("สน", 40, "alternate", "equal")
      },
      {
        slug: "upper-row-vertical-switch",
        title: "ผสม น-ไ",
        mode: "character", content: genDrill("สนหไ", 30, "mixed")
      },
      {
        slug: "upper-row-words-vertical",
        title: "รวม 3 ปุ่ม",
        mode: "word", content: genWords("สนหไ", 40, "anchor", "variable")
      },
      {
        slug: "upper-row-vowels-drill",
        title: "รวม 3 ปุ่ม แบบสุ่ม",
        mode: "character", content: genDrill("สนหไ", 35, "random")
      },
      {
        slug: "upper-row-words-vowels",
        title: "ทบทวนบทเก่า",
        mode: "word", content: genWords("สนหไาร", 45, "mixed", "variable")
      },
      {
        slug: "upper-row-index-mastery",
        title: "สร้างคำมั่ว",
        mode: "word", content: genWords("สนหไ", 45, "mixed", "variable")
      },
      {
        slug: "upper-row-chapter-4-test",
        title: "บอส ส น ไ",
        mode: "word", content: genWords("สนหไ", 50, "random", "variable")
      }
    ]
  },

  // =======================================================
  // บทที่ 5: ฟ ว ย (นิ้วก้อย)
  // Anchors: ฟ (Home L), ว (Home R), ว (Home R -> ย)
  // =======================================================
  {
    title: "บทที่ 5: บุกแถวบนขวา",
    subLessons: [
      {
        slug: "upper-row-left-middle-ring",
        title: "ฝึกปุ่ม ฟ",
        mode: "character",
        content: genDrill("ฟ", 20, "block"), // ฟ เป็นเหย้า
        newKeys: ["ฟ"]
      },
      {
        slug: "upper-row-words-left-extended",
        title: "ฝึกปุ่ม ว",
        mode: "word",
        content: genWords("ว", 30, "block", "equal"), // ว เป็นเหย้า
        newKeys: ["ว"]
      },
      {
        slug: "upper-row-right-middle-ring",
        title: "ฝึกปุ่ม ย",
        mode: "character",
        content: genDrill("วย", 20, "anchor"), // ย คู่กับ ว
        newKeys: ["ย"]
      },
      {
        slug: "upper-row-words-right-extended",
        title: "ผสม ฟ-ว",
        mode: "word", content: genWords("ฟว", 40, "alternate", "variable")
      },
      {
        slug: "upper-row-vertical-switch-2",
        title: "ผสม ว-ย",
        mode: "character", content: genDrill("วย", 30, "mixed")
      },
      {
        slug: "upper-row-words-vertical-2",
        title: "รวม 3 ปุ่ม",
        mode: "word", content: genWords("ฟวย", 40, "anchor", "variable")
      },
      {
        slug: "upper-row-vowels-ai-am",
        title: "รวม 3 ปุ่ม แบบสุ่ม",
        mode: "character", content: genDrill("ฟวย", 35, "random")
      },
      {
        slug: "upper-row-words-vowels-2",
        title: "ทบทวนบทเก่า",
        mode: "word", content: genWords("ฟวยสน", 45, "mixed", "variable")
      },
      {
        slug: "upper-row-middle-ring-mastery",
        title: "สร้างคำมั่ว",
        mode: "word", content: genWords("ฟวย", 45, "mixed", "variable")
      },
      {
        slug: "upper-row-chapter-5-test",
        title: "บอส ฟ ว ย",
        mode: "word", content: genWords("ฟวย", 50, "random", "variable")
      }
    ]
  },

  // =======================================================
  // บทที่ 6: ะ ั เ (นิ้วชี้เอื้อม)
  // Anchors: ด(ะ), ่(ั), ด(เ)
  // =======================================================
  {
    title: "บทที่ 6: สระลอยฟ้า",
    subLessons: [
      {
        slug: "upper-row-right-pinky-reach",
        title: "ฝึกปุ่ม สระะ",
        mode: "character",
        content: genDrill("ดะ", 20, "anchor"), // ะ คู่กับ ด
        newKeys: ["ะ"]
      },
      {
        slug: "upper-row-words-right-reach",
        title: "ฝึกปุ่ม ไม้หัน",
        mode: "word",
        content: genWords("่ั", 30, "anchor", "equal"), // ั คู่กับ ่
        newKeys: ["ั"]
      },
      {
        slug: "upper-row-left-pinky",
        title: "ฝึกปุ่ม สระเ",
        mode: "character",
        content: genDrill("ดเ", 20, "anchor"), // เ คู่กับ ด
        newKeys: ["เ"]
      },
      {
        slug: "upper-row-words-left-pinky",
        title: "ผสม ะ-ั",
        mode: "word", content: genWords("ดะ่ั", 40, "alternate", "variable")
      },
      {
        slug: "upper-row-switch-right",
        title: "ผสม ั-เ",
        mode: "character", content: genDrill("่ัดเ", 30, "mixed")
      },
      {
        slug: "upper-row-words-mixed",
        title: "รวม 3 ปุ่ม",
        mode: "word", content: genWords("ดะ่ัดเ", 40, "anchor", "variable")
      },
      {
        slug: "upper-row-jump-drill",
        title: "รวม 3 ปุ่ม แบบสุ่ม",
        mode: "character", content: genDrill("ดะ่ัดเ", 35, "random")
      },
      {
        slug: "upper-row-words-jump",
        title: "ทบทวนคำสระ",
        mode: "word", content: genWords("ะัเีก", 45, "mixed", "equal")
      },
      {
        slug: "upper-row-full-drill",
        title: "สร้างคำมั่ว",
        mode: "word", content: genWords("ดะ่ัดเ", 45, "mixed", "variable")
      },
      {
        slug: "upper-row-chapter-6-test",
        title: "บอส ะ ั เ",
        mode: "word", content: genWords("ดะ่ัดเ", 50, "random", "variable")
      }
    ]
  },

  // =======================================================
  // บทที่ 7: ้ ิ ื (นิ้วชี้พิเศษ)
  // Anchors: ่(้), ด(ิ), ่(ื)
  // =======================================================
  {
    title: "บทที่ 7: นิ้วก้อยพิฆาต",
    subLessons: [
      {
        slug: "review-home-row-speed",
        title: "ฝึกปุ่ม ไม้โท",
        mode: "character",
        content: genDrill("่้", 20, "anchor"), // ้ คู่กับ ่
        newKeys: ["้"]
      },
      {
        slug: "review-words-home-row",
        title: "ฝึกปุ่ม สระิ",
        mode: "word",
        content: genWords("ดิ", 30, "anchor", "variable"), // ิ คู่กับ ด
        newKeys: ["ิ"]
      },
      {
        slug: "review-upper-row-speed",
        title: "ฝึกปุ่ม สระื",
        mode: "character",
        content: genDrill("่ื", 20, "anchor"), // ื คู่กับ ่
        newKeys: ["ื"]
      },
      {
        slug: "review-words-upper-row",
        title: "ผสม ้-ิ",
        mode: "word", content: genWords("่้ดิ", 40, "alternate", "equal")
      },
      {
        slug: "review-switch-rows-drill",
        title: "ผสม ิ-ื",
        mode: "character", content: genDrill("ดิ่ื", 30, "mixed")
      },
      {
        slug: "review-words-mixed-1",
        title: "รวม 3 ปุ่ม",
        mode: "word", content: genWords("่้ดิ่ื", 40, "anchor", "variable")
      },
      {
        slug: "review-pinky-focus",
        title: "รวม 3 ปุ่ม แบบสุ่ม",
        mode: "character", content: genDrill("่้ดิ่ื", 35, "random")
      },
      {
        slug: "review-words-mixed-2",
        title: "ทบทวนสระทั้งหมด",
        mode: "word", content: genWords("ะัเ้ิื", 45, "mixed", "equal")
      },
      {
        slug: "beginner-final-drill",
        title: "รวมทุกปุ่ม",
        mode: "character", content: genDrill("ด่พีก็ำารหสนไ", 50, "random")
      },
      {
        slug: "beginner-final-exam",
        title: "บอสใหญ่",
        mode: "word", content: genWords("ด่พีก็ารหสนไฟวำ", 60, "random", "variable")
      }
    ]
  }
];
// =====================================================================
// 🟡 LEVEL 2: INTERMEDIATE
// ใช้ genDrill และ genWords (x3)
// =====================================================================
const intermediateLessons = [
  // ============================================================
  // บทที่ 1: นิ้วชี้ล่าง (อ ิ ื) -> ย้ายมาเป็นบทแรก
  // Anchors: ด(อ) ด(ิ) ่(ื)
  // ============================================================
  {
    title: "นิ้วชี้ล่างซ้ายขวา",
    subLessons: [
      {
        slug: "bottom-row-left-pinky-ring",
        title: "ฝึกปุ่ม อ",
        mode: "character",
        content: genDrill("ดอ", 20, "anchor"), // ดอ ดอ
        newKeys: ["อ"]
      },
      {
        slug: "bottom-row-words-pae-phu",
        title: "ฝึกปุ่ม สระอิ",
        mode: "word",
        content: genWords("ดิ", 30, "anchor", "equal"), // ดิ ดิ ดิ
        newKeys: ["ิ"]
      },
      {
        slug: "bottom-row-left-middle-index",
        title: "ฝึกปุ่ม สระอือ",
        mode: "character",
        content: genDrill("่ื", 20, "anchor"), // ่ื ่ื
        newKeys: ["ื"]
      },
      {
        slug: "bottom-row-words-ae-or",
        title: "ผสม อ-ิ",
        mode: "word",
        content: genWords("ดอิ", 40, "mixed", "variable") // ดอิ อดดิ ดอ
      },
      {
        slug: "bottom-row-left-reach-vowel",
        title: "ผสม ิ-ื",
        mode: "character",
        content: genDrill("ดิ่ื", 30, "alternate")
      },
      {
        slug: "bottom-row-words-phi-i",
        title: "รวม 3 ปุ่ม",
        mode: "word",
        content: genWords("ด่ อืิ", 30, "anchor", "equal") // ดอ ่ื ดอ ่ื
      },
      {
        slug: "bottom-row-switch-left",
        title: "รวม 3 ปุ่ม แบบผสม",
        mode: "character",
        content: genDrill("ด่อิื", 30, "mixed")
      },
      {
        slug: "bottom-row-words-kapi",
        title: "สร้างคำมั่ว",
        mode: "word",
        content: genWords("ด่อิื", 45, "random", "variable")
      },
      {
        slug: "bottom-row-left-combined",
        title: "สลับนิ้วชี้",
        mode: "character",
        content: genDrill("ดอ่ื", 30, "alternate")
      },
      {
        slug: "bottom-row-chapter-1-test",
        title: "บอส อ ิ ื",
        mode: "word",
        content: genWords("ด่อิื", 50, "random", "variable")
      }
    ]
  },

  // ============================================================
  // บทที่ 2: นิ้วชี้บน (ุ ึ ค) -> ย้ายมาบทสอง (นิ้วชี้)
  // Anchors: ่(ุ) ่(ึ) า(ค) *ค ใช้นิ้วกลางแต่มากับชุดนี้
  // ============================================================
  {
    title: "แถวบนซ้าย",
    subLessons: [
      {
        slug: "bottom-row-right-reach-vowel",
        title: "ฝึกปุ่ม สระอุ",
        mode: "character",
        content: genDrill("ุ่", 20, "anchor"),
        newKeys: ["ุ"]
      },
      {
        slug: "bottom-row-words-mue-thue",
        title: "ฝึกปุ่ม สระอึ",
        mode: "word",
        content: genWords("่ึ", 30, "anchor", "variable"),
        newKeys: ["ึ"]
      },
      {
        slug: "bottom-row-right-index-middle",
        title: "ฝึกปุ่ม ค",
        mode: "character",
        content: genDrill("าค", 20, "anchor"),
        newKeys: ["ค"]
      },
      {
        slug: "bottom-row-words-thor-mor",
        title: "ผสม ุ-ึ",
        mode: "word",
        content: genWords("ุ่ึ", 30, "mixed", "equal")
      },
      {
        slug: "bottom-row-right-ring-pinky",
        title: "ผสม ึ-ค",
        mode: "character",
        content: genDrill("่ึาค", 30, "alternate")
      },
      {
        slug: "bottom-row-words-fai-nai",
        title: "รวม 3 ปุ่ม",
        mode: "word",
        content: genWords("ุ่ึาค", 40, "anchor", "variable")
      },
      {
        slug: "bottom-row-switch-right",
        title: "รวม 3 ปุ่ม แบบสุ่ม",
        mode: "character",
        content: genDrill("ุ่ึาค", 30, "random")
      },
      {
        slug: "bottom-row-words-tammai",
        title: "ทวนบท 1",
        mode: "word",
        content: genWords("ด่อิืุึ", 45, "mixed", "variable")
      },
      {
        slug: "bottom-row-right-combined",
        title: "พิมพ์สลับแถว",
        mode: "character",
        content: genDrill("ดอุค", 30, "mixed")
      },
      {
        slug: "bottom-row-chapter-2-test",
        title: "บอส ุ ึ ค",
        mode: "word",
        content: genWords("ุ่ึาค", 50, "random", "variable")
      }
    ]
  },

  // ============================================================
  // บทที่ 3: แถวล่างขวา (ท ม ใ) -> นิ้วชี้ กลาง นาง
  // Anchors: ่(ท) า(ม) ส(ใ)
  // ============================================================
  {
    title: "แถวล่างขวา",
    subLessons: [
      {
        slug: "top-row-left-index-basic",
        title: "ฝึกปุ่ม ท",
        mode: "character",
        content: genDrill("่ท", 20, "anchor"),
        newKeys: ["ท"]
      },
      {
        slug: "top-row-words-phu-thu",
        title: "ฝึกปุ่ม ม",
        mode: "word",
        content: genWords("าม", 30, "anchor", "equal"),
        newKeys: ["ม"]
      },
      {
        slug: "top-row-left-reach-vowel",
        title: "ฝึกปุ่ม สระใอ",
        mode: "character",
        content: genDrill("สใ", 25, "anchor"),
        newKeys: ["ใ"]
      },
      {
        slug: "top-row-words-phu-hue",
        title: "ผสม ท-ม",
        mode: "word",
        content: genWords("่ทาม", 40, "mixed", "variable")
      },
      {
        slug: "top-row-switch-left",
        title: "ผสม ม-ใ",
        mode: "character",
        content: genDrill("ามสใ", 30, "alternate")
      },
      {
        slug: "top-row-words-phupha",
        title: "รวม 3 ปุ่ม",
        mode: "word",
        content: genWords("่ทามสใ", 40, "anchor", "variable")
      },
      {
        slug: "top-row-jump-left-finger",
        title: "รวม 3 ปุ่ม แบบสุ่ม",
        mode: "character",
        content: genDrill("่ทามสใ", 35, "random")
      },
      {
        slug: "top-row-words-phap",
        title: "ทวนบท 1-2",
        mode: "word",
        content: genWords("ด่อิืุึทมใ", 45, "mixed", "variable")
      },
      {
        slug: "top-row-left-combined",
        title: "ฝึกความแม่นยำ",
        mode: "character",
        content: genDrill("ทมใ", 40, "anchor") // ยึดกับเหย้าตัวเอง
      },
      {
        slug: "top-row-chapter-3-test",
        title: "บอส ท ม ใ",
        mode: "word",
        content: genWords("่ทามสใ", 50, "random", "variable")
      }
    ]
  },

  // ============================================================
  // บทที่ 4: เชื่อมบนล่าง (ฝ ภ ถ) -> ก้อยขวา / ชี้ซ้ายบน
  // Anchors: ว(ฝ) ด(ภ) ด(ถ)
  // ============================================================
  {
    title: "เชื่อมต่อบนล่าง",
    subLessons: [
      {
        slug: "top-row-right-index-middle",
        title: "ฝึกปุ่ม ฝ",
        mode: "character",
        content: genDrill("วฝ", 20, "anchor"),
        newKeys: ["ฝ"]
      },
      {
        slug: "top-row-words-ta-kha",
        title: "ฝึกปุ่ม ภ",
        mode: "word",
        content: genWords("ดภ", 30, "anchor", "equal"),
        newKeys: ["ภ"]
      },
      {
        slug: "top-row-right-ring-pinky",
        title: "ฝึกปุ่ม ถ",
        mode: "character",
        content: genDrill("ดถ", 20, "anchor"),
        newKeys: ["ถ"]
      },
      {
        slug: "top-row-words-ja-kha",
        title: "ผสม ภ-ถ",
        mode: "word",
        content: genWords("ดภถ", 40, "mixed", "variable")
      },
      {
        slug: "top-row-right-pinky-reach",
        title: "ผสม ฝ-ภ",
        mode: "character",
        content: genDrill("วฝดภ", 30, "alternate")
      },
      {
        slug: "top-row-words-cha-chi",
        title: "รวม 3 ปุ่ม",
        mode: "word",
        content: genWords("วฝดภถ", 40, "anchor", "equal")
      },
      {
        slug: "top-row-switch-right",
        title: "รวม 3 ปุ่ม แบบสุ่ม",
        mode: "character",
        content: genDrill("วฝดภถ", 35, "random")
      },
      {
        slug: "top-row-words-chart",
        title: "ทวนบท 3",
        mode: "word",
        content: genWords("ฝภถทมใ", 45, "mixed", "variable")
      },
      {
        slug: "top-row-right-combined",
        title: "สลับบนล่าง",
        mode: "character",
        content: genDrill("ภถฝ", 40, "mixed")
      },
      {
        slug: "top-row-chapter-4-test",
        title: "บอส ฝ ภ ถ",
        mode: "word",
        content: genWords("วฝดภถ", 50, "random", "variable")
      }
    ]
  },

  // ============================================================
  // บทที่ 5: แถวล่างซ้าย (ผ ป แ) -> ก้อย นาง กลาง (เก็บตกจากเดิม)
  // Anchors: ฟ(ผ) ห(ป) ก(แ)
  // ============================================================
  {
    title: "แถวล่างซ้าย",
    subLessons: [
      {
        slug: "review-bottom-row-drill",
        title: "ฝึกปุ่ม ผ",
        mode: "character",
        content: genDrill("ฟผ", 20, "anchor"),
        newKeys: ["ผ"]
      },
      {
        slug: "review-bottom-words-mae",
        title: "ฝึกปุ่ม ป",
        mode: "word",
        content: genWords("หป", 30, "anchor", "variable"),
        newKeys: ["ป"]
      },
      {
        slug: "review-bottom-vowels",
        title: "ฝึกปุ่ม สระแอ",
        mode: "character",
        content: genDrill("กแ", 20, "anchor"),
        newKeys: ["แ"]
      },
      {
        slug: "review-bottom-words-jai",
        title: "ผสม ผ-ป",
        mode: "word",
        content: genWords("ฟผหป", 40, "mixed", "equal")
      },
      {
        slug: "review-bottom-switch-hard",
        title: "ผสม ป-แ",
        mode: "character",
        content: genDrill("หปกแ", 30, "alternate")
      },
      {
        slug: "review-bottom-words-phi",
        title: "รวม 3 ปุ่ม",
        mode: "word",
        content: genWords("ฟผหปกแ", 40, "anchor", "variable")
      },
      {
        slug: "review-bottom-jump-fast",
        title: "รวม 3 ปุ่ม แบบสุ่ม",
        mode: "character",
        content: genDrill("ฟผหปกแ", 35, "random")
      },
      {
        slug: "review-bottom-words-tammai",
        title: "ทวนบท 4",
        mode: "word",
        content: genWords("ผปแฝภถ", 45, "mixed", "variable")
      },
      {
        slug: "review-bottom-full-drill",
        title: "สลับนิ้วยาก",
        mode: "character",
        content: genDrill("ผปแ", 40, "mixed")
      },
      {
        slug: "review-bottom-exam",
        title: "บอส ผ ป แ",
        mode: "word",
        content: genWords("ฟผหปกแ", 50, "random", "variable")
      }
    ]
  },

  // ============================================================
  // บทที่ 6: แถวบนขวา (ต จ ข) -> กลาง นาง ก้อย
  // Anchors: ส(ต) ว(จ) ว(ข)
  // ============================================================
  {
    title: "แถวบนขวา",
    subLessons: [
      {
        slug: "review-top-row-drill",
        title: "ฝึกปุ่ม ต",
        mode: "character",
        content: genDrill("สต", 20, "anchor"),
        newKeys: ["ต"]
      },
      {
        slug: "review-top-row-words-phukhao",
        title: "ฝึกปุ่ม จ",
        mode: "word",
        content: genWords("วจ", 30, "anchor", "equal"),
        newKeys: ["จ"]
      },
      {
        slug: "review-top-vowels",
        title: "ฝึกปุ่ม ข",
        mode: "character",
        content: genDrill("วข", 20, "anchor"),
        newKeys: ["ข"]
      },
      {
        slug: "review-top-words-thura",
        title: "ผสม ต-จ",
        mode: "word",
        content: genWords("สตวจ", 40, "mixed", "variable")
      },
      {
        slug: "review-top-switch-hard",
        title: "ผสม จ-ข",
        mode: "character",
        content: genDrill("วจวข", 30, "alternate")
      },
      {
        slug: "review-top-words-phop",
        title: "รวม 3 ปุ่ม",
        mode: "word",
        content: genWords("สตวจวข", 40, "anchor", "equal")
      },
      {
        slug: "review-top-jump-fast",
        title: "รวม 3 ปุ่ม แบบสุ่ม",
        mode: "character",
        content: genDrill("สตวจวข", 35, "random")
      },
      {
        slug: "review-top-words-kata",
        title: "ทวนบท 5",
        mode: "word",
        content: genWords("ตจขผปแ", 45, "mixed", "variable")
      },
      {
        slug: "review-top-full-drill",
        title: "สลับนิ้วก้อย",
        mode: "character",
        content: genDrill("วจข", 40, "mixed")
      },
      {
        slug: "review-top-exam",
        title: "บอส ต จ ข",
        mode: "word",
        content: genWords("สตวจวข", 50, "random", "variable")
      }
    ]
  },

  // ============================================================
  // บทที่ 7: ตัวสุดท้ายและทบทวน (ช)
  // Anchors: ว(ช)
  // ============================================================
  {
    title: "ตัวสุดท้ายและทบทวน",
    subLessons: [
      {
        slug: "intermediate-final-bottom-drill",
        title: "ฝึกปุ่ม ช",
        mode: "character",
        content: genDrill("วช", 20, "anchor"),
        newKeys: ["ช"]
      },
      {
        slug: "intermediate-final-bottom-words",
        title: "ฝึกปุ่ม ช (Word)",
        mode: "word",
        content: genWords("วช", 30, "anchor", "variable")
      },
      {
        slug: "intermediate-final-top-drill",
        title: "ผสม ช-ข",
        mode: "character",
        content: genDrill("วชวข", 30, "mixed")
      },
      {
        slug: "intermediate-final-top-words",
        title: "ทบทวนก้อยบน",
        mode: "word",
        content: genWords("วจวขวช", 40, "anchor", "equal")
      },
      {
        slug: "intermediate-final-jump-rows",
        title: "ทวนนิ้วชี้",
        mode: "character",
        content: genDrill("ด่อิื", 40, "mixed")
      },
      {
        slug: "intermediate-final-words-cross",
        title: "ทวนแถวล่าง",
        mode: "word",
        content: genWords("อืิแใฝ", 45, "mixed", "variable")
      },
      {
        slug: "intermediate-final-jump-far",
        title: "ทวนแถวบน",
        mode: "word",
        content: genWords("ภถุึคตจขช", 45, "mixed", "equal")
      },
      {
        slug: "intermediate-final-words-hard",
        title: "รวมสลับแถว",
        mode: "character",
        content: genDrill("ภผถปึแุต", 50, "random")
      },
      {
        slug: "intermediate-final-drill-all",
        title: "รวมญาติระดับกลาง",
        mode: "character",
        content: genDrill("อืทฝภถุึคตชแิ", 50, "random")
      },
      {
        slug: "intermediate-final-boss",
        title: "บอสระดับกลาง",
        mode: "word",
        content: genWords("อืมฝภถุึคตจผปแ", 60, "random", "variable")
      }
    ]
  }
];

// =====================================================================
// 🔴 LEVEL 3: ADVANCED
// ประโยคยาว + เบิ้ล 3 รอบ (genWords)
// =====================================================================
const advancedLessons = [
  // ============================================================
  // บทที่ 1: คำไทยใช้บ่อย (Common Thai Words) -> สุ่มจัดไป 14 ด่าน
  // ============================================================
  {
    title: "คำไทยใช้บ่อย",
    subLessons: [
      {
        slug: "shift-top-left-tones",
        title: "คำสรรพนาม",
        mode: "word", content: genWords("ฉัน ผม คุณ เขา เธอ เรา มัน ท่าน พี่ น้อง")
      },
      {
        slug: "shift-words-tones",
        title: "กริยาพื้นฐาน",
        mode: "word", content: genWords("กิน เดิน นอน นั่ง พูด ฟัง ดู อ่าน เขียน ไป มา")
      },
      {
        slug: "shift-top-left-hard-chars",
        title: "คำขยายความ",
        mode: "word", content: genWords("ดี มาก น้อย ใหญ่ เล็ก สวย หล่อ เร็ว ช้า ใหม่ เก่า")
      },
      {
        slug: "shift-words-rue-phop",
        title: "คำเชื่อมประโยค",
        mode: "word", content: genWords("และ หรือ แต่ เพราะ ถ้า ว่า จน กว่า เพื่อ โดย")
      },
      {
        slug: "shift-switch-left",
        title: "คำถามทั่วไป",
        mode: "word", content: genWords("ใคร อะไร ที่ไหน เมื่อไหร่ อย่างไร ทำไม ไหม หรือเปล่า")
      },
      {
        slug: "shift-words-rit",
        title: "คำระบุเวลา",
        mode: "word", content: genWords("วันนี้ พรุ่งนี้ เมื่อวาน ตอนนี้ เดี๋ยวนี้ ตลอดไป นาน เร็ว")
      },
      {
        slug: "shift-pinky-left",
        title: "สถานที่ทั่วไป",
        mode: "word", content: genWords("บ้าน โรงเรียน ตลาด ร้านค้า ห้องน้ำ ถนน วัด ทะเล")
      },
      {
        slug: "shift-words-long",
        title: "ความรู้สึก",
        mode: "word", content: genWords("รัก ชอบ เกลียด โกรธ ดีใจ เสียใจ เหงา สุข ทุกข์")
      },
      {
        slug: "shift-top-left-combined",
        title: "คำทักทาย",
        mode: "word", content: genWords("สวัสดี ขอบคุณ ขอโทษ สบายดี ยินดี ลาก่อน ราตรีสวัสดิ์")
      },
      {
        slug: "shift-chapter-1-test",
        title: "เครือญาติ",
        mode: "word", content: genWords("พ่อ แม่ ปู่ ย่า ตา ยาย ลุง ป้า น้า อา ลูก หลาน")
      },
      // --- ด่านเสริม (11-14) ---
      {
        slug: "adv-common-extra-1",
        title: "สีสันต่างๆ",
        mode: "word", content: genWords("แดง เขียว เหลือง ขาว ดำ ม่วง ส้ม ฟ้า ชมพู")
      },
      {
        slug: "adv-common-extra-2",
        title: "อวัยวะร่างกาย",
        mode: "word", content: genWords("หัว หู ตา จมูก ปาก มือ เท้า ใจ ท้อง ขา")
      },
      {
        slug: "adv-common-extra-3",
        title: "ของใช้ในบ้าน",
        mode: "word", content: genWords("จาน ชาม ช้อน ส้อม หม้อ แก้ว เตียง หมอน ผ้าห่ม")
      },
      {
        slug: "adv-common-boss",
        title: "บอสคำไทยใช้บ่อย",
        mode: "word", content: genWords("สวัสดีวันจันทร์ ฉันรักประเทศไทย ไปกินข้าวกันไหม ขอบคุณมาก")
      }
    ]
  },

  // ============================================================
  // บทที่ 2: คำศัพท์แป้นเหย้า (Easy Home Row Words) -> สุ่มจัดไป 12 ด่าน
  // ============================================================
  {
    title: "คำศัพท์แป้นเหย้า",
    subLessons: [
      {
        slug: "shift-top-right-reach",
        title: "สระอาพาเพลิน",
        mode: "word", content: genWords("กา ดา ขา วา สา ลา หา มา อา พา น้า")
      },
      {
        slug: "shift-words-khun-nat",
        title: "แม่กกสะกดกอ",
        mode: "word", content: genWords("มาก จาก หาก ลาก ราก สาก หก ตก จก รก")
      },
      {
        slug: "shift-top-right-middle-ring",
        title: "แม่กดสะกดดอ",
        mode: "word", content: genWords("กด สด ลด หด อด กาด สาด ราด หาด กอด")
      },
      {
        slug: "shift-top-right-pinky",
        title: "แม่กงสะกดงอ",
        mode: "word", content: genWords("กาง จาง ทาง นาง บาง ฟาง วาง หาง สาง ยาง")
      },
      {
        slug: "shift-words-ying-kot",
        title: "ไม้เอกเสกคำ",
        mode: "word", content: genWords("ก่า ด่า ป่า อ่า ห่า ว่า ส่า ต่า ฮ่า น่า")
      },
      {
        slug: "shift-switch-right-hard",
        title: "ไม้โทโชว์พลัง",
        mode: "word", content: genWords("ก้า ด้า ป้า อ้า ห้า ว้า ส้า ต้า น้า ม้า")
      },
      {
        slug: "shift-words-thana",
        title: "สระเอเฮฮา",
        mode: "word", content: genWords("เก เซ เท เพ เว เล เห เอ เจ เกเร")
      },
      {
        slug: "shift-top-right-combined",
        title: "สระแอและแม่",
        mode: "word", content: genWords("แก แฉ แด แบ แพ แล แห แอ แส งอแง")
      },
      {
        slug: "shift-chapter-2-test",
        title: "สองพยางค์หรรษา",
        mode: "word", content: genWords("ดารา กากี วาจา สาลา ราคา กาแฟ เวลา")
      },
      // --- ด่านเสริม (10-12) ---
      {
        slug: "adv-home-extra-1",
        title: "สามพยางค์สร้างคำ",
        mode: "word", content: genWords("ภาราดา วาสนา สารภาพ กาลเวลา เอกลักษณ์")
      },
      {
        slug: "adv-home-extra-2",
        title: "ประโยคแป้นเหย้า",
        mode: "word", content: genWords("กาก้าฮาเฮ ดาราหน้าตาดี มาหาอา")
      },
      {
        slug: "adv-home-boss",
        title: "บอสแป้นเหย้า",
        mode: "word", content: genWords("กาลเวลา วาสนา ดาราดัง กาก้า วาจาพาที กาแฟหอมกรุ่น")
      }
    ]
  },

  // ============================================================
  // บทที่ 3: คำศัพท์แถวบน (Easy Top Row Words) -> สุ่มจัดไป 15 ด่าน
  // ============================================================
  {
    title: "คำศัพท์แถวบน",
    subLessons: [
      {
        slug: "shift-bottom-left-index-middle",
        title: "สระอีและอือ",
        mode: "word", content: genWords("ดี ตี มี ปี รือ มือ ถือ ลือ กีฬาสี ผีเสื้อ")
      },
      {
        slug: "shift-words-chan-ha",
        title: "สระอำและไอมั้ย",
        mode: "word", content: genWords("กำ ทำ นำ รำ ไป ไว ไต ไห ไร่ ไก่")
      },
      {
        slug: "shift-bottom-karan",
        title: "ไม้หันอากาศ",
        mode: "word", content: genWords("กัน วัน รัน มัน หัน ฟัน ดัน ปัน ฉัน นั้น")
      },
      {
        slug: "shift-words-karan",
        title: "แม่กนคนเก่ง",
        mode: "word", content: genWords("กิน บิน หิน ดิน จน บน ทน ฝน คน งาน")
      },
      {
        slug: "shift-bottom-rare-chars",
        title: "แม่เกยเลยลง",
        mode: "word", content: genWords("ขาย ตาย ยาย หาย โรย โชย โดย โปรย สวย รวย")
      },
      {
        slug: "shift-words-tao",
        title: "รอเรือลอลิง",
        mode: "word", content: genWords("รัก เรียน เรา รถ ลิง ลม ลด ละ โรงเรียน")
      },
      {
        slug: "shift-switch-bottom",
        title: "บอใบไม้ปอปลา",
        mode: "word", content: genWords("บาป บุญ บอก บน ปา ไป เป็น เป็ด บิน ปืน")
      },
      {
        slug: "shift-words-chan",
        title: "พอพานฟอฟัน",
        mode: "word", content: genWords("พา พบ พอ พร ไฟ ฟาง ฟัน ฟื้น ภาพ ฟ้า")
      },
      {
        slug: "shift-bottom-combined",
        title: "ไม้ม้วนใจใส",
        mode: "word", content: genWords("ใน ใจ ใส ใบ ใย ใหม่ ใหญ่ ใกล้ ใคร ผู้ใหญ่")
      },
      {
        slug: "shift-chapter-3-test",
        title: "คำควบกล้ำ",
        mode: "word", content: genWords("กราบ พระ พริก ปรับ ปรุง กลม กลืน")
      },
      // --- ด่านเสริม (11-15) ---
      {
        slug: "adv-top-extra-1",
        title: "คำที่มีตัวการันต์",
        mode: "word", content: genWords("สัตว์ ยักษ์ ศุกร์ เสาร์ อาทิตย์ จันทร์")
      },
      {
        slug: "adv-top-extra-2",
        title: "วลีแถวบน",
        mode: "word", content: genWords("ไปไหนมา กินข้าวกัน วันพระ วันเพ็ญ")
      },
      {
        slug: "adv-top-extra-3",
        title: "ประโยคสั้น",
        mode: "word", content: genWords("ฉันรักกินไก่ทอด ไปเที่ยวทะเลกันเถอะ")
      },
      {
        slug: "adv-top-extra-4",
        title: "ประโยคยาว",
        mode: "word", content: genWords("วันนี้วันดีปีใหม่ท้องฟ้าแจ่มใสพาใจสุขบาน")
      },
      {
        slug: "adv-top-boss",
        title: "บอสแถวบน",
        mode: "word", content: genWords("กินข้าวหรือยัง วันนี้อากาศดีจัง ไปทำบุญวันพระกันเถอะ")
      }
    ]
  },

  // ============================================================
  // บทที่ 4: คำศัพท์แถวล่าง (Easy Bottom Row Words) -> สุ่มจัดไป 11 ด่าน
  // ============================================================
  {
    title: "คำศัพท์แถวล่าง",
    subLessons: [
      {
        slug: "shift-middle-left-index-middle",
        title: "สระแอและแมว",
        mode: "word", content: genWords("แม่ แมว แก แฉ แถ แพ แล แห แบก แขก")
      },
      {
        slug: "shift-words-oh-bo",
        title: "สระอิชิมดู",
        mode: "word", content: genWords("กิน บิน หิน ดิน ชิง ลิง ยิง ทิ้ง กะปิ มะลิ")
      },
      {
        slug: "shift-middle-right-ring-pinky",
        title: "สระอูดูงู",
        mode: "word", content: genWords("ดู ปู งู หู รู ถู ชู คู บูชา ปลาทู")
      },
      {
        slug: "shift-words-sueksa",
        title: "ทอทหารมอมา",
        mode: "word", content: genWords("ทำ ทา ทุบ เท มา มี มือ แมว ทหาร ม้า")
      },
      {
        slug: "shift-switch-middle-1",
        title: "ผอผึ้งฝอฝา",
        mode: "word", content: genWords("ผี ผา ผัก ผม ไฝ ฝา ฝน ฝัน ผ้า ผอม")
      },
      {
        slug: "shift-words-osot",
        title: "อออ่างฮอนกฮูก",
        mode: "word", content: genWords("อา อี อู เอ โอ ฮา ฮิ ฮู โฮ โฮ่ฮิ้ว")
      },
      {
        slug: "shift-switch-middle-2",
        title: "แม่กมชมเชย",
        mode: "word", content: genWords("กาม ตาม นาม ยาม ชิม ริม ยิ้ม นิ่ม หอม แก้ม")
      },
      {
        slug: "shift-words-chan-sorn",
        title: "สระเอือเรือใบ",
        mode: "word", content: genWords("เรือ เสือ เจือ เผื่อ เมื่อ เบื่อ เหงื่อ มะเขือ")
      },
      {
        slug: "shift-middle-combined",
        title: "สระอัววัวตัว",
        mode: "word", content: genWords("ตัว หัว วัว บัว กลัว ครัว รั้ว มั่ว สลัว")
      },
      {
        slug: "shift-chapter-4-test",
        title: "คำผสมแถวล่าง",
        mode: "word", content: genWords("มะลิ กะทิ ทะเล เวลา นาที สมาธิ")
      },
      // --- ด่านเสริม (11) ---
      {
        slug: "adv-bottom-boss",
        title: "บอสแถวล่าง",
        mode: "word", content: genWords("แมวกินปลาทู แม่ไปซื้อของที่ตลาด มีความสุขมากๆนะ")
      }
    ]
  },

  // ============================================================
  // บทที่ 5: เครื่องหมายพื้นฐาน (Basic Punctuation) -> สุ่มจัดไป 13 ด่าน
  // ============================================================
  {
    title: "เครื่องหมายพื้นฐาน",
    subLessons: [
      {
        slug: "shift-vertical-switch",
        title: "ไม้ยมก",
        mode: "word", content: genWords("ดีๆ เร็วๆ สวยๆ เก่งๆ รวยๆ เด็กๆ น้องๆ เพื่อนๆ")
      },
      {
        slug: "shift-words-ruek",
        title: "ไม้ยมกในประโยค",
        mode: "word", content: genWords("ไปๆมาๆ พูดๆไปเถอะ กินๆนอนๆ ทำงานงกๆ ขำๆนะ")
      },
      {
        slug: "shift-horizontal-switch",
        title: "ไปยาลน้อย",
        mode: "word", content: genWords("กรุงเทพฯ โปรดเกล้าฯ ทูลเกล้าฯ ข้าฯ พณฯ ฯลฯ")
      },
      {
        slug: "shift-words-yart",
        title: "มหัพภาคหรือจุด",
        mode: "word", content: genWords("ต.ค. ม.ค. พ.ศ. จ.ม. น.ส. ด.ช. ด.ญ. ร.ร.")
      },
      {
        slug: "thai-numbers-1-5",
        title: "จุลภาคหรือลูกน้ำ",
        mode: "word", content: genWords("หนึ่ง, สอง, สาม แดง, เขียว, เหลือง ก, ข, ค")
      },
      {
        slug: "thai-numbers-words-1",
        title: "อัญประกาศ",
        mode: "word", content: genWords("\"สวัสดี\" \"ขอบคุณ\" \"รักนะ\" \"ห้ามเข้า\" \"ระวัง\"")
      },
      {
        slug: "thai-numbers-6-0",
        title: "นขลิขิตหรือวงเล็บ",
        mode: "word", content: genWords("(ก) (ข) (ค) (ง) (จ) (หมายเหตุ) (อ่านว่า)")
      },
      {
        slug: "thai-numbers-words-2",
        title: "ยัติภังค์",
        mode: "word", content: genWords("กรุงเทพ-เชียงใหม่ แดง-ดำ วัน-เวลา หน้า-หลัง")
      },
      {
        slug: "thai-numbers-combined",
        title: "เครื่องหมายทับ",
        mode: "word", content: genWords("บ้านเลขที่ ชั้น ห้อง ป. อำเภอ/เขต")
      },
      {
        slug: "shift-chapter-5-test",
        title: "ผสมเครื่องหมาย",
        mode: "word", content: genWords("จริงๆนะ (เขาบอกมา) \"ไปเที่ยวกัน\" กรุงเทพฯ-พัทยา")
      },
      // --- ด่านเสริม (11-13) ---
      {
        slug: "adv-punc-extra-1",
        title: "เครื่องหมายตกใจ",
        mode: "word", content: genWords("โอ้โห! ระวัง! ช่วยด้วย! ดีใจจัง! สุดยอด!")
      },
      {
        slug: "adv-punc-extra-2",
        title: "เครื่องหมายคำถาม",
        mode: "word", content: genWords("จริงเหรอ? ใคร? ที่ไหน? เมื่อไหร่? ทำไม?")
      },
      {
        slug: "adv-punc-boss",
        title: "บอสเครื่องหมาย",
        mode: "word", content: genWords("เด็กๆ เล่นกันสนุกสนาน \"ระวังตัวด้วยนะ\" กรุงเทพฯ เมืองหลวง")
      }
    ]
  },

  // ============================================================
  // บทที่ 6: เครื่องหมายขั้นสูง (Intermediate Punctuation) -> สุ่มจัดไป 10 ด่าน
  // ============================================================
  {
    title: "เครื่องหมายขั้นสูง",
    subLessons: [
      {
        slug: "shift-speed-drill-1",
        title: "ตัวการันต์",
        mode: "word", content: genWords("เสาร์ อาทิตย์ จันทร์ ศุกร์ สัตว์ ยักษ์ สิทธิ์")
      },
      {
        slug: "formal-words-law",
        title: "ไม้ไต่คู้",
        mode: "word", content: genWords("ก็ เป็น เห็น เย็น เข็น เล็ง เก็ง เป็ด แข็ง")
      },
      {
        slug: "shift-speed-drill-2",
        title: "คำทับศัพท์",
        mode: "word", content: genWords("คอมพิวเตอร์ อินเทอร์เน็ต เว็บไซต์ อีเมล ซอฟต์แวร์")
      },
      {
        slug: "formal-words-org",
        title: "ตัวฤาตัวฦา",
        mode: "word", content: genWords("ฤดู ฤษี พฤกษา ฤทธิ์ นฤมล ฤทัย อังกฤษ")
      },
      {
        slug: "shift-symbols-drill",
        title: "หญิงใหญ่ฐาน",
        mode: "word", content: genWords("หญิง ใหญ่ หญ้า เจริญ เชิญ ปัญหา รัฐ ฐาน")
      },
      {
        slug: "formal-words-bkk",
        title: "ฎาฏัก",
        mode: "word", content: genWords("กฎ กบฏ ปรากฏ มงกุฎ ราษฎร กฎหมาย กรกฎาคม")
      },
      {
        slug: "formal-sentence-1",
        title: "เฌอผู้เฒ่า",
        mode: "word", content: genWords("เฌอ เฒ่า พัฒนา วัฒนธรรม ครุฑ บัณฑิต มณโฑ")
      },
      {
        slug: "formal-sentence-2",
        title: "เครื่องหมายคำนวณ",
        mode: "word", content: genWords("บวก ลบ คูณ หาร เท่ากับ เปอร์เซ็นต์")
      },
      {
        slug: "formal-sentence-3",
        title: "ไปยาลใหญ่",
        mode: "word", content: genWords("ผลไม้มี เงาะ ทุเรียน ฯลฯ สัตว์มี หมา แมว ฯลฯ")
      },
      {
        slug: "formal-sentence-4",
        title: "บอสเครื่องหมายยาก",
        mode: "word", content: genWords("วันจันทร์ไปรษณีย์หยุด ฤดูฝนอากาศเย็น ก็เป็นได้")
      }
    ]
  },

  // ============================================================
  // บทที่ 7: ประโยคความเร็ว (Quick Sentences) -> สุ่มจัดไป 16 ด่าน (Max)
  // ============================================================
  {
    title: "ประโยคความเร็ว",
    subLessons: [
      {
        slug: "advanced-final-warmup",
        title: "ประโยคบอกเล่า",
        mode: "word", content: genWords("ฉันชื่อสมชาย เธอชื่ออะไร วันนี้อากาศดี ฝนไม่ตก")
      },
      {
        slug: "advanced-final-royal-words",
        title: "ประโยคคำถาม",
        mode: "word", content: genWords("กินข้าวหรือยัง จะไปไหนเหรอ ทำงานเสร็จไหม ง่วงนอนไหม")
      },
      {
        slug: "advanced-final-proper-names",
        title: "ประโยคปฏิเสธ",
        mode: "word", content: genWords("ฉันไม่รู้ ไม่ใช่ความจริง ไม่ได้ทำนะ ไม่เอาไม่พูด")
      },
      {
        slug: "advanced-final-essay-1",
        title: "ประโยคขอร้อง",
        mode: "word", content: genWords("ช่วยหน่อยได้ไหม ขอทางหน่อยครับ กรุณาถอดรองเท้า")
      },
      {
        slug: "advanced-final-essay-2",
        title: "สำนวนไทย",
        mode: "word", content: genWords("ไก่งามเพราะขน คนงามเพราะแต่ง น้ำขึ้นให้รีบตัก")
      },
      {
        slug: "advanced-final-essay-3",
        title: "คำคมสอนใจ",
        mode: "word", content: genWords("ความพยายามอยู่ที่ไหน ความสำเร็จอยู่ที่นั่น")
      },
      {
        slug: "advanced-final-essay-4",
        title: "เพลงชาติไทย",
        mode: "word", content: genWords("ประเทศไทยรวมเลือดเนื้อชาติเชื้อไทย เป็นประชารัฐ")
      },
      {
        slug: "advanced-final-poem",
        title: "บทสนทนา",
        mode: "word", content: genWords("ฮัลโหล สบายดีไหม สบายดีครับ แล้วคุณล่ะ ก็เรื่อยๆนะ")
      },
      {
        slug: "advanced-final-the-end",
        title: "ประโยคลิ้นพัน",
        mode: "word", content: genWords("เช้าฟาดผัดฟัก เย็นฟาดฟักผัด ระนองระยองยะลา")
      },
      {
        slug: "advanced-final-bonus",
        title: "ข่าวสั้นทันโลก",
        mode: "word", content: genWords("ราคาทองคำวันนี้ปรับตัวสูงขึ้น การจราจรติดขัด")
      },
      // --- ด่านเสริม (11-16) ---
      {
        slug: "adv-quick-extra-1",
        title: "ลิ้นพันระดับสอง",
        mode: "word", content: genWords("กาก้ากิกี้กููกู เดินดีดีเดี๋ยวล้ม ยายกินลำไยน้ำลายยายไหลย้อย")
      },
      {
        slug: "adv-quick-extra-2",
        title: "ลิ้นพันระดับสาม",
        mode: "word", content: genWords("หมูหมึกกุ้ง ใครขายไข่ไก่ ยานัดหมอมีแก้ฝีแก้หิด")
      },
      {
        slug: "adv-quick-extra-3",
        title: "คำขวัญ",
        mode: "word", content: genWords("เด็กเอ๋ยเด็กดี ต้องมีหน้าที่สิบอย่างด้วยกัน")
      },
      {
        slug: "adv-quick-extra-4",
        title: "กลอนสั้น",
        mode: "word", content: genWords("แล้วสอนว่าอย่าไว้ใจมนุษย์ มันแสนสุดลึกล้ำเหลือกำหนด")
      },
      {
        slug: "adv-quick-extra-5",
        title: "ปรัชญาชีวิต",
        mode: "word", content: genWords("ระยะทางพิสูจน์ม้า กาลเวลาพิสูจน์คน")
      },
      {
        slug: "adv-quick-boss",
        title: "บอสประโยคความเร็ว",
        mode: "word", content: genWords("ขอให้ทุกคนมีความสุขกับการฝึกพิมพ์ดีด และเก่งขึ้นทุกวัน")
      }
    ]
  }
];

async function main() {
  console.log('🚀 Updating Typing Course (Safe Mode: User Progress Preserved)...')

  const upsertLevel = async (lessonsData: any[], level: string, startOrder: number) => {
    if (!lessonsData || lessonsData.length === 0) return;

    for (let i = 0; i < lessonsData.length; i++) {
      const lessonData = lessonsData[i];

      // ✅ 1. กำหนด Slug ที่แน่นอนตามสูตรเดิม
      const lessonSlug = `lesson-${level}-${i + 1}`;

      // ✅ 2. ใช้ upsert กับ Lesson โดยเช็คจาก slug (ไม่ใช่ title)
      // ถ้าเจอ slug นี้ -> อัปเดต title เป็นภาษาไทย
      // ถ้าไม่เจอ -> สร้างใหม่
      const lesson = await prisma.lesson.upsert({
        where: { slug: lessonSlug },
        update: {
          title: lessonData.title, // เปลี่ยนชื่ออังกฤษเป็นไทยตรงนี้
          order: startOrder + i,
          // level ไม่ต้อง update เพราะเหมือนเดิม
        },
        create: {
          title: lessonData.title,
          level: level,
          order: startOrder + i,
          slug: lessonSlug
        }
      });

      console.log(`✅ Processed Lesson: ${lesson.title} (${lesson.slug})`);

      // 3. จัดการ SubLesson (เหมือนเดิมเป๊ะ ไม่ต้องแก้)
      for (let j = 0; j < lessonData.subLessons.length; j++) {
        const sub = lessonData.subLessons[j];

        await prisma.subLesson.upsert({
          where: { id: sub.slug },
          update: {
            title: sub.title,
            mode: sub.mode,
            content: sub.content,
            order: j + 1,
            lessonId: lesson.id,
            newKeys: sub.newKeys || []
          },
          create: {
            id: sub.slug,
            title: sub.title,
            mode: sub.mode,
            content: sub.content,
            order: j + 1,
            lessonId: lesson.id,
            newKeys: sub.newKeys || []
          }
        });
      }
    }
  };

  // 🔥 เรียกใช้ให้ครบทั้ง 3 ระดับ (ไม่งั้นเข้าแค่ Beginner)
  await upsertLevel(beginnerLessons, "beginner", 1);
  await upsertLevel(intermediateLessons, "intermediate", 1);
  await upsertLevel(advancedLessons, "advanced", 1);

  console.log('🎉 อัปเดตเสร็จแล้ว! ครบทุกระดับ (Beginner/Intermediate/Advanced) พร้อมเว้นวรรคและโหมดผสมครับ!');
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })