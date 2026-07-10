import { PrismaClient } from '../src/generated/client/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'file:dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting seeding...");
  
  // 既存データの削除
  await prisma.stocktakeRecord.deleteMany();
  await prisma.stocktakeSession.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.product.deleteMany();

  // 1. 商品データの作成
  const p1 = await prisma.product.create({
    data: {
      code: "INV00001",
      name: "3M 反射テープ イエロー",
      description: "幅50mm x 長さ45m 高輝度反射テープ",
      price: 2500,
      stock: 12,
      minStock: 5,
      location: "A-1-1",
    }
  });

  const p2 = await prisma.product.create({
    data: {
      code: "INV00002",
      name: "六角ボルト M8x20 (100個入)",
      description: "強度区分10.9 高強度スチール黒染め",
      price: 1200,
      stock: 50,
      minStock: 15,
      location: "B-3-2",
    }
  });

  const p3 = await prisma.product.create({
    data: {
      code: "INV00003",
      name: "プロテクトヘルメット 白",
      description: "国家検定合格品 飛来・落下物用・墜落時保護用",
      price: 3200,
      stock: 2, // 安全在庫を下回る少量在庫
      minStock: 5,
      location: "C-2-1",
    }
  });

  const p4 = await prisma.product.create({
    data: {
      code: "INV00004",
      name: "安全ゴーグル (防曇・耐衝撃)",
      description: "UVカット仕様・メガネ併用対応モデル",
      price: 850,
      stock: 0, // 在庫切れ
      minStock: 8,
      location: "C-2-2",
    }
  });

  const p5 = await prisma.product.create({
    data: {
      code: "INV00005",
      name: "防塵マスク DS2 (20枚入)",
      description: "国家検定規格DS2合格 感染症対策・建築現場用",
      price: 1800,
      stock: 35,
      minStock: 10,
      location: "D-1-1",
    }
  });

  // 2. 入出庫ログの作成
  await prisma.inventoryLog.createMany({
    data: [
      { productId: p1.id, type: "IN", quantity: 15, reason: "初期仕入れ", operator: "山田太郎" },
      { productId: p1.id, type: "OUT", quantity: 3, reason: "作業出荷（倉庫A宛）", operator: "鈴木一郎" },
      
      { productId: p2.id, type: "IN", quantity: 50, reason: "初期仕入れ", operator: "山田太郎" },
      
      { productId: p3.id, type: "IN", quantity: 5, reason: "初期仕入れ", operator: "山田太郎" },
      { productId: p3.id, type: "OUT", quantity: 3, reason: "破損による廃棄", operator: "鈴木一郎" },
      
      { productId: p5.id, type: "IN", quantity: 35, reason: "定期仕入れ", operator: "佐藤花子" },
    ]
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
