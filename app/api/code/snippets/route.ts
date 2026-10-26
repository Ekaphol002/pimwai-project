import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET: ดึง Snippets ที่ผู้ใช้คนนั้นบันทึกไว้ในบัญชี
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized', snippets: [] }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found', snippets: [] }, { status: 404 });
        }

        const rows = await prisma.$queryRawUnsafe<any[]>(
            `SELECT id, title, language, code, "createdAt", "updatedAt" FROM "CodeSnippet" WHERE "userId" = $1 ORDER BY "createdAt" DESC`,
            user.id
        );

        const snippets = rows.map(r => ({
            id: r.id,
            title: r.title,
            language: r.language,
            code: r.code,
            isCustom: true,
            createdAt: r.createdAt
        }));

        return NextResponse.json({ success: true, snippets });
    } catch (error: any) {
        console.error('Failed to fetch code snippets:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal error', snippets: [] }, { status: 500 });
    }
}

// POST: บันทึก Snippet ลงในฐานข้อมูลของบัญชีผู้ใช้
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

        const body = await request.json();
        const { id, title, language, code } = body;

        if (!title || !title.trim() || !code || !code.trim()) {
            return NextResponse.json({ success: false, error: 'Missing title or code' }, { status: 400 });
        }

        const snippetId = id && !id.startsWith('custom-') ? id : `cs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const cleanLanguage = language?.trim() || 'TypeScript';
        const cleanCode = code.replace(/\r\n/g, '\n');

        await prisma.$executeRawUnsafe(
            `INSERT INTO "CodeSnippet" (id, "userId", title, language, code, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
             ON CONFLICT (id) DO UPDATE 
             SET title = EXCLUDED.title, language = EXCLUDED.language, code = EXCLUDED.code, "updatedAt" = NOW()`,
            snippetId,
            user.id,
            title.trim(),
            cleanLanguage,
            cleanCode
        );

        return NextResponse.json({
            success: true,
            snippet: {
                id: snippetId,
                title: title.trim(),
                language: cleanLanguage,
                code: cleanCode,
                isCustom: true
            }
        });
    } catch (error: any) {
        console.error('Failed to save code snippet:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
    }
}

// DELETE: ลบ Snippet ออกจากบัญชี
export async function DELETE(request: Request) {
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

        const { searchParams } = new URL(request.url);
        const snippetId = searchParams.get('id');

        if (!snippetId) {
            return NextResponse.json({ success: false, error: 'Missing snippet id' }, { status: 400 });
        }

        await prisma.$executeRawUnsafe(
            `DELETE FROM "CodeSnippet" WHERE id = $1 AND "userId" = $2`,
            snippetId,
            user.id
        );

        return NextResponse.json({ success: true, message: 'Snippet deleted' });
    } catch (error: any) {
        console.error('Failed to delete code snippet:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
    }
}
