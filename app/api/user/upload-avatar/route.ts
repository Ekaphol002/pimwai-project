import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email && !session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('avatar') as File | null;

        if (!file) {
            return NextResponse.json({ success: false, error: 'กรุณาเลือกไฟล์รูปภาพ' }, { status: 400 });
        }

        // ตรวจสอบชนิดไฟล์
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ success: false, error: 'รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP, GIF)' }, { status: 400 });
        }

        // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ success: false, error: 'ขนาดรูปภาพต้องไม่เกิน 5MB' }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    ...(session.user.id ? [{ id: session.user.id }] : []),
                    ...(session.user.email ? [{ email: session.user.email }] : [])
                ]
            }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // ตรวจสอบว่าถูก Admin ล็อกไม่ให้เปลี่ยนรูปโปรไฟล์หรือไม่
        if ((user as any).isAvatarLocked) {
            return NextResponse.json({
                success: false,
                error: 'บัญชีของคุณถูกระงับสิทธิ์ในการเปลี่ยนรูปโปรไฟล์เนื่องจากรูปภาพไม่เหมาะสม'
            }, { status: 403 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // หา extension
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
        const fileName = `avatar-${user.id}-${Date.now()}.${ext}`;

        // บันทึกไฟล์ลงใน public/uploads/avatars
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
        await mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, fileName);
        await writeFile(filePath, buffer);

        const imageUrl = `/uploads/avatars/${fileName}`;

        // อัปเดตรูปใน User
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { image: imageUrl }
        });

        return NextResponse.json({
            success: true,
            message: 'อัปโหลดรูปโปรไฟล์สำเร็จ',
            imageUrl: updatedUser.image
        });

    } catch (error) {
        console.error('Upload avatar error:', error);
        return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการอัปโหลดรูป' }, { status: 500 });
    }
}
