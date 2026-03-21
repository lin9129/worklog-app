const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    const res = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, column_name;
    `);
    console.log('--- ALL COLUMNS ---');
    console.log(JSON.stringify(res.rows, null, 2));

    const productRes = await pool.query('SELECT * FROM "Product"');
    console.log('--- PRODUCT DATA ---');
    console.log(JSON.stringify(productRes.rows, null, 2));

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await pool.end();
  }
}

main();
