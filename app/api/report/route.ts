import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/adminAuth';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'กรุณาเข้าสู่ระบบก่อนทำการรายงาน' }, { status: 401 });
        }

        const body = await request.json();
        const { reportedUserId, reason, details } = body;

        if (!reportedUserId || !reason) {
            return NextResponse.json({ success: false, error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
        }

        const reporter = await prisma.user.findFirst({
            where: {
                OR: [
                    ...(session.user.id ? [{ id: session.user.id }] : []),
                    ...(session.user.email ? [{ email: session.user.email }] : [])
                ]
            }
        });

        if (!reporter) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        if (reporter.id === reportedUserId) {
            return NextResponse.json({ success: false, error: 'คุณไม่สามารถรายงานบัญชีของตนเองได้' }, { status: 400 });
        }

        const report = await (prisma as any).report.create({
            data: {
                reporterId: reporter.id,
                reportedUserId,
                reason,
                details: details ? details.trim() : null
            }
        });

        return NextResponse.json({
            success: true,
            message: 'ส่งรายงานเรียบร้อยแล้ว แอดมินจะทำการตรวจสอบอย่างเร่งด่วน',
            reportId: report.id
        });
    } catch (error) {
        console.error('Report POST Error:', error);
        return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการส่งรายงาน' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!isAdmin(session?.user?.email)) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Admin only' }, { status: 403 });
        }

        const reports = await (prisma as any).report.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                reporter: {
                    select: { id: true, username: true, name: true, email: true }
                },
                reportedUser: {
                    select: { id: true, username: true, name: true, email: true, image: true, isAvatarLocked: true }
                }
            }
        });

        return NextResponse.json({
            success: true,
            reports
        });
    } catch (error) {
        console.error('Report GET Error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
