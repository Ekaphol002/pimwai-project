import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email && !session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { currentPassword, newPassword } = body;

        if (!newPassword || newPassword.length < 8) {
            return NextResponse.json({ success: false, error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร' }, { status: 400 });
        }

        const userId = session.user.id;
        let user = null;
        if (userId) {
            user = await prisma.user.findUnique({ where: { id: userId } });
        } else if (session.user.email) {
            user = await prisma.user.findFirst({ where: { email: session.user.email.trim().toLowerCase() } });
        }

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // 🛡️ Security: บัญชีที่เข้าสู่ระบบผ่าน Google OAuth เท่านั้นและไม่มี Password ห้ามตั้งรหัสผ่านตรงนี้ (B2 Fix)
        if (!user.password) {
            return NextResponse.json({
                success: false,
                error: 'บัญชีของคุณเข้าสู่ระบบผ่าน Google OAuth จึงไม่มีรหัสผ่านในระบบ'
            }, { status: 400 });
        }

        if (!currentPassword) {
            return NextResponse.json({ success: false, error: 'กรุณากรอกรหัสผ่านปัจจุบัน' }, { status: 400 });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return NextResponse.json({ success: false, error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 400 });
        }

        // Hash รหัสผ่านใหม่
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await (prisma.user as any).update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        return NextResponse.json({
            success: true,
            message: 'เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว'
        });

    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' }, { status: 500 });
    }
}
