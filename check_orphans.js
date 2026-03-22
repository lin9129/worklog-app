const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking for Null/Empty String Mismatch ---');
  
  const summaries = await prisma.lotSummary.findMany({
    select: { id: true, lotNumber: true, productId: true, manualProductName: true }
  });
  
  console.log('LotSummaries:');
  summaries.forEach(s => {
    console.log(`ID: ${s.id}, Lot: "${s.lotNumber}", pId: ${s.productId === null ? 'NULL' : `"${s.productId}"`}, manual: ${s.manualProductName === null ? 'NULL' : `"${s.manualProductName}"`}`);
  });

  const logs = await prisma.workLog.findMany({
    select: { id: true, lotNumber: true, productId: true, manualProductName: true },
    where: { lotNumber: { in: summaries.map(s => s.lotNumber) } }
  });

  console.log('\nWorkLogs (matching summary lot numbers):');
  logs.forEach(l => {
    console.log(`ID: ${l.id}, Lot: "${l.lotNumber}", pId: ${l.productId === null ? 'NULL' : `"${l.productId}"`}, manual: ${l.manualProductName === null ? 'NULL' : `"${l.manualProductName}"`}`);
  });

  // Check for WorkLogs that have no matching LotSummary
  console.log('\nWorkLogs without any matching LotSummary (by lot+product+manual):');
  const orphanedLogs = await prisma.workLog.findMany({
    select: { id: true, lotNumber: true, productId: true, manualProductName: true }
  });
  
  const orphans = orphanedLogs.filter(l => {
    return !summaries.some(s => 
      s.lotNumber === l.lotNumber && 
      s.productId === l.productId && 
      s.manualProductName === l.manualProductName
    );
  });
  
  console.log(`Found ${orphans.length} orphaned logs.`);
  orphans.slice(0, 10).forEach(o => {
    console.log(`ID: ${o.id}, Lot: "${o.lotNumber}", pId: ${o.productId === null ? 'NULL' : `"${o.productId}"`}, manual: ${o.manualProductName === null ? 'NULL' : `"${o.manualProductName}"`}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
