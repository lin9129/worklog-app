const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting LotSummary Sync ---');
  
  // Find all unique combinations of lotNumber, productId, and manualProductName in WorkLog
  const combinations = await prisma.workLog.groupBy({
    by: ['lotNumber', 'productId', 'manualProductName'],
  });

  console.log(`Found ${combinations.length} unique combinations in WorkLog.`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const combo of combinations) {
    const { lotNumber, productId, manualProductName } = combo;
    if (!lotNumber) continue;

    // Search for existing LotSummary
    const existing = await prisma.lotSummary.findFirst({
      where: {
        lotNumber: lotNumber.trim(), // Normalize finding
        productId: productId || null,
        manualProductName: manualProductName || null
      }
    });

    if (!existing) {
      console.log(`Creating missing LotSummary: Lot="${lotNumber}", pId=${productId}, manual=${manualProductName}`);
      await prisma.lotSummary.create({
        data: {
          lotNumber: lotNumber.trim(),
          productId: productId || null,
          manualProductName: manualProductName || null,
          // Try to find a customer name and department from one of the logs
          ...(await findSeedInfo(lotNumber, productId, manualProductName))
        }
      });
      createdCount++;
    } else {
      updatedCount++;
    }
  }

  console.log(`Finished. Created: ${createdCount}, Already exists: ${updatedCount}`);
}

async function findSeedInfo(lotNumber, productId, manualProductName) {
  const log = await prisma.workLog.findFirst({
    where: {
      lotNumber,
      productId,
      manualProductName
    },
    select: {
      customerName: true,
      department: true
    }
  });
  return {
    customerName: log?.customerName || null,
    department: log?.department || null
  };
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
