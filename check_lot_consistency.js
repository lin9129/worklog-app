const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- LotSummary Data ---');
  const summaries = await prisma.lotSummary.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  console.table(summaries.map(s => ({
    id: s.id,
    lot: s.lotNumber,
    pId: s.productId,
    manual: s.manualProductName,
    cust: s.customerName,
    completed: s.isCompleted
  })));

  console.log('--- Recent WorkLogs ---');
  const logs = await prisma.workLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      lotNumber: true,
      productId: true,
      manualProductName: true,
      duration: true
    }
  });
  console.table(logs);

  // Check for duplicate LotSummary records for same (lot, productId, manualName)
  const duplicates = await prisma.lotSummary.groupBy({
    by: ['lotNumber', 'productId', 'manualProductName'],
    _count: {
      id: true
    },
    having: {
      id: {
        _count: {
          gt: 1
        }
      }
    }
  });
  console.log('Duplicate LotSummary groups:', duplicates);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
