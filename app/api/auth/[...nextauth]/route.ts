import NextAuth, { AuthOptions } from "next-auth" // เพิ่ม AuthOptions มากำหนด Type (ถ้าต้องการ)
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"

// ✅ 1. แยก Config ออกมา แล้วใส่ export ข้างหน้า
export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("กรุณากรอกข้อมูล");
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        if (!user || !user.password) {
          throw new Error("ไม่พบผู้ใช้งาน");
        }
        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isPasswordCorrect) {
          throw new Error("รหัสผ่านไม่ถูกต้อง");
        }
        return user;
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
        if (session.user && token.sub) {
            // @ts-ignore
            session.user.id = token.sub;
        }
        return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// ✅ 2. ส่ง authOptions เข้าไปใน NextAuth
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }