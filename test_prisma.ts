import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg
console.log('Connecting to:', process.env.DATABASE_URL?.replace(/:[^:]+@/, ':****@'))
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Testing connection with adapter...')
  try {
    const userCount = await prisma.user.count()
    console.log('User count:', userCount)

    const users = await prisma.user.findMany()
    console.log('Users:', users.length)

    const products = await prisma.product.findMany({
      include: { processes: true }
    })
    console.log('Products:', products.length)
    if (products.length > 0) {
      console.log('First product processes:', products[0].processes.length)
    }

  } catch (e) {
    console.error('CRITICAL ERROR:', e)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
