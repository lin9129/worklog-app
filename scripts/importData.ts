import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('Reading data from data_backup.json...')
    if (!fs.existsSync('data_backup.json')) {
        console.error('data_backup.json not found!')
        process.exit(1)
    }
    const fileData = fs.readFileSync('data_backup.json', 'utf8')
    const data = JSON.parse(fileData)

    console.log('Importing Users...')
    for (const user of data.users) {
        await prisma.user.upsert({
            where: { id: user.id },
            update: { name: user.name, employmentType: user.employmentType },
            create: user
        })
    }

    console.log('Importing Products...')
    for (const product of data.products) {
        await prisma.product.upsert({
            where: { id: product.id },
            update: { name: product.name },
            create: { id: product.id, name: product.name }
        })
    }

    console.log('Importing Processes...')
    for (const processRecord of data.processes) {
        await prisma.process.upsert({
            where: { id: processRecord.id },
            update: { name: processRecord.name },
            create: { id: processRecord.id, name: processRecord.name }
        })
    }

    // Restore Process-Product relations
    console.log('Restoring Process-Product relations...')
    for (const r of data.productsWithProcesses) {
        if (r.processIds && r.processIds.length > 0) {
            await prisma.product.update({
                where: { id: r.productId },
                data: {
                    processes: {
                        connect: r.processIds.map((id: string) => ({ id }))
                    }
                }
            })
        }
    }

    console.log('Importing Parts...')
    for (const part of data.parts) {
        await prisma.part.upsert({
            where: { id: part.id },
            update: {
                name: part.name,
                modelNumber: part.modelNumber,
                description: part.description,
                componentCategory: part.componentCategory,
                productId: part.productId
            },
            create: part
        })
    }

    console.log('Importing Work Logs...')
    for (const log of data.workLogs) {
        await prisma.workLog.upsert({
            where: { id: log.id },
            update: log,
            create: log
        })
    }

    console.log('Importing Lot Summaries...')
    for (const summary of data.lotSummaries) {
        await prisma.lotSummary.upsert({
            where: { id: summary.id },
            update: summary,
            create: summary
        })
    }

    console.log('Data import to Supabase completed successfully!')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
        await pool.end()
    })
