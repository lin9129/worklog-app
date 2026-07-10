import { PrismaClient } from '../generated/client/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient;

// 開発中のホットリロードによる複数接続防止のためシングルトンパターンを適用
if (process.env.NODE_ENV === 'production') {
  const adapter = new PrismaBetterSqlite3({ url: 'file:dev.db' });
  prismaInstance = new PrismaClient({ adapter });
} else {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaBetterSqlite3({ url: 'file:dev.db' });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prismaInstance = globalForPrisma.prisma;
}

export const db = prismaInstance;
export default db;
