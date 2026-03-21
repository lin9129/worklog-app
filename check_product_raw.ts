import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Testing raw SQL on Product table...')
  try {
    const products = await prisma.$queryRawUnsafe('SELECT * FROM "Product" LIMIT 1')
    console.log('Raw Product Data:', JSON.stringify(products, null, 2))
    
    // Check columns explicitly
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Product'
    `)
    console.log('Product Columns:', JSON.stringify(columns, null, 2))

  } catch (e) {
    console.error('SQL ERROR:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
