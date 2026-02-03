import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

import { checkRateLimit } from "@/lib/rate-limit";

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

    // 🛡️ Security: ป้องกัน Large Payload Attack (DoS)
    if (username.length > 50) return NextResponse.json({ message: "ชื่อผู้ใช้ยาวเกินไป" }, { status: 400 });
    if (email.length > 255) return NextResponse.json({ message: "อีเมลยาวเกินไป" }, { status: 400 });
    if (password.length > 128) return NextResponse.json({ message: "รหัสผ่านยาวเกินไป" }, { status: 400 });

    if (username.length < 4 || username.length > 30) {
      return NextResponse.json({ message: "ชื่อต้องยาว 4-30 ตัวอักษร" }, { status: 400 });
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
          { email: email },
          { username: username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ message: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 409 });
      }
      if (existingUser.username === username) {
        return NextResponse.json({ message: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" }, { status: 409 });
      }
    }

    // สร้าง User
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name: username,
        image: "/default-avatar.png"
      }
    });

    return NextResponse.json({ message: "สมัครสมาชิกสำเร็จ!", user: newUser }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการสมัครสมาชิก" }, { status: 500 });
  }
}