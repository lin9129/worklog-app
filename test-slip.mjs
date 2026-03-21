// Direct test of LotSummary creation
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pkg from 'pg'
const { Pool } = pkg

import { readFileSync } from 'fs'

// Load .env manually
const envContent = readFileSync('.env', 'utf8')
const env = {}
for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=')
        if (idx > 0) {
            const key = trimmed.substring(0, idx).trim()
            let val = trimmed.substring(idx + 1).trim()
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
            env[key] = val
        }
    }
}

console.log('DATABASE_URL prefix:', env.DATABASE_URL?.substring(0, 40))

const pool = new Pool({ connectionString: env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    try {
        console.log('Testing LotSummary create...')
        const slip = await prisma.lotSummary.create({
            data: {
                lotNumber: 'TEST-SLIP-001',
                manualProductName: 'テスト商品',
                customerName: 'テスト様',
                productionCount: 5,
                department: '木工'
            }
        })
        console.log('Created:', slip.id, slip.lotNumber)

        // Clean up
        await prisma.lotSummary.delete({ where: { id: slip.id } })
        console.log('Cleaned up. All OK!')
    } catch (e) {
        console.error('ERROR:', e.message)
        if (e.code) console.error('Prisma code:', e.code)
    } finally {
        await prisma.$disconnect()
        await pool.end()
    }
}

main()
