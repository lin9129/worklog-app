import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
  try {
    const tableInfo = await prisma.$queryRaw`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('User', 'Product', 'Process', 'Part', 'WorkLog', 'LotSummary')
      ORDER BY table_name, column_name;
    `
    fs.writeFileSync('db_columns.json', JSON.stringify(tableInfo, null, 2))
    console.log('Columns written to db_columns.json')

    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';
    `
    fs.writeFileSync('db_tables.json', JSON.stringify(tables, null, 2))
    console.log('Tables written to db_tables.json')

  } catch (e) {
    console.error('Error during check:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
