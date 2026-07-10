import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Users:', await prisma.user.count())
    console.log('Products:', await prisma.product.count())
    console.log('Parts:', await prisma.part.count())
    console.log('Processes:', await prisma.process.count())
    console.log('WorkLogs:', await prisma.workLog.count())
  } catch (e) {
    console.error('Error during check:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
