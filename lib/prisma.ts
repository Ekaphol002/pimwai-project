import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

// ✅ เก็บ instance ไว้บน globalThis เสมอเพื่อป้องกัน connection pool เต็มใน Serverless
globalForPrisma.prisma = prisma