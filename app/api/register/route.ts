import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { checkRateLimit } from "@/lib/rate-limit";
import { ADMIN_EMAILS } from "@/lib/adminAuth";

export async function POST(req: Request) {
  try {
    // 🛡️ Security: Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ message: "คุณทำรายการบ่อยเกินไป โปรดรอสักครู่ (Rate Limit Exceeded)" }, { status: 429 });
    }

    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ message: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // 🛡️ Security: ป้องกัน Large Payload Attack (DoS)
    if (cleanUsername.length > 50) return NextResponse.json({ message: "ชื่อผู้ใช้ยาวเกินไป" }, { status: 400 });
    if (cleanEmail.length > 255) return NextResponse.json({ message: "อีเมลยาวเกินไป" }, { status: 400 });
    if (password.length > 128) return NextResponse.json({ message: "รหัสผ่านยาวเกินไป" }, { status: 400 });

    if (cleanUsername.length < 4 || cleanUsername.length > 30) {
      return NextResponse.json({ message: "ชื่อต้องยาว 4-30 ตัวอักษร" }, { status: 400 });
    }

    // 🛡️ Security: ห้ามตั้งชื่อหรืออีเมลแอบอ้างเป็นแอดมิน (B1 Fix)
    if (ADMIN_EMAILS.includes(cleanEmail)) {
      const existingAdmin = await prisma.user.findFirst({ where: { email: cleanEmail } });
      if (existingAdmin) {
        return NextResponse.json({ message: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 409 });
      }
    }

    // ✅ เพิ่ม: เช็คความปลอดภัยรหัสผ่าน
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json({
        message: "รหัสผ่านต้องยาว 8 ตัวขึ้นไป และมีตัวพิมพ์ใหญ่ ตัวเล็ก ตัวเลข ผสมกัน"
      }, { status: 400 });
    }

    // เช็คชื่อซ้ำ / อีเมลซ้ำ
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { username: cleanUsername }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email && existingUser.email.toLowerCase() === cleanEmail) {
        return NextResponse.json({ message: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 409 });
      }
      if (existingUser.username === cleanUsername) {
        return NextResponse.json({ message: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" }, { status: 409 });
      }
    }

    // สร้าง User
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword,
        name: cleanUsername,
        image: null
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    // 🛡️ Security: ไม่ส่ง password hash กลับไปที่ Client (B5 Fix)
    return NextResponse.json({
      message: "สมัครสมาชิกสำเร็จ!",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name
      }
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการสมัครสมาชิก" }, { status: 500 });
  }
}