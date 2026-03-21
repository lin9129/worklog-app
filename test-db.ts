import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
dotenv.config()

async function test() {
    const prisma = new PrismaClient()
    try {
        console.log('Testing connection...')
        const count = await prisma.workLog.count()
        console.log('WorkLog count:', count)
        const models = Object.keys(prisma).filter(k => !k.startsWith('_'))
        console.log('Available models:', models.join(', '))
    } catch (e: any) {
        console.error('Connection failed:', e.message)
    } finally {
        await prisma.$disconnect()
    }
}

test()
