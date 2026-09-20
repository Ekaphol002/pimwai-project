import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  let finalUrl = databaseUrl;

  if (databaseUrl && !databaseUrl.includes('connection_limit')) {
    finalUrl = databaseUrl.includes('?')
      ? `${databaseUrl}&connection_limit=1`
      : `${databaseUrl}?connection_limit=1`;
  }

  return new PrismaClient({
    datasources: finalUrl ? { db: { url: finalUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

// ✅ เก็บ instance ไว้บน globalThis เสมอเพื่อป้องกัน connection pool เต็มใน Serverless
globalForPrisma.prisma = prisma