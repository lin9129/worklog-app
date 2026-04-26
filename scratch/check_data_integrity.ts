import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('--- Checking for Part -> Product Relationship Consistency ---')
  
  const parts = await prisma.part.findMany({
    select: { id: true, name: true, productId: true }
  })
  
  const productIds = (await prisma.product.findMany({
    select: { id: true }
  })).map(p => p.id)
  
  const orphans = parts.filter(p => !productIds.includes(p.productId))
  
  if (orphans.length > 0) {
    console.log(`Found ${orphans.length} parts with missing products:`)
    orphans.forEach(o => console.log(`Part ID: ${o.id}, Name: ${o.name}, Missing Product ID: ${o.productId}`))
  } else {
    console.log('No orphaned parts found.')
  }

  console.log('\n--- Checking for empty names ---')
  const usersWithNoName = await prisma.user.findMany({ where: { name: '' } })
  console.log('Users with empty name:', usersWithNoName.length)
  
  const productsWithNoName = await prisma.product.findMany({ where: { name: '' } })
  console.log('Products with empty name:', productsWithNoName.length)

}

main().catch(console.error).finally(() => prisma.$disconnect())
