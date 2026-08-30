// lib/profanityFilter.ts

const BAD_WORDS_TH = [
    // คำหยาบภาษาไทยทั่วไป / คำด่า / อวัยวะเพศ / ลามก
    'ควย', 'เย็ด', 'เหี้ย', 'สัส', 'ไอ้สัส', 'อีดอก', 'อีเหี้ย', 'กู', 'มึง',
    'จิ๋ม', 'หี', 'แตด', 'ดอ', 'ไอ้เหี้ย', 'ไอ้ควย', 'อีควาย', 'ควาย', 'ส้นตีน',
    'ชาติหมา', 'สันดาน', 'พ่อมึงตาย', 'แม่มึงตาย', 'เงี่ยน', 'อมควย', 'เย็ดแม่',
    'หน้าด้าน', 'ระยำ', 'จัญไร', 'ดอกทอง', 'กะหรี่', 'เสือก', 'ตอแหล', 'แม่ง'
];

const BAD_WORDS_EN = [
    'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'pussy', 'nigger', 'nigga',
    'fucker', 'motherfucker', 'whore', 'slut', 'porn', 'cock', 'fag', 'faggot',
    'bastard', 'penis', 'vagina', 'tits', 'boobs'
];

// ฟังก์ชันแปลงข้อความเลี่ยงบาลี (เช่น ค ว ย -> ควย, f u c k -> fuck, k u a y -> kuay)
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[\s\-_.\+@#!$%^&*()~`=\[\]{};:'",<>/?\\|]/g, '') // ลบอักขระพิเศษและช่องว่าง
        .replace(/0/g, 'o')
        .replace(/1/g, 'i')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/5/g, 's')
        .replace(/7/g, 't')
        .replace(/8/g, 'b');
}

export function containsProfanity(text: string): { isBad: boolean; matchedWord?: string } {
    if (!text) return { isBad: false };

    const lower = text.toLowerCase();
    const normalized = normalizeText(text);

    // ตรวจสอบคำภาษาไทย
    for (const word of BAD_WORDS_TH) {
        if (lower.includes(word) || normalized.includes(word)) {
            return { isBad: true, matchedWord: word };
        }
    }

    // ตรวจสอบคำภาษาอังกฤษ
    for (const word of BAD_WORDS_EN) {
        // ใช้ regex เช็คทั้งคำหรือส่วนของคำ
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(text) || normalized.includes(word)) {
            return { isBad: true, matchedWord: word };
        }
    }

    return { isBad: false };
}
