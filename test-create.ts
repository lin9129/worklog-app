import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const url = 'file:./dev.db'
const adapter = new PrismaLibSql({ url })
const prisma = new PrismaClient({ adapter })

async function main() {
    try {
        console.log('Test 1: product.findMany with include processes...')
        const products = await prisma.product.findMany({
            include: { processes: true }
        })
        console.log(`OK: ${products.length} products`)
        products.forEach(p => console.log(`  ${p.name}: ${p.processes?.length || 0} processes`))

        console.log('\nTest 2: part.findMany with include product...')
        const parts = await prisma.part.findMany({
            include: { product: true }
        })
        console.log(`OK: ${parts.length} parts`)
        parts.forEach(p => console.log(`  ${p.name}: product=${p.product?.name}`))

        console.log('\nTest 3: workLog.create basic...')
        if (products[0] && parts[0]) {
            const processes = await prisma.process.findMany({ take: 1 })
            const users = await prisma.user.findMany({ take: 1 })
            if (users[0] && processes[0]) {
                const log = await prisma.workLog.create({
                    data: {
                        userId: users[0].id,
                        productId: products[0].id,
                        partId: parts[0].id,
                        processId: processes[0].id,
                        date: new Date('2026-03-01'),
                        startTime: '09:00',
                        status: '作業中',
                    }
                })
                console.log('OK: created', log.id)
                await prisma.workLog.delete({ where: { id: log.id } })
                console.log('OK: deleted')
            }
        }
    } catch (error: any) {
        console.error('FAILED:', error.message)
    } finally {
        await prisma.$disconnect()
    }
}

main()
