import { PrismaClient } from './src/generated/client/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// マイグレーションによって作成されたプロジェクトルートのdev.dbに接続します
const adapter = new PrismaBetterSqlite3({ url: 'file:dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Database connection test...");
  try {
    const products = await prisma.product.findMany();
    console.log("Connected successfully! Current products count:", products.length);
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
