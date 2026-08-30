import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/adminAuth';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!isAdmin(session?.user?.email)) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Admin only' }, { status: 403 });
        }

        const body = await request.json();
        const { action, targetUserId, newName, status, reportId, feedbackId } = body;

        // 1. จัดการรูปโปรไฟล์ (Reset Avatar & Lock Avatar)
        if (action === 'reset_and_lock_avatar') {
            if (!targetUserId) {
                return NextResponse.json({ success: false, error: 'Target user ID is required' }, { status: 400 });
            }

            const updatedUser = await (prisma.user as any).update({
                where: { id: targetUserId },
                data: {
                    image: null,           // ลบรูปภาพทิ้ง ให้กลับไปเป็น Avatar เริ่มต้น
                    isAvatarLocked: true   // ล็อกไม่ให้อัปโหลดใหม่อีกต่อไป
                }
            });

            return NextResponse.json({
                success: true,
                message: 'รีเซ็ตรูปโปรไฟล์และระงับสิทธิ์การเปลี่ยนรูปของผู้ใช้เรียบร้อยแล้ว',
                user: updatedUser
            });
        }

        // 2. ปลดล็อกรูปโปรไฟล์ (Unlock Avatar)
        if (action === 'unlock_avatar') {
            if (!targetUserId) {
                return NextResponse.json({ success: false, error: 'Target user ID is required' }, { status: 400 });
            }

            const updatedUser = await (prisma.user as any).update({
                where: { id: targetUserId },
                data: {
                    isAvatarLocked: false
                }
            });

            return NextResponse.json({
                success: true,
                message: 'ปลดล็อกสิทธิ์การเปลี่ยนรูปโปรไฟล์เรียบร้อยแล้ว',
                user: updatedUser
            });
        }

        // 3. รีเซ็ตชื่อผู้ใช้ที่ไม่เหมาะสม (Force Rename)
        if (action === 'force_rename') {
            if (!targetUserId) {
                return NextResponse.json({ success: false, error: 'Target user ID is required' }, { status: 400 });
            }

            const safeName = newName ? newName.trim() : `User_${targetUserId.slice(-6)}`;
            const updatedUser = await (prisma.user as any).update({
                where: { id: targetUserId },
                data: {
                    username: safeName,
                    name: safeName
                }
            });

            return NextResponse.json({
                success: true,
                message: `เปลี่ยนชื่อผู้ใช้เป็น "${safeName}" เรียบร้อยแล้ว`,
                user: updatedUser
            });
        }

        // 4. เปลี่ยนสถานะ Report (Resolved / Dismissed)
        if (action === 'update_report_status' && reportId) {
            await (prisma as any).report.update({
                where: { id: reportId },
                data: { status: status || 'resolved' }
            });

            return NextResponse.json({
                success: true,
                message: 'อัปเดตสถานะรายงานเรียบร้อยแล้ว'
            });
        }

        // 5. เปลี่ยนสถานะ Feedback (Reviewed / Resolved)
        if (action === 'update_feedback_status' && feedbackId) {
            await (prisma as any).feedback.update({
                where: { id: feedbackId },
                data: { status: status || 'resolved' }
            });

            return NextResponse.json({
                success: true,
                message: 'อัปเดตสถานะข้อเสนอแนะเรียบร้อยแล้ว'
            });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Admin Action Error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
