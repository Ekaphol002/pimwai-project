import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, email: true, username: true }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // ลบข้อมูลที่ผูกกับผู้ใช้ออกทั้งหมดแบบ Clean Cascade Transaction
        await prisma.$transaction([
            prisma.lessonProgress.deleteMany({ where: { userId: user.id } }),
            prisma.speedTestResult.deleteMany({ where: { userId: user.id } }),
            prisma.farmSession.deleteMany({ where: { userId: user.id } }),
            prisma.account.deleteMany({ where: { userId: user.id } }),
            prisma.session.deleteMany({ where: { userId: user.id } }),
            prisma.$executeRawUnsafe('DELETE FROM "CodeSnippet" WHERE "userId" = $1', user.id),
            prisma.user.delete({ where: { id: user.id } })
        ]);

        return NextResponse.json({
            success: true,
            message: 'บัญชีของคุณและข้อมูลทั้งหมดถูกลบออกจากระบบถาวรเรียบร้อยแล้ว'
        });
    } catch (error: any) {
        console.error('Delete account error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to delete account'
        }, { status: 500 });
    }
}
