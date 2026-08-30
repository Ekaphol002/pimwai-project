import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';
import { containsProfanity } from '@/lib/profanityFilter';
import bcrypt from 'bcrypt';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email && !session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const searchConditions = [];
        if (session.user.id) searchConditions.push({ id: session.user.id });
        if (session.user.email) searchConditions.push({ email: session.user.email });
        if (session.user.name) searchConditions.push({ username: session.user.name }, { name: session.user.name });

        const user = await prisma.user.findFirst({
            where: searchConditions.length > 0 ? { OR: searchConditions } : {},
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                image: true,
                rank: true,
                stars: true,
                currentExp: true,
                createdAt: true,
                password: true,
                accounts: {
                    select: {
                        provider: true
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // เช็คผู้ให้บริการที่สมัคร (Google หรือ Email/Credentials)
        let provider = 'Email & Password';
        if (user.accounts && user.accounts.length > 0) {
            const providers = user.accounts.map((a: any) => a.provider);
            if (providers.includes('google')) {
                provider = 'Google Account';
            } else {
                provider = providers.join(', ');
            }
        }

        const hasPassword = Boolean(user.password);

        const rawUser = user as any;
        const lastChangeTime = rawUser.lastNameChangedAt ? new Date(rawUser.lastNameChangedAt).getTime() : null;

        let canChangeName = true;
        let nextAvailableDate: Date | null = null;
        let daysLeft = 0;

        if (lastChangeTime) {
            const now = Date.now();
            const timeDiff = now - lastChangeTime;

            if (timeDiff < SEVEN_DAYS_MS) {
                canChangeName = false;
                nextAvailableDate = new Date(lastChangeTime + SEVEN_DAYS_MS);
                daysLeft = Math.ceil((nextAvailableDate.getTime() - now) / (1000 * 60 * 60 * 24));
            }
        }

        // ไม่ส่ง password hash กลับไป
        const { password, ...safeUser } = user;

        return NextResponse.json({
            success: true,
            user: {
                ...safeUser,
                displayName: user.username || user.name || "User",
                provider: provider,
                hasPassword,
                showInLeaderboard: rawUser.showInLeaderboard ?? true,
                keyboardSound: rawUser.keyboardSound || 'click',
                lastNameChangedAt: rawUser.lastNameChangedAt || null
            },
            canChangeName,
            nextAvailableDate,
            daysLeft
        });
    } catch (error) {
        console.error('Profile GET Error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email && !session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { username, showInLeaderboard, keyboardSound } = body;

        const searchConditions = [];
        if (session.user.id) searchConditions.push({ id: session.user.id });
        if (session.user.email) searchConditions.push({ email: session.user.email });
        if (session.user.name) searchConditions.push({ username: session.user.name }, { name: session.user.name });

        const currentUser = await (prisma.user as any).findFirst({
            where: searchConditions.length > 0 ? { OR: searchConditions } : {}
        });

        if (!currentUser) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        const updateData: any = {};

        // 1. อัปเดต Preferences (Leaderboard / Keyboard Sound)
        if (typeof showInLeaderboard === 'boolean') {
            updateData.showInLeaderboard = showInLeaderboard;
        }
        if (typeof keyboardSound === 'string') {
            updateData.keyboardSound = keyboardSound;
        }

        // 2. อัปเดต Username (ถ้าส่งมา)
        if (typeof username === 'string') {
            const trimmedUsername = username.trim();

            if (!trimmedUsername) {
                return NextResponse.json({ success: false, error: 'กรุณากรอกชื่อผู้ใช้' }, { status: 400 });
            }

            if (trimmedUsername.length < 2 || trimmedUsername.length > 20) {
                return NextResponse.json({ success: false, error: 'ชื่อผู้ใช้ต้องมีความยาวระหว่าง 2 ถึง 20 ตัวอักษร' }, { status: 400 });
            }

            // ตรวจสอบคำหยาบ (Profanity Filter)
            const profanityCheck = containsProfanity(trimmedUsername);
            if (profanityCheck.isBad) {
                return NextResponse.json({
                    success: false,
                    error: 'ชื่อผู้ใช้นี้มีคำที่ไม่เหมาะสม กรุณาใช้ชื่ออื่นที่สุภาพ'
                }, { status: 400 });
            }

            if (currentUser.username !== trimmedUsername && (!currentUser.username && currentUser.name !== trimmedUsername)) {
                // ตรวจสอบเงื่อนไข 7 วัน
                if (currentUser.lastNameChangedAt) {
                    const lastChangeTime = new Date(currentUser.lastNameChangedAt).getTime();
                    const now = Date.now();
                    const timeDiff = now - lastChangeTime;

                    if (timeDiff < SEVEN_DAYS_MS) {
                        const nextDate = new Date(lastChangeTime + SEVEN_DAYS_MS);
                        const daysRemaining = Math.ceil((nextDate.getTime() - now) / (1000 * 60 * 60 * 24));
                        return NextResponse.json({
                            success: false,
                            error: `คุณสามารถเปลี่ยนชื่อได้อีกครั้งในอีก ${daysRemaining} วัน (${nextDate.toLocaleDateString('th-TH')})`
                        }, { status: 400 });
                    }
                }

                // ตรวจสอบชื่อซ้ำ
                const existingUser = await (prisma.user as any).findUnique({
                    where: { username: trimmedUsername }
                });

                if (existingUser && existingUser.id !== currentUser.id) {
                    return NextResponse.json({ success: false, error: 'ชื่อผู้ใช้นี้มีคนใช้งานแล้ว กรุณาเลือกชื่ออื่น' }, { status: 400 });
                }

                updateData.username = trimmedUsername;
                updateData.name = trimmedUsername;
                updateData.lastNameChangedAt = new Date();
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ success: true, message: 'ไม่มีข้อมูลเปลี่ยนแปลง' });
        }

        const updatedUser = await (prisma.user as any).update({
            where: { id: currentUser.id },
            data: updateData
        });

        return NextResponse.json({
            success: true,
            message: 'บันทึกการตั้งค่าสำเร็จ',
            user: updatedUser
        });

    } catch (error) {
        console.error('Profile PUT Error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
