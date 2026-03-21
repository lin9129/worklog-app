import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
// @ts-ignore
const adapter = new PrismaPg(pool)

export const prisma = (globalForPrisma as any).prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') (globalForPrisma as any).prisma = prisma