import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
} as any)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
