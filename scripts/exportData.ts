import { prisma } from '../src/lib/prisma'
import fs from 'fs'

async function main() {
    console.log('Exporting data from SQLite...')

    const users = await prisma.user.findMany()
    const products = await prisma.product.findMany()
    const processes = await prisma.process.findMany()
    const parts = await prisma.part.findMany()
    const workLogs = await prisma.workLog.findMany()
    const lotSummaries = await prisma.lotSummary.findMany()

    // For many-to-many, we need to know the relationships.
    // In Prisma, we can query products with their processes.
    const productsWithProcesses = await prisma.product.findMany({
        include: { processes: true }
    })

    const exportData = {
        users,
        products,
        processes,
        parts,
        workLogs,
        lotSummaries,
        productsWithProcesses: productsWithProcesses.map(p => ({
            productId: p.id,
            processIds: p.processes.map(proc => proc.id)
        }))
    }

    fs.writeFileSync('data_backup.json', JSON.stringify(exportData, null, 2))
    console.log('Data exported successfully to data_backup.json')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
