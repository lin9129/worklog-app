import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma = (globalForPrisma as any).prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') (globalForPrisma as any).prisma = prisma
