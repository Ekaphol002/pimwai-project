// middleware.ts
import { withAuth } from "next-auth/middleware"

export default withAuth({
  // ถ้ายังไม่ล็อกอิน ให้เด้งไปหน้านี้ (ปกติ next-auth จัดการให้ แต่ระบุไว้ก็ดี)
  pages: {
    signIn: "/login", 
  },
})

export const config = {
  // 🔒 ล็อกเฉพาะหน้าสรุปผลส่วนตัว ส่วน /lesson และ /typing-test เปิดให้เล่นแบบ Guest ได้ทันที
  matcher: [
    "/progress/:path*",
  ]
}