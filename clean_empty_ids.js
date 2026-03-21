const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    console.log('Cleaning empty ID strings from WorkLog...');
    await pool.query(`UPDATE "WorkLog" SET "productId" = NULL WHERE "productId" = '';`);
    await pool.query(`UPDATE "WorkLog" SET "partId" = NULL WHERE "partId" = '';`);
    await pool.query(`UPDATE "WorkLog" SET "processId" = NULL WHERE "processId" = '';`);
    
    console.log('Cleaning empty ID strings from LotSummary...');
    await pool.query(`UPDATE "LotSummary" SET "productId" = NULL WHERE "productId" = '';`);

    console.log('Cleanup completed successfully.');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await pool.end();
  }
}

run();
