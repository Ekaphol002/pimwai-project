import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { toDateKey } from '@/lib/streakUtils';

let isTableEnsured = false;

async function ensureProgressTable() {
    if (isTableEnsured) return;
    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "CodeTypingProgress" (
                "userId" TEXT PRIMARY KEY,
                "selectedSnippetId" TEXT NOT NULL DEFAULT 'react-hook',
                "activeWordIdx" INTEGER NOT NULL DEFAULT 0,
                "inputBuffer" TEXT NOT NULL DEFAULT '',
                "typedWordsJson" TEXT NOT NULL DEFAULT '{}',
                "todayDateKey" TEXT NOT NULL DEFAULT '',
                "todayTimeSeconds" INTEGER NOT NULL DEFAULT 0,
                "totalTimeSeconds" INTEGER NOT NULL DEFAULT 0,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);
        isTableEnsured = true;
    } catch (error) {
        console.error('Error ensuring CodeTypingProgress table:', error);
    }
}

// GET: ดึงเวลาพิมพ์โค้ดของวันนี้ และความคืบหน้าล่าสุดของโค้ดที่พิมพ์ค้างไว้ในรหัสผู้เล่น
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        await ensureProgressTable();

        const rows = await prisma.$queryRawUnsafe<any[]>(
            `SELECT "selectedSnippetId", "activeWordIdx", "inputBuffer", "typedWordsJson", "todayDateKey", "todayTimeSeconds", "totalTimeSeconds", "updatedAt"
             FROM "CodeTypingProgress" WHERE "userId" = $1 LIMIT 1`,
            user.id
        );

        const currentTodayKey = toDateKey(new Date());

        if (!rows || rows.length === 0) {
            return NextResponse.json({
                success: true,
                progress: null,
                todayTimeSeconds: 0,
                totalTimeSeconds: 0
            });
        }

        const row = rows[0];
        const isSameDay = row.todayDateKey === currentTodayKey;
        const todayTimeSeconds = isSameDay ? Number(row.todayTimeSeconds) || 0 : 0;
        const totalTimeSeconds = Number(row.totalTimeSeconds) || 0;

        let typedWordsHistory = {};
        try {
            if (row.typedWordsJson) {
                typedWordsHistory = JSON.parse(row.typedWordsJson);
            }
        } catch {
            typedWordsHistory = {};
        }

        return NextResponse.json({
            success: true,
            todayTimeSeconds,
            totalTimeSeconds,
            progress: {
                selectedSnippetId: row.selectedSnippetId || 'react-hook',
                activeWordIdx: Number(row.activeWordIdx) || 0,
                inputBuffer: row.inputBuffer || '',
                typedWordsHistory,
                updatedAt: row.updatedAt
            }
        });
    } catch (error: any) {
        console.error('Failed to fetch code progress:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
    }
}

// POST: บันทึกเวลาพิมพ์โค้ดวันนี้ และเซฟตำแหน่งโค้ดล่าสุดที่พิมพ์ค้างไว้ในรหัสผู้เล่น
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        await ensureProgressTable();

        const body = await request.json();
        const {
            selectedSnippetId,
            activeWordIdx,
            inputBuffer,
            typedWordsHistory,
            todayTimeSeconds,
            addedSeconds
        } = body;

        const currentTodayKey = toDateKey(new Date());

        // ดึงข้อมูลเดิมก่อนเพื่อคำนวณเวลาวันนี้และเวลารวมให้ไม่ลดลงแม้สลับคอม
        const existingRows = await prisma.$queryRawUnsafe<any[]>(
            `SELECT "selectedSnippetId", "activeWordIdx", "inputBuffer", "typedWordsJson", "todayDateKey", "todayTimeSeconds", "totalTimeSeconds"
             FROM "CodeTypingProgress" WHERE "userId" = $1 LIMIT 1`,
            user.id
        );

        const existing = existingRows?.[0];
        const prevTodaySec = (existing && existing.todayDateKey === currentTodayKey)
            ? (Number(existing.todayTimeSeconds) || 0)
            : 0;
        const prevTotalSec = existing ? (Number(existing.totalTimeSeconds) || 0) : 0;

        const safeAddedSec = Math.max(0, Math.min(600, Math.round(Number(addedSeconds) || 0)));
        const clientTodaySec = Math.max(0, Math.round(Number(todayTimeSeconds) || 0));

        // ใช้ค่าสูงสุดระหว่าง (เวลาเดิมบนเซิร์ฟเวอร์ + เวลาที่พิมพ์เพิ่มรอบนี้) กับ เวลาที่ส่งมาจากเครื่อง เพื่อไม่ให้เวลาหายตอนสลับคอม
        const nextTodaySec = Math.max(prevTodaySec + safeAddedSec, clientTodaySec);
        const deltaSec = Math.max(0, nextTodaySec - prevTodaySec);
        const nextTotalSec = prevTotalSec + deltaSec;

        const nextSnippetId = typeof selectedSnippetId === 'string' && selectedSnippetId.trim()
            ? selectedSnippetId.trim()
            : (existing?.selectedSnippetId || 'react-hook');

        const nextActiveWordIdx = typeof activeWordIdx === 'number' && activeWordIdx >= 0
            ? Math.round(activeWordIdx)
            : (Number(existing?.activeWordIdx) || 0);

        const nextInputBuffer = typeof inputBuffer === 'string'
            ? inputBuffer.slice(0, 200)
            : (existing?.inputBuffer || '');

        let nextTypedWordsJson = existing?.typedWordsJson || '{}';
        if (typedWordsHistory && typeof typedWordsHistory === 'object') {
            try {
                nextTypedWordsJson = JSON.stringify(typedWordsHistory);
            } catch {
                // fallback to existing
            }
        }

        await prisma.$executeRawUnsafe(
            `INSERT INTO "CodeTypingProgress" (
                "userId", "selectedSnippetId", "activeWordIdx", "inputBuffer", "typedWordsJson",
                "todayDateKey", "todayTimeSeconds", "totalTimeSeconds", "updatedAt"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            ON CONFLICT ("userId") DO UPDATE SET
                "selectedSnippetId" = EXCLUDED."selectedSnippetId",
                "activeWordIdx" = EXCLUDED."activeWordIdx",
                "inputBuffer" = EXCLUDED."inputBuffer",
                "typedWordsJson" = EXCLUDED."typedWordsJson",
                "todayDateKey" = EXCLUDED."todayDateKey",
                "todayTimeSeconds" = EXCLUDED."todayTimeSeconds",
                "totalTimeSeconds" = EXCLUDED."totalTimeSeconds",
                "updatedAt" = NOW()`,
            user.id,
            nextSnippetId,
            nextActiveWordIdx,
            nextInputBuffer,
            nextTypedWordsJson,
            currentTodayKey,
            nextTodaySec,
            nextTotalSec
        );

        return NextResponse.json({
            success: true,
            todayTimeSeconds: nextTodaySec,
            totalTimeSeconds: nextTotalSec,
            selectedSnippetId: nextSnippetId,
            activeWordIdx: nextActiveWordIdx
        });
    } catch (error: any) {
        console.error('Failed to save code progress:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
    }
}

