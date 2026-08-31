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
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: null,
        }
      },
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
        return {
          id: user.id,
          name: user.username || user.name,
          email: user.email
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        return {
          id: user.id,
          name: (user as any).username || user.name || "User",
          email: user.email,
        };
      }
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      return {
        id: token.id,
        name: token.name,
        email: token.email,
      };
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          id: (token.id as string) || (token.sub as string),
          name: (token.name as string) || "User",
          email: (token.email as string) || "",
        }
      };
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// ✅ 2. ส่ง authOptions เข้าไปใน NextAuth
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }