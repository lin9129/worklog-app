import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'WorkLog';
    `
    console.log('WorkLog Columns:', tableInfo)

    const products = await prisma.product.findMany({
      take: 1,
      include: { processes: true }
    })
    console.log('Product Check:', products)
  } catch (e) {
    console.error('Error during check:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
