import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true,
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: null,
                };
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
                const cleanEmail = credentials.email.trim().toLowerCase();
                const user = await prisma.user.findFirst({
                    where: { email: cleanEmail }
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
        async signIn({ user, account }) {
            if (account?.provider === "google" && user.email) {
                try {
                    const cleanEmail = user.email.trim().toLowerCase();
                    const existingUser = await prisma.user.findFirst({
                        where: { email: cleanEmail },
                        include: { accounts: true }
                    });
                    if (existingUser) {
                        // 🛡️ ป้องกัน Pre-Account Takeover: หากบัญชีเคยถูกสมัครไว้ด้วยรหัสผ่านแต่ยังไม่เคยผูก Google
                        // การล็อกอินด้วย Google สำเร็จถือเป็นหลักฐานยืนยันตัวตนจริง ให้ล้างรหัสผ่านเดิมทิ้งทันที
                        if (existingUser.password && (!existingUser.accounts || existingUser.accounts.length === 0)) {
                            await prisma.user.update({
                                where: { id: existingUser.id },
                                data: { emailVerified: new Date(), password: null }
                            });
                        }

                        const isLinked = existingUser.accounts.some(
                            a => a.provider === account.provider && a.providerAccountId === account.providerAccountId
                        );
                        if (!isLinked) {
                            await prisma.account.create({
                                data: {
                                    userId: existingUser.id,
                                    type: account.type,
                                    provider: account.provider,
                                    providerAccountId: account.providerAccountId,
                                    access_token: account.access_token,
                                    expires_at: account.expires_at,
                                    token_type: account.token_type,
                                    scope: account.scope,
                                    id_token: account.id_token,
                                    refresh_token: account.refresh_token,
                                    session_state: account.session_state as string | null
                                }
                            });
                        }
                    }
                } catch (e) {
                    console.error("Auto-linking account error:", e);
                }
            }
            return true;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                return {
                    id: user.id,
                    name: (user as any).username || user.name || "User",
                    email: user.email,
                };
            }
            if (trigger === "update" && token.id) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: token.id as string },
                        select: { name: true, username: true }
                    });
                    if (dbUser) {
                        token.name = dbUser.username || dbUser.name || "User";
                    }
                } catch {
                    // ignore
                }
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
};
