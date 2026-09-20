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
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google" && user.email) {
                try {
                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email },
                        include: { accounts: true }
                    });
                    if (existingUser) {
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
            if (trigger === "update") {
                if (session?.name) token.name = session.name;
                else if (session?.user?.name) token.name = session.user.name;
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
