<<<<<<< HEAD
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('Seeding initial data...')

  // 1. Users
  const users = [
    { name: '山田 太郎' },
    { name: '佐藤 花子' },
    { name: '田中 一郎' },
  ]
  const createdUsers = await Promise.all(
    users.map(u => prisma.user.upsert({
      where: { name: u.name },
      update: {},
      create: u
    }))
  )
  console.log(`Upserted ${createdUsers.length} users.`)

  // 2. Products
  const products = [
    { name: 'タンス' },
    { name: '机' },
    { name: '椅子' },
  ]
  const createdProducts = await Promise.all(
    products.map(p => prisma.product.upsert({
      where: { name: p.name },
      update: {},
      create: p
    }))
  )
  console.log(`Upserted ${createdProducts.length} products.`)

  // 3. Processes
  const processes = [
    { name: '木出し' },
    { name: '木取り' },
    { name: 'ギャングソー' },
    { name: 'リップソー' },
    { name: 'クロスカット' },
    { name: '超仕上げ' },
    { name: 'NC加工' },
    { name: '組み立て' },
  ]
  const createdProcesses = await Promise.all(
    processes.map(p => prisma.process.upsert({
      where: { name: p.name },
      update: {
        products: {
          connect: createdProducts.map(cp => ({ id: cp.id }))
        }
      },
      create: {
        ...p,
        products: {
          connect: createdProducts.map(cp => ({ id: cp.id }))
        }
      }
    }))
  )
  console.log(`Upserted ${createdProcesses.length} processes and linked to all products.`)

  // 4. Parts (Linked to Products)
  const productDesk = createdProducts.find(p => p.name === '机')!
  const productTansu = createdProducts.find(p => p.name === 'タンス')!

  const parts = [
    { name: '天板', productId: productDesk.id, modelNumber: 'D-01' },
    { name: '脚部', productId: productDesk.id, modelNumber: 'D-02' },
    { name: '引き出し前板', productId: productTansu.id, modelNumber: 'T-01' },
    { name: '棚板', productId: productTansu.id, modelNumber: 'T-02' },
    { name: '背板', productId: productTansu.id, modelNumber: 'T-03' },
  ]
  const createdParts = await Promise.all(
    parts.map(p => prisma.part.upsert({
      where: { name: p.name },
      update: { productId: p.productId, modelNumber: p.modelNumber },
      create: p
    }))
  )
  console.log(`Upserted ${createdParts.length} parts.`)

  // 5. Sample Work Logs
  // We keep simple create here since WorkLog doesn't have unique constraint on everything
  try {
    const existingLogs = await prisma.workLog.count()
    if (existingLogs === 0) {
      await prisma.workLog.create({
        data: {
          date: new Date(),
          productId: productDesk.id,
          partId: createdParts.find(p => p.name === '脚部')!.id,
          processId: createdProcesses.find(p => p.name === '木取り')!.id,
          userId: createdUsers[1].id,
          startTime: '13:00',
          status: '作業中',
        }
      })
      console.log('Created sample work log.')
    }
  } catch (e) {
    console.log('Skipped sample work log creation.')
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    // await prisma.$disconnect()
  })
=======
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('Seeding initial data...')

  // 1. Users
  const users = [
    { name: '山田 太郎' },
    { name: '佐藤 花子' },
    { name: '田中 一郎' },
  ]
  const createdUsers = await Promise.all(
    users.map(u => prisma.user.upsert({
      where: { name: u.name },
      update: {},
      create: u
    }))
  )
  console.log(`Upserted ${createdUsers.length} users.`)

  // 2. Products
  const products = [
    { name: 'タンス' },
    { name: '机' },
    { name: '椅子' },
  ]
  const createdProducts = await Promise.all(
    products.map(p => prisma.product.upsert({
      where: { name: p.name },
      update: {},
      create: p
    }))
  )
  console.log(`Upserted ${createdProducts.length} products.`)

  // 3. Processes
  const processes = [
    { name: '木出し' },
    { name: '木取り' },
    { name: 'ギャングソー' },
    { name: 'リップソー' },
    { name: 'クロスカット' },
    { name: '超仕上げ' },
    { name: 'NC加工' },
    { name: '組み立て' },
  ]
  const createdProcesses = await Promise.all(
    processes.map(p => prisma.process.upsert({
      where: { name: p.name },
      update: {
        products: {
          connect: createdProducts.map(cp => ({ id: cp.id }))
        }
      },
      create: {
        ...p,
        products: {
          connect: createdProducts.map(cp => ({ id: cp.id }))
        }
      }
    }))
  )
  console.log(`Upserted ${createdProcesses.length} processes and linked to all products.`)

  // 4. Parts (Linked to Products)
  const productDesk = createdProducts.find(p => p.name === '机')!
  const productTansu = createdProducts.find(p => p.name === 'タンス')!

  const parts = [
    { name: '天板', productId: productDesk.id, modelNumber: 'D-01' },
    { name: '脚部', productId: productDesk.id, modelNumber: 'D-02' },
    { name: '引き出し前板', productId: productTansu.id, modelNumber: 'T-01' },
    { name: '棚板', productId: productTansu.id, modelNumber: 'T-02' },
    { name: '背板', productId: productTansu.id, modelNumber: 'T-03' },
  ]
  const createdParts = await Promise.all(
    parts.map(p => prisma.part.upsert({
      where: { name: p.name },
      update: { productId: p.productId, modelNumber: p.modelNumber },
      create: p
    }))
  )
  console.log(`Upserted ${createdParts.length} parts.`)

  // 5. Sample Work Logs
  // We keep simple create here since WorkLog doesn't have unique constraint on everything
  try {
    const existingLogs = await prisma.workLog.count()
    if (existingLogs === 0) {
      await prisma.workLog.create({
        data: {
          date: new Date(),
          productId: productDesk.id,
          partId: createdParts.find(p => p.name === '脚部')!.id,
          processId: createdProcesses.find(p => p.name === '木取り')!.id,
          userId: createdUsers[1].id,
          startTime: '13:00',
          status: '作業中',
        }
      })
      console.log('Created sample work log.')
    }
  } catch (e) {
    console.log('Skipped sample work log creation.')
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    // await prisma.$disconnect()
  })
>>>>>>> ff5b9c9 (fix: all errors and guards)
