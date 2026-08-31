// middleware.ts
import { withAuth } from "next-auth/middleware"

export default withAuth({
  // ถ้ายังไม่ล็อกอิน ให้เด้งไปหน้านี้ (ปกติ next-auth จัดการให้ แต่ระบุไว้ก็ดี)
  pages: {
    signIn: "/login", 
  },
})

export const config = {
  // 🔒 ระบุ path ที่ต้องการ "ล็อก" (ห้ามคนนอกเข้า)
  matcher: [
    "/progress/:path*",     // ล็อกหน้าดูผลงาน
    "/typing-test/:path*",  // ล็อกหน้าพิมพ์แข่ง (สำคัญ!)
    "/lesson/:path*",       // ล็อกหน้าฝึกซ้อม (ใน folder practice)
  ]
}