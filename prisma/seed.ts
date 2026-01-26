import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ==========================================
// 🛠️ Helper Functions (ฉบับปรับปรุง Logic ภาษาไทยสมบูรณ์)
// ==========================================

// เช็คว่าเป็นวรรณยุกต์/สระลอย หรือไม่
const isThaiTone = (c: string) => /[ัิีึืฺุู็่้๊๋์ํ]/.test(c);

// --------------------------------------------------------
// 1. Core Generator (สำหรับ Character Mode)
// --------------------------------------------------------
// อันนี้ใช้สำหรับโหมด Character เหมือนเดิม (ฝึกนิ้วล้วนๆ ไม่สนคำ)
function generatePattern(chars: string, length: number, style: 'block' | 'alternate' | 'random' | 'mixed' | 'anchor') {
  const charArray = chars.split('');
  let result: string[] = [];

  if (style === 'block') {
    const repeatPerChar = Math.ceil(length / charArray.length);
    for (const char of charArray) for (let i = 0; i < repeatPerChar; i++) result.push(char);
  } else if (style === 'alternate') {
    for (let i = 0; i < length; i++) result.push(charArray[i % charArray.length]);
  } else if (style === 'anchor') {
    const anchor = charArray[0];
    const targets = charArray.slice(1);
    for (let i = 0; i < length; i++) {
      result.push(i % 2 === 0 ? anchor : targets[Math.floor(i / 2) % targets.length]);
    }
  } else if (style === 'mixed') {
    let last = '';
    while (result.length < length) {
      let char;
      do { char = charArray[Math.floor(Math.random() * charArray.length)]; }
      while (char === last && charArray.length > 1);
      last = char;

      const rep = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < rep && result.length < length; i++) result.push(char);
    }
  } else {
    // Random
    for (let i = 0; i < length; i++) result.push(charArray[Math.floor(Math.random() * charArray.length)]);
  }
  return result.slice(0, length);
}

// --------------------------------------------------------
// 2. Gen Drill (Character Mode: เว้นวรรคทุกตัว)
// --------------------------------------------------------
function genDrill(chars: string, length: number = 30, style: 'block' | 'alternate' | 'random' | 'mixed' | 'anchor' = 'mixed') {
  return generatePattern(chars, length, style).join(' ');
}

// --------------------------------------------------------
// 3. Gen Words (Word Mode: สร้างคำถูกต้องตามหลักภาษาไทย)
// --------------------------------------------------------
// ✅ กฎใหม่:
// 1. คำต้องขึ้นต้นด้วยพยัญชนะเสมอ (ห้ามสระลอย)
// 2. พยัญชนะ 1 ตัว มีสระ/วรรณยุกต์เกาะได้ไม่เกิน 2 ตัว
// 3. ความยาวคำ 3-5 ตัวอักษร
// 4. เว้นวรรค 1 เคาะ
function genWords(
  chars: string,
  length: number = 40,
  style: 'block' | 'alternate' | 'random' | 'mixed' | 'anchor' = 'mixed',
  spacing: 'equal' | 'variable' | 'literal' = 'variable'
) {

  // ✅ 1. เช็คเงื่อนไขจากที่คุณใส่มาเอง (Manual Trigger)
  // ถ้าสั่ง spacing: "literal" -> คืนค่าข้อความนั้นไปเลยจ้า (จบงานทันที)
  if (spacing === 'literal') {
    return chars;
  }
  // 1. แยกกอง พยัญชนะ vs สระ
  const isThaiTone = (c: string) => /[ัิีึืฺุู็่้๊๋์ํ]/.test(c);

  const allChars = chars.split('');
  const consonants = allChars.filter(c => !isThaiTone(c));
  const vowels = allChars.filter(c => isThaiTone(c));

  if (consonants.length === 0) {
    return generatePattern(chars, length, style).join('').substring(0, length);
  }

  let result = "";
  let currentLength = 0;

  // 🎲 ตัดสินใจตั้งแต่เริ่มเลยว่าด่านนี้จะเป็น "สายไล่ระดับ" หรือ "สายสุ่ม 3-5"
  // (ใช้เฉพาะกรณี spacing === 'equal')
  const isEqualModeProgressive = Math.random() > 0.5; // 50-50

  let progressiveLen = 1; // ตัวนับสำหรับสายไล่ระดับ

  while (currentLength < length) {

    // A. กำหนดความยาวคำ (Target Length)
    let targetWordLen = 3;

    if (spacing === 'variable') {
      // ✅ Variable: สุ่ม 2 ถึง 5 ตัว
      targetWordLen = Math.floor(Math.random() * 4) + 2;
    } else {
      // ✅ Equal: ดูผลการเสี่ยงดวงที่ทำไว้ตอนต้น
      if (isEqualModeProgressive) {
        // แบบที่ 1: ไล่ระดับ 1 -> 5 ทั้งด่าน
        targetWordLen = progressiveLen;
        progressiveLen++;
        if (progressiveLen > 5) progressiveLen = 1;
      } else {
        // แบบที่ 2: สุ่ม 3-5 ตัว ทั้งด่าน
        targetWordLen = Math.floor(Math.random() * 3) + 3;
      }
    }

    let currentWord = "";

    // B. สร้างคำ (Logic ภาษาไทยเดิม)
    while (currentWord.length < targetWordLen) {

      const c = consonants[Math.floor(Math.random() * consonants.length)];
      currentWord += c;

      if (vowels.length > 0 && currentWord.length < targetWordLen) {
        if (Math.random() > 0.4) {
          const slotsLeft = targetWordLen - currentWord.length;
          const maxVowels = Math.min(2, slotsLeft);

          if (maxVowels > 0) {
            const vowelCount = Math.floor(Math.random() * maxVowels) + 1;
            for (let k = 0; k < vowelCount; k++) {
              const v = vowels[Math.floor(Math.random() * vowels.length)];
              currentWord += v;
            }
          }
        }
      }
    }

    result += currentWord;
    currentLength += currentWord.length;

    // C. เติมเว้นวรรค 1 ทีเสมอ
    if (currentLength < length) {
      result += " ";
      currentLength++;
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
        content: genWords("่ด", 30, "block", "equal"), // ่ เป็นเหย้าอยู่แล้ว
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
        content: genDrill("่ีด", 20, "anchor"), // ี คู่กับ ่ (เหย้า)
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
        content: genWords("่ัดา", 30, "anchor", "equal"), // ั คู่กับ ่
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
        content: genDrill("่้ด", 20, "anchor"), // ้ คู่กับ ่
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
        content: genDrill("่ืด", 20, "anchor"), // ื คู่กับ ่
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
        mode: "word", content: genWords("ะัดาเ้ิื", 45, "mixed", "equal")
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
        content: genDrill("่ือ", 20, "anchor"), // ่ื ่ื
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
        content: genWords("ด่อืิ", 30, "anchor", "equal") // ดอ ่ื ดอ ่ื
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
        content: genDrill("พ", 20, "anchor"),
        newKeys: ["ุ"]
      },
      {
        slug: "bottom-row-words-mue-thue",
        title: "ฝึกปุ่ม สระอึ",
        mode: "word",
        content: genWords("่ึา", 30, "anchor", "variable"),
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
        content: genWords("ุ่ึกา", 30, "mixed", "equal")
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
  // บทที่ 1: คำไทยใช้บ่อย (Common Thai Words)
  // ============================================================
  {
    title: "คำไทยใช้บ่อย",
    subLessons: [
      {
        slug: "shift-top-left-tones",
        title: "คำสรรพนาม",
        mode: "word",
        content: genWords("ฉันและเธอรักเขา เราและนายต่างคนต่างไป ท่านพี่กับน้องสาว มันเป็นเรื่องจริง ผมกับคุณคือเพื่อนกัน", 0, "mixed", "literal")
      },
      {
        slug: "shift-words-tones",
        title: "กริยาพื้นฐาน",
        mode: "word",
        content: genWords("กินข้าวแล้วก็นอน นั่งฟังเพลงสบายใจ พูดคุยเรื่องเก่า เดินเล่นในสวน อ่านหนังสือพิมพ์ เขียนจดหมายหาเพื่อน", 0, "mixed", "literal")
      },
      {
        slug: "shift-top-left-hard-chars",
        title: "คำขยายความ",
        mode: "word",
        content: genWords("บ้านหลังใหญ่มาก รถวิ่งเร็วที่สุด แมวตัวเล็กน่ารัก อาหารอร่อยดี เสื้อผ้าใหม่สวยงาม คนแก่เดินช้า", 0, "mixed", "literal")
      },
      {
        slug: "shift-words-rue-phop",
        title: "คำเชื่อมประโยค",
        mode: "word",
        content: genWords("ฉันและเธอ หรือว่าเขา แต่เขาก็ไม่มา เพราะฝนตกหนัก ถ้าเธอไปฉันก็ไป จนกว่าจะพบกันใหม่", 0, "mixed", "literal")
      },
      {
        slug: "shift-switch-left",
        title: "คำถามทั่วไป",
        mode: "word",
        content: genWords("ใครเป็นคนทำ อะไรอยู่ในกล่อง ที่ไหนมีของขาย เมื่อไหร่จะกลับมา ทำไมถึงมาช้า ไปเที่ยวไหมหรือเปล่า", 0, "mixed", "literal")
      },
      {
        slug: "shift-words-rit",
        title: "คำระบุเวลา",
        mode: "word",
        content: genWords("วันนี้วันจันทร์ พรุ่งนี้วันอังคาร เมื่อวานฝนตก ตอนนี้กี่โมงแล้ว เดี๋ยวนี้ทันที รักกันตลอดไป", 0, "mixed", "literal")
      },
      {
        slug: "shift-pinky-left",
        title: "สถานที่ทั่วไป",
        mode: "word",
        content: genWords("บ้านของฉันอยู่ไกล โรงเรียนเลิกเรียนแล้ว ตลาดสดตอนเช้า ร้านค้าปิดทำการ ห้องน้ำสะอาด ถนนโล่งจัง", 0, "mixed", "literal")
      },
      {
        slug: "shift-words-long",
        title: "ความรู้สึก",
        mode: "word",
        content: genWords("ฉันรักเธอมาก ชอบกินไอศกรีม เกลียดคนโกหก โกรธจนหน้าแดง ดีใจที่สอบผ่าน เสียใจเรื่องเดิมๆ", 0, "mixed", "literal")
      },
      {
        slug: "shift-top-left-combined",
        title: "คำทักทาย",
        mode: "word",
        content: genWords("สวัสดีตอนเช้าครับ ขอบคุณสำหรับของขวัญ ขอโทษที่รบกวน สบายดีไหมครับ ยินดีที่ได้รู้จัก ราตรีสวัสดิ์", 0, "mixed", "literal")
      },
      {
        slug: "shift-chapter-1-test",
        title: "เครือญาติ",
        mode: "word",
        content: genWords("พ่อแม่รักลูก ปู่ย่าตายายใจดี ลุงป้าน้าอามาหา ลูกหลานกตัญญู ครอบครัวอบอุ่น พี่น้องรักกัน", 0, "mixed", "literal")
      },
      {
        slug: "adv-common-extra-1",
        title: "สีสันต่างๆ",
        mode: "word",
        content: genWords("ท้องฟ้าสีคราม ดอกกุหลาบสีแดง ใบไม้สีเขียวสด กล้วยสุกสีเหลือง ผมสีดำสนิท เสื้อสีชมพูหวาน", 0, "mixed", "literal")
      },
      {
        slug: "adv-common-extra-2",
        title: "อวัยวะร่างกาย",
        mode: "word",
        content: genWords("หัวไหล่ตูด ปากจมูกตา หูฟังเสียงเพลง มือจับปากกา เท้าเดินไปข้างหน้า หัวใจเต้นแรง", 0, "mixed", "literal")
      },
      {
        slug: "adv-common-extra-3",
        title: "ของใช้ในบ้าน",
        mode: "word",
        content: genWords("จานชามช้อนส้อม หม้อหุงข้าวไฟฟ้า แก้วน้ำใสสะอาด เตียงนอนนุ่มสบาย ผ้าห่มอุ่นจัง", 0, "mixed", "literal")
      },
      {
        slug: "adv-common-boss",
        title: "บอสคำไทยใช้บ่อย",
        mode: "word",
        content: genWords("สวัสดีวันจันทร์อันสดใส ฉันรักประเทศไทยมาก ไปกินข้าวกันไหมครับ ขอบคุณสำหรับทุกอย่าง", 0, "mixed", "literal")
      }
    ]
  },

  // ============================================================
  // บทที่ 2: คำศัพท์แป้นเหย้า
  // ============================================================
  {
    title: "คำศัพท์แป้นเหย้า",
    subLessons: [
      {
        slug: "shift-top-right-reach",
        title: "สระอาพาเพลิน",
        mode: "word",
        content: genWords("อีกาบินมา ตามหาคุณอา มาศาลาริมน้ำ ลาล่าพาม้ามา น้าสาวขายยา กานดาหน้าตาดี", 0, "mixed", "literal")
      },
      {
        slug: "shift-words-khun-nat",
        title: "แม่กกสะกดกอ",
        mode: "word",
        content: genWords("รักเธอมากไม่อยากจาก ลากกระเป๋าเดินทาง รากไม้หยั่งลึก สากกะเบือยันเรือรบ หกล้มหัวแตก", 0, "mixed", "literal")
      },
      {
        slug: "shift-top-right-middle-ring",
        title: "แม่กดสะกดดอ",
        mode: "word",
        content: genWords("กดปุ่มติดตาม ผักสดสะอาด ลดราคาสินค้า มดกัดเจ็บจัง ตลาดนัดเปิดท้าย หาดทรายสีขาว", 0, "mixed", "literal")
      },
      {
        slug: "shift-top-right-pinky",
        title: "แม่กงสะกดงอ",
        mode: "word",
        content: genWords("กางเกงขายาว ทางเดินแห่งรัก นางเอกแสนสวย บางรักซอยเก้า ฟางเส้นสุดท้าย หางเครื่องวงดนตรี", 0, "mixed", "literal")
      },
      {
        slug: "shift-words-ying-kot",
        title: "ไม้เอกเสกคำ",
        mode: "word",
        content: genWords("กิ่งก่าได้ทอง ด่าทอกันทำไม ป่าไม้ร่มรื่น ว่ากล่าวตักเตือน น่ารักน่าชัง", 0, "mixed", "literal")
      },
      {
        slug: "shift-switch-right-hard",
        title: "ไม้โทโชว์พลัง",
        mode: "word",
        content: genWords("ก้าวหน้าต่อไป คุณป้าใจดี อ้าปากกว้างๆ ห้าสิบบาท ว้าวุ่นใจจัง ม้าวิ่งเร็วมาก", 0, "mixed", "literal")
      },
      {
        slug: "shift-words-thana",
        title: "สระเอเฮฮา",
        mode: "word",
        content: genWords("เกเรไม่ดี เดินเซไปมา เทน้ำทิ้ง ทุ่มเททำงาน เวลาไม่คอยใคร ทะเลแสนงาม", 0, "mixed", "literal")
      },
      {
        slug: "shift-top-right-combined",
        title: "สระแอและแม่",
        mode: "word",
        content: genWords("แก้วน้ำแตก แฉความลับ ดูแลตัวเอง กาแฟรสเข้ม แพริมน้ำ แหจับปลา เด็กงอแง", 0, "mixed", "literal")
      },
      {
        slug: "shift-chapter-2-test",
        title: "สองพยางค์หรรษา",
        mode: "word",
        content: genWords("ดาราทีวี กากีสีฝุ่น วาจาไพเราะ ศาลาริมทาง ราคาย่อมเยา กาแฟโบราณ เวลาเที่ยงตรง", 0, "mixed", "literal")
      },
      {
        slug: "adv-home-extra-1",
        title: "สามพยางค์สร้างคำ",
        mode: "word",
        content: genWords("ภาราดาพี่ชาย วาสนาแข่งไม่ได้ สารภาพความจริง กาลเวลาพิสูจน์คน เอกลักษณ์ไทย", 0, "mixed", "literal")
      },
      {
        slug: "adv-home-extra-2",
        title: "ประโยคแป้นเหย้า",
        mode: "word",
        content: genWords("กาก้าหัวเราะฮาเฮ ดาราคนนี้หน้าตาดี หลานมาหาคุณอาที่บ้าน", 0, "mixed", "literal")
      },
      {
        slug: "adv-home-boss",
        title: "บอสแป้นเหย้า",
        mode: "word",
        content: genWords("กาลเวลาไม่เคยคอยใคร วาสนาพานพบ ดาราดังระดับโลก กาแฟหอมกรุ่นยามเช้า", 0, "mixed", "literal")
      }
    ]
  },

  // ============================================================
  // บทที่ 3: คำศัพท์แถวบน
  // ============================================================
  {
    title: "คำศัพท์แถวบน",
    subLessons: [
      {
        slug: "shift-bottom-left-index-middle",
        title: "สระอีและอือ",
        mode: "word",
        content: genWords("วันนี้วันดี ตีกลองร้องเพลง มีเงินมีทอง ปีใหม่สุขสันต์ หารือร่วมกัน มือถือเครื่องใหม่", 0, "mixed", "literal")
      },
      {
        slug: "shift-words-chan-ha",
        title: "สระอำและไอมั้ย",
        mode: "word",
        content: genWords("กำไลข้อมือ ทำการบ้าน แนะนำตัว รำวงวันสงกรานต์ ไปเที่ยวกันไหม ว่องไวทันใจ ไก่ขันตอนเช้า", 0, "mixed", "literal")
      },
      {
        slug: "shift-bottom-karan",
        title: "ไม้หันอากาศ",
        mode: "word",
        content: genWords("เรารักกัน วันจันทร์สดใส วิ่งผลัดระวังล้ม น้ำมันแพง หันหน้ามาคุยกัน ความฝันอันยิ่งใหญ่", 0, "mixed", "literal")
      },
      {
        slug: "shift-words-karan",
        title: "แม่กนคนเก่ง",
        mode: "word",
        content: genWords("กินข้าวหรือยัง นกบินบนฟ้า ก้อนหินดินทราย อดทนสู้ไป ฝนตกฟ้าร้อง คนเก่งหัวใจแกร่ง", 0, "mixed", "literal")
      },
      {
        slug: "shift-bottom-rare-chars",
        title: "แม่เกยเลยลง",
        mode: "word",
        content: genWords("ค้าขายร่ำรวย เจ็บเจียนตาย คุณยายใจดี ของหายได้คืน ลมโชยพัดเย็น โปรยทานงานบุญ", 0, "mixed", "literal")
      },
      {
        slug: "shift-words-tao",
        title: "รอเรือลอลิง",
        mode: "word",
        content: genWords("เรารักโรงเรียน ตั้งใจเรียนรู้ รถยนต์วิ่งไว ลิงจั๊กๆรักจริงๆ ลมพัดเย็นสบาย ลดละเลิกอบายมุข", 0, "mixed", "literal")
      },
      {
        slug: "shift-switch-bottom",
        title: "บอใบไม้ปอปลา",
        mode: "word",
        content: genWords("ทำบุญล้างบาป บอกเล่าเก้าสิบ ข้างบนข้างล่าง ปาเป้าเข้าวิน ไปเที่ยวทะเล เป็นวัยรุ่นมันเหนื่อย", 0, "mixed", "literal")
      },
      {
        slug: "shift-words-chan",
        title: "พอพานฟอฟัน",
        mode: "word",
        content: genWords("พาไปหาหมอ พบปะสังสรรค์ พอมีพอกิน ไฟไหม้ฟาง ฟันผุต้องอุด ภาพวาดสีน้ำมัน", 0, "mixed", "literal")
      },
      {
        slug: "shift-bottom-combined",
        title: "ไม้ม้วนใจใส",
        mode: "word",
        content: genWords("ในน้ำมีปลา เข้าใจตรงกัน น้ำใสไหลเย็น ใบไม้ร่วงหล่น สายใยผูกพัน บ้านหลังใหญ่โต ใครคนนั้น", 0, "mixed", "literal")
      },
      {
        slug: "shift-chapter-3-test",
        title: "คำควบกล้ำ",
        mode: "word",
        content: genWords("กราบพระประธาน พริกขี้หนูเผ็ด ปรับปรุงเปลี่ยนแปลง กลมเกลียวกัน กลืนไม่เข้าคายไม่ออก", 0, "mixed", "literal")
      },
      {
        slug: "adv-top-extra-1",
        title: "คำที่มีตัวการันต์",
        mode: "word",
        content: genWords("สวนสัตว์ดุสิต ยักษ์ใหญ่วิ่งไล่ วันศุกร์สุขสันต์ วันเสาร์เหงาใจ ดวงอาทิตย์ตก ดวงจันทร์วันเพ็ญ", 0, "mixed", "literal")
      },
      {
        slug: "adv-top-extra-2",
        title: "วลีแถวบน",
        mode: "word",
        content: genWords("ไปไหนมาครับ กินข้าวกันเถอะ วันพระไม่ได้มีหนเดียว วันเพ็ญเดือนสิบสอง", 0, "mixed", "literal")
      },
      {
        slug: "adv-top-extra-3",
        title: "ประโยคสั้น",
        mode: "word",
        content: genWords("ฉันรักกินไก่ทอดหาดใหญ่ เราไปเที่ยวทะเลกันเถอะนะ", 0, "mixed", "literal")
      },
      {
        slug: "adv-top-extra-4",
        title: "ประโยคยาว",
        mode: "word",
        content: genWords("วันนี้วันดีปีใหม่ท้องฟ้าแจ่มใสพาใจสุขบาน สำราญเริงร่า", 0, "mixed", "literal")
      },
      {
        slug: "adv-top-boss",
        title: "บอสแถวบน",
        mode: "word",
        content: genWords("ทานข้าวเย็นหรือยัง วันนี้อากาศดีจังเลยนะ ไปทำบุญวันพระที่วัดกันเถอะ", 0, "mixed", "literal")
      }
    ]
  },

  // ============================================================
  // บทที่ 4: คำศัพท์แถวล่าง
  // ============================================================
  {
    title: "คำศัพท์แถวล่าง",
    subLessons: [
      {
        slug: "shift-middle-left-index-middle",
        title: "สระแอและแมว",
        mode: "word",
        content: genWords("แม่แมวดูแลลูก แฉความลับ แถจนสีข้างถลอก ล่องแพไม้ไผ่ ดูแลสุขภาพ แหจับปลาในน้ำ", 0, "mixed", "literal")
      },
      {
        slug: "shift-words-oh-bo",
        title: "สระอิชิมดู",
        mode: "word",
        content: genWords("นกบินกลับรัง ก้อนหินดินทราย ช่วงชิงชัยชนะ ลิงกินกล้วย ยิงปืนนัดเดียว ทิ้งขยะให้ลงถัง", 0, "mixed", "literal")
      },
      {
        slug: "shift-middle-right-ring-pinky",
        title: "สระอูดูงู",
        mode: "word",
        content: genWords("ดูหนังฟังเพลง ปูนาขาเก งูเลื้อยเข้าบ้าน หูฟังไร้สาย รูระบายน้ำ ถูบ้านสะอาด ชูมือขึ้นฟ้า", 0, "mixed", "literal")
      },
      {
        slug: "shift-words-sueksa",
        title: "ทอทหารมอมา",
        mode: "word",
        content: genWords("ทำดีได้ดี ทาครีมกันแดด ทุบหม้อข้าว เทน้ำเทท่า มาหาหน่อยสิ มีเงินมีทอง ขี่ม้าส่งเมือง", 0, "mixed", "literal")
      },
      {
        slug: "shift-switch-middle-1",
        title: "ผอผึ้งฝอฝา",
        mode: "word",
        content: genWords("ผีหลอกวิญญาณหลอน หน้าผาสูงชัน ผักสวนครัว ผมยาวสลวย มีไฝที่ปาก ฝาหม้อข้าว ฝนตกหนัก", 0, "mixed", "literal")
      },
      {
        slug: "shift-words-osot",
        title: "อออ่างฮอนกฮูก",
        mode: "word",
        content: genWords("คุณอาใจดี อีกาตาแดง อูฐอยู่ในทะเลทราย เอเอฟเค ฮาฮ่าฮ่า ฮิฮิฮุฮุ โฮร่องไห้", 0, "mixed", "literal")
      },
      {
        slug: "shift-switch-middle-2",
        title: "แม่กมชมเชย",
        mode: "word",
        content: genWords("กามเทพแผลงศร เดินตามผู้ใหญ่ สอบถามเส้นทาง มียามเฝ้าหน้าบ้าน ชิมอาหารอร่อย ยิ้มแย้มแจ่มใส", 0, "mixed", "literal")
      },
      {
        slug: "shift-words-chan-sorn",
        title: "สระเอือเรือใบ",
        mode: "word",
        content: genWords("พายเรือในอ่าง เสือซ่อนเล็บ เจือจางลงไป เผื่อแผ่ผู้อื่น เมื่อไหร่จะมา เบื่ออาหารจัง", 0, "mixed", "literal")
      },
      {
        slug: "shift-middle-combined",
        title: "สระอัววัวตัว",
        mode: "word",
        content: genWords("ตัวใครตัวมัน เจ็บหัวปวดตับ วัวหายล้อมคอก บัวแล้งน้ำ กลัวผีหลอก ครัวไทยสู่ครัวโลก", 0, "mixed", "literal")
      },
      {
        slug: "shift-chapter-4-test",
        title: "คำผสมแถวล่าง",
        mode: "word",
        content: genWords("ดอกมะลิซ้อน กะทิชาวเกาะ ทะเลสีคราม เวลาเป็นเงินเป็นทอง นาทีทอง สมาธิสั้น", 0, "mixed", "literal")
      },
      {
        slug: "adv-bottom-boss",
        title: "บอสแถวล่าง",
        mode: "word",
        content: genWords("แมวขโมยกินปลาทู แม่ไปซื้อของที่ตลาดนัด ขอให้มีความสุขมากๆ นะครับ", 0, "mixed", "literal")
      }
    ]
  },

  // ============================================================
  // บทที่ 5: เครื่องหมายพื้นฐาน
  // ============================================================
  {
    title: "เครื่องหมายพื้นฐาน",
    subLessons: [
      {
        slug: "shift-vertical-switch",
        title: "ไม้ยมก",
        mode: "word",
        content: genWords("เดินดีๆ ระวังล้ม วิ่งเร็วๆ หน่อย แต่งตัวสวยๆ คนเก่งๆ หายาก รวยๆ เฮงๆ เด็กๆ กำลังเล่น", 0, "mixed", "literal")
      },
      {
        slug: "shift-words-ruek",
        title: "ไม้ยมกในประโยค",
        mode: "word",
        content: genWords("เดินไปๆ มาๆ น่าเวียนหัว พูดๆ ไปเถอะไม่มีใครฟัง กินๆ นอนๆ จนอ้วน ทำงานงกๆ", 0, "mixed", "literal")
      },
      {
        slug: "shift-horizontal-switch",
        title: "ไปยาลน้อย",
        mode: "word",
        content: genWords("กรุงเทพฯ เมืองหลวง โปรดเกล้าฯ แต่งตั้ง ทูลเกล้าฯ ถวาย ข้าฯ ขอสัญญา ฯพณฯ ท่าน", 0, "mixed", "literal")
      },
      {
        slug: "shift-words-yart",
        title: "มหัพภาคหรือจุด",
        mode: "word",
        content: genWords("เดือน ต.ค. และ ม.ค. พุทธศักราช พ.ศ. ส่ง จ.ม. ถึงเธอ น.ส. ใจดี ด.ช. รักเรียน ร.ร. ของเราน่าอยู่", 0, "mixed", "literal")
      },
      {
        slug: "thai-numbers-1-5",
        title: "จุลภาคหรือลูกน้ำ",
        mode: "word",
        content: genWords("นับหนึ่ง, สอง, สาม แม่สีมี แดง, เขียว, เหลือง ข้อสอบชุด ก, ข, ค", 0, "mixed", "literal")
      },
      {
        slug: "thai-numbers-words-1",
        title: "อัญประกาศ",
        mode: "word",
        content: genWords("เขากล่าวว่า \"สวัสดีครับ\" เธอพูดว่า \"ขอบคุณค่ะ\" แม่บอก \"รักนะ\" ป้ายเขียนว่า \"ห้ามเข้า\"", 0, "mixed", "literal")
      },
      {
        slug: "thai-numbers-6-0",
        title: "นขลิขิตหรือวงเล็บ",
        mode: "word",
        content: genWords("ข้อ (ก) ถูกทุกข้อ (ข) ผิดบางข้อ (หมายเหตุ) โปรดระมัดระวัง (อ่านว่า) มะ-นุ้ด", 0, "mixed", "literal")
      },
      {
        slug: "thai-numbers-words-2",
        title: "ยัติภังค์",
        mode: "word",
        content: genWords("รถไฟสาย กรุงเทพ-เชียงใหม่ เสื้อลาย แดง-ดำ เปิดทำการ วัน-เวลา ราชการ หน้า-หลัง", 0, "mixed", "literal")
      },
      {
        slug: "thai-numbers-combined",
        title: "เครื่องหมายทับ",
        mode: "word",
        content: genWords("บ้านเลขที่ 123/4 ชั้น 5 ห้อง 6 ป.6/1 อำเภอ/เขต", 0, "mixed", "literal")
      },
      {
        slug: "shift-chapter-5-test",
        title: "ผสมเครื่องหมาย",
        mode: "word",
        content: genWords("เรื่องนี้เกิดขึ้นจริงๆ นะ (เขาบอกมาแบบนั้น) \"ไปเที่ยวกันเถอะ\" เส้นทาง กรุงเทพฯ-พัทยา", 0, "mixed", "literal")
      },
      {
        slug: "adv-punc-extra-1",
        title: "เครื่องหมายตกใจ",
        mode: "word",
        content: genWords("โอ้โห! สวยจังเลย ระวัง! รถชน ช่วยด้วย! ขโมย ดีใจจัง! สอบผ่านแล้ว สุดยอด! ไปเลย", 0, "mixed", "literal")
      },
      {
        slug: "adv-punc-extra-2",
        title: "เครื่องหมายคำถาม",
        mode: "word",
        content: genWords("เรื่องจริงเหรอ? ใครเป็นคนทำ? ที่ไหนมีขาย? เมื่อไหร่จะมา? ทำไมถึงทำแบบนี้?", 0, "mixed", "literal")
      },
      {
        slug: "adv-punc-boss",
        title: "บอสเครื่องหมาย",
        mode: "word",
        content: genWords("เด็กๆ เล่นกันสนุกสนาน \"ระวังตัวด้วยนะลูก\" กรุงเทพฯ เป็นเมืองหลวงของไทย", 0, "mixed", "literal")
      }
    ]
  },

  // ============================================================
  // บทที่ 6: เครื่องหมายขั้นสูง
  // ============================================================
  {
    title: "เครื่องหมายขั้นสูง",
    subLessons: [
      {
        slug: "shift-speed-drill-1",
        title: "ตัวการันต์",
        mode: "word",
        content: genWords("วันเสาร์และวันอาทิตย์ ดวงจันทร์วันเพ็ญ สวนสัตว์เปิด ยักษ์เขียวจอมพลัง รักษาสิทธิ์ของตน", 0, "mixed", "literal")
      },
      {
        slug: "formal-words-law",
        title: "ไม้ไต่คู้",
        mode: "word",
        content: genWords("ก็เป็นอย่างนั้นแหละ เห็นกันอยู่หลัดๆ น้ำแข็งเย็นเฉียบ รถเข็นขายของ เก็งกำไรทองคำ เป็ดพะโล้", 0, "mixed", "literal")
      },
      {
        slug: "shift-speed-drill-2",
        title: "คำทับศัพท์",
        mode: "word",
        content: genWords("คอมพิวเตอร์สมัยใหม่ ท่องโลกอินเทอร์เน็ต เข้าชมเว็บไซต์ เช็คอีเมลทุกวัน อัปเดตซอฟต์แวร์", 0, "mixed", "literal")
      },
      {
        slug: "formal-words-org",
        title: "ตัวฤาตัวฦา",
        mode: "word",
        content: genWords("ฤดูฝนชุ่มฉ่ำ ฤษีบำเพ็ญเพียร พฤกษานานาพันธุ์ มีฤทธิ์เดช นฤมลคนสวย ประเทศอังกฤษ", 0, "mixed", "literal")
      },
      {
        slug: "shift-symbols-drill",
        title: "หญิงใหญ่ฐาน",
        mode: "word",
        content: genWords("ผู้หญิงคนนั้น บ้านหลังใหญ่ หญ้าขึ้นรก เจริญก้าวหน้า ขอเชิญร่วมงาน ปัญหาเชาว์ ฐานทัพเรือ", 0, "mixed", "literal")
      },
      {
        slug: "formal-words-bkk",
        title: "ฎาฏัก",
        mode: "word",
        content: genWords("กฎกติกา กบฏแผ่นดิน ปรากฏกาย มงกุฎดอกส้ม ราษฎรเต็มขั้น กฎหมายตราสามดวง เดือนกรกฎาคม", 0, "mixed", "literal")
      },
      {
        slug: "formal-sentence-1",
        title: "เฌอผู้เฒ่า",
        mode: "word",
        content: genWords("น้องเฌอเอม ผู้เฒ่าเล่านิทาน พัฒนาชนบท วัฒนธรรมไทย ตราครุฑพ่าห์ บัณฑิตจบใหม่ นางมณโฑ", 0, "mixed", "literal")
      },
      {
        slug: "formal-sentence-2",
        title: "เครื่องหมายคำนวณ",
        mode: "word",
        content: genWords("บวก ลบ คูณ หาร ผลลัพธ์เท่ากับ ห้าสิบเปอร์เซ็นต์", 0, "mixed", "literal")
      },
      {
        slug: "formal-sentence-3",
        title: "ไปยาลใหญ่",
        mode: "word",
        content: genWords("ผลไม้ไทยมี เงาะ ทุเรียน มังคุด ฯลฯ สัตว์เลี้ยงมี หมา แมว นก ฯลฯ", 0, "mixed", "literal")
      },
      {
        slug: "formal-sentence-4",
        title: "บอสเครื่องหมายยาก",
        mode: "word",
        content: genWords("วันจันทร์ที่ทำการไปรษณีย์หยุด ฤดูฝนอากาศมักจะเย็นชื้น เรื่องแบบนี้ก็เป็นได้เสมอ", 0, "mixed", "literal")
      }
    ]
  },

  // ============================================================
  // บทที่ 7: ประโยคความเร็ว
  // ============================================================
  {
    title: "ประโยคความเร็ว",
    subLessons: [
      {
        slug: "advanced-final-warmup",
        title: "ประโยคบอกเล่า",
        mode: "word",
        content: genWords("ฉันชื่อสมชาย ยินดีที่ได้รู้จักครับ เธอชื่ออะไรบอกได้ไหม วันนี้อากาศแจ่มใส ฝนไม่ตกเลยสักนิด", 0, "mixed", "literal")
      },
      {
        slug: "advanced-final-royal-words",
        title: "ประโยคคำถาม",
        mode: "word",
        content: genWords("คุณกินข้าวเช้าหรือยังครับ จะออกไปข้างนอกไหม ทำงานเสร็จหรือยังครับ ง่วงนอนแล้วใช่ไหม", 0, "mixed", "literal")
      },
      {
        slug: "advanced-final-proper-names",
        title: "ประโยคปฏิเสธ",
        mode: "word",
        content: genWords("ฉันไม่รู้อะไรเลยจริงๆ เรื่องนี้ไม่ใช่ความจริงแน่นอน ผมไม่ได้ทำผิดนะครับ ไม่เอาไม่พูดเรื่องนี้", 0, "mixed", "literal")
      },
      {
        slug: "advanced-final-essay-1",
        title: "ประโยคขอร้อง",
        mode: "word",
        content: genWords("ช่วยหยิบของให้หน่อยได้ไหม ขอทางเดินหน่อยครับ กรุณาถอดรองเท้าก่อนเข้าห้อง", 0, "mixed", "literal")
      },
      {
        slug: "advanced-final-essay-2",
        title: "สำนวนไทย",
        mode: "word",
        content: genWords("ไก่งามเพราะขน คนงามเพราะแต่ง น้ำขึ้นให้รีบตัก รักวัวให้ผูกรักลูกให้ตี", 0, "mixed", "literal")
      },
      {
        slug: "advanced-final-essay-3",
        title: "คำคมสอนใจ",
        mode: "word",
        content: genWords("ความพยายามอยู่ที่ไหน ความสำเร็จอยู่ที่นั่นเสมอ อย่ายอมแพ้ต่ออุปสรรค", 0, "mixed", "literal")
      },
      {
        slug: "advanced-final-essay-4",
        title: "เพลงชาติไทย",
        mode: "word",
        content: genWords("ประเทศไทยรวมเลือดเนื้อชาติเชื้อไทย เป็นประชารัฐ ไผทของไทยทุกส่วน", 0, "mixed", "literal")
      },
      {
        slug: "advanced-final-poem",
        title: "บทสนทนา",
        mode: "word",
        content: genWords("ฮัลโหล สวัสดีครับ สบายดีไหมครับ ผมสบายดีครับ แล้วคุณล่ะครับ ก็เรื่อยๆ นะครับช่วงนี้", 0, "mixed", "literal")
      },
      {
        slug: "advanced-final-the-end",
        title: "ประโยคลิ้นพัน",
        mode: "word",
        content: genWords("เช้าฟาดผัดฟัก เย็นฟาดฟักผัด ยานัดหมอมีแก้ฝีแก้หิด ระนองระยองยะลา", 0, "mixed", "literal")
      },
      {
        slug: "advanced-final-bonus",
        title: "ข่าวสั้นทันโลก",
        mode: "word",
        content: genWords("ราคาทองคำวันนี้ปรับตัวสูงขึ้นอย่างต่อเนื่อง การจราจรติดขัดเนื่องจากฝนตกหนัก", 0, "mixed", "literal")
      },
      {
        slug: "adv-quick-extra-1",
        title: "ลิ้นพันระดับสอง",
        mode: "word",
        content: genWords("กาก้ากิกี้กููกู เดินดีดีเดี๋ยวล้ม ยายกินลำไยน้ำลายยายไหลย้อยเลอะเสื้อ", 0, "mixed", "literal")
      },
      {
        slug: "adv-quick-extra-2",
        title: "ลิ้นพันระดับสาม",
        mode: "word",
        content: genWords("หมูหมึกกุ้งหุงอุ่นตุ๋นต้มนึ่ง ใครขายไข่ไก่ ยานัดหมอมีแก้ฝีแก้หิด ยานัดหมอชิตแก้หิดแก้ฝี", 0, "mixed", "literal")
      },
      {
        slug: "adv-quick-extra-3",
        title: "คำขวัญ",
        mode: "word",
        content: genWords("เด็กเอ๋ยเด็กดี ต้องมีหน้าที่สิบอย่างด้วยกัน หนึ่งนับถือศาสนา สองรักษาธรรมเนียมมั่น", 0, "mixed", "literal")
      },
      {
        slug: "adv-quick-extra-4",
        title: "กลอนสั้น",
        mode: "word",
        content: genWords("แล้วสอนว่าอย่าไว้ใจมนุษย์ มันแสนสุดลึกล้ำเหลือกำหนด ถึงเถาวัลย์พันเกี่ยวที่เลี้ยวลด", 0, "mixed", "literal")
      },
      {
        slug: "adv-quick-extra-5",
        title: "ปรัชญาชีวิต",
        mode: "word",
        content: genWords("ระยะทางพิสูจน์ม้า กาลเวลาพิสูจน์คน ความดีไม่มีขาย อยากได้ต้องทำเอง", 0, "mixed", "literal")
      },
      {
        slug: "adv-quick-boss",
        title: "บอสประโยคความเร็ว",
        mode: "word",
        content: genWords("ขอให้ทุกคนมีความสุขกับการฝึกพิมพ์ดีด และเก่งขึ้นทุกวัน พยายามเข้านะครับ", 0, "mixed", "literal")
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