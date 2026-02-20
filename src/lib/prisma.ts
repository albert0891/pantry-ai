import { PrismaClient } from '@prisma/client';

// ---------------------------------------------------------------------------
// Design Pattern Note: Singleton Pattern
// 
// In Next.js App Router (especially in development), file changes cause the server
// to hot-reload. If we just ran `new PrismaClient()` every time, we would quickly
// exhaust our database connection limit because old connections aren't closed.
// 
// This Singleton pattern ensures we only ever instantiate ONE Prisma Client,
// attaching it to the global Node.js scope in dev, and reusing it.
// ---------------------------------------------------------------------------

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
