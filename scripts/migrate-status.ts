import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Status Migration Start ---')
  const summaries = await prisma.lotSummary.findMany()
  
  for (const s of summaries) {
    const logsCount = await prisma.workLog.count({
      where: {
        lotNumber: s.lotNumber,
        productId: s.productId,
        manualProductName: s.manualProductName || null
      }
    })

    const newStatus = logsCount > 0 ? "製作中" : "未着手"
    
    await prisma.lotSummary.update({
      where: { id: s.id },
      data: { status: newStatus }
    })
    
    console.log(`Updated Lot ${s.lotNumber}: ${newStatus} (${logsCount} logs)`)
  }
  console.log('--- Status Migration Done ---')
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
