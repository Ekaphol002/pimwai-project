import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/adminAuth';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const body = await request.json();
        const { title, content, category = 'suggestion' } = body;

        if (!title || !content) {
            return NextResponse.json({ success: false, error: 'กรุณากรอกหัวข้อและเนื้อหาข้อเสนอแนะ' }, { status: 400 });
        }

        let userId: string | null = null;
        if (session?.user) {
            const user = await prisma.user.findFirst({
                where: {
                    OR: [
                        ...(session.user.id ? [{ id: session.user.id }] : []),
                        ...(session.user.email ? [{ email: session.user.email }] : [])
                    ]
                }
            });
            userId = user?.id || null;
        }

        const feedback = await (prisma as any).feedback.create({
            data: {
                title: title.trim(),
                content: content.trim(),
                category,
                userId
            }
        });

        return NextResponse.json({
            success: true,
            message: 'ส่งข้อเสนอแนะเรียบร้อยแล้ว ขอบคุณสำหรับความคิดเห็นครับ!',
            feedbackId: feedback.id
        });
    } catch (error) {
        console.error('Feedback POST Error:', error);
        return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการส่งข้อเสนอแนะ' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!isAdmin(session?.user?.email)) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Admin only' }, { status: 403 });
        }

        const feedbacks = await (prisma as any).feedback.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, username: true, name: true, email: true, image: true }
                }
            }
        });

        return NextResponse.json({
            success: true,
            feedbacks
        });
    } catch (error) {
        console.error('Feedback GET Error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
