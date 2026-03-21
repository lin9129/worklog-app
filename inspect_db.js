const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    console.log('--- Inspecting WorkLog productId ---');
    const logs = await pool.query('SELECT id, "productId", "partId", "processId" FROM "WorkLog"');
    console.log('WorkLogs:', logs.rows.filter(r => r.productId !== null && r.productId !== undefined && r.productId.length < 5));
    
    console.log('--- Inspecting LotSummary productId ---');
    const lots = await pool.query('SELECT id, "productId" FROM "LotSummary"');
    console.log('LotSummaries:', lots.rows.filter(r => r.productId !== null && r.productId !== undefined && r.productId.length < 5));

    console.log('--- Checking for orphaned WorkLog productIds ---');
    const orphans = await pool.query(`
        SELECT w.id, w."productId" FROM "WorkLog" w
        LEFT JOIN "Product" p ON w."productId" = p.id
        WHERE w."productId" IS NOT NULL AND p.id IS NULL;
    `);
    console.log('Orphaned WorkLog productIds:', orphans.rows);

    console.log('--- Checking for orphaned LotSummary productIds ---');
    const orphansLot = await pool.query(`
        SELECT l.id, l."productId" FROM "LotSummary" l
        LEFT JOIN "Product" p ON l."productId" = p.id
        WHERE l."productId" IS NOT NULL AND p.id IS NULL;
    `);
    console.log('Orphaned LotSummary productIds:', orphansLot.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

run();
