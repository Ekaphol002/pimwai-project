// middleware.ts
import { withAuth } from "next-auth/middleware"

export default withAuth({
  // ถ้ายังไม่ล็อกอิน ให้เด้งไปหน้านี้ (ปกติ next-auth จัดการให้ แต่ระบุไว้ก็ดี)
  pages: {
    signIn: "/login", 
  },
})

export const config = {
  // ปลดล็อกทั้งหมดให้ตรวจสอบสิทธิ์ในแต่ละหน้า/API โดยตรง ป้องกันปัญหาวนลูปล็อกอินในหน้า /progress
  matcher: []
}