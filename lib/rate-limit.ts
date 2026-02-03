
import { NextResponse } from "next/server";

interface RateLimitStore {
    [ip: string]: {
        count: number;
        lastReset: number;
    };
}

const store: RateLimitStore = {};

const WINDOW_SIZE_MS = 60 * 1000; // 1 Minute
const MAX_REQUESTS = 10; // Max 10 requests per minute

/**
 * ฟังก์ชันเช็ค Rate Limit แบบง่าย (In-Memory)
 * หมายเหตุ: ถ้า Server Restart หรือเป็น Serverless แบบ Function แยก ข้อมูลอาจจะไม่แชร์กันเป๊ะๆ
 * แต่เพียงพอสำหรับกันสแปมระดับเบื้องต้น
 */
export function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = store[ip];

    // ถ้าไม่มี record หรือหมดเวลา window แล้ว -> รีเซ็ตใหม่
    if (!record || now - record.lastReset > WINDOW_SIZE_MS) {
        store[ip] = {
            count: 1,
            lastReset: now,
        };
        return true; // ผ่าน
    }

    // ถ้ายังอยู่ใน window เดียวกัน
    if (record.count >= MAX_REQUESTS) {
        return false; // ไม่ผ่าน (เกินลิมิต)
    }

    // เพิ่ม count
    record.count += 1;
    return true; // ผ่าน
}

/**
 * ทำความสะอาด Memory ที่ไม่ได้ใช้ (Optional: เรียกใช้เป็นระยะหรือทุกครั้ง)
 */
export function cleanupRateLimitValues() {
    const now = Date.now();
    for (const ip in store) {
        if (now - store[ip].lastReset > WINDOW_SIZE_MS) {
            delete store[ip];
        }
    }
}
