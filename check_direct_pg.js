const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log('Testing direct PG connection...');
  try {
    const res = await pool.query('SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = \'public\'');
    console.log('Tables:', res.rows.map(r => r.tablename));

    const productRes = await pool.query('SELECT * FROM "Product" LIMIT 1');
    console.log('Product row:', productRes.rows[0]);

    const columnsRes = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Product'
    `);
    console.log('Product Columns:', columnsRes.rows.map(r => r.column_name));

  } catch (err) {
    console.error('DIRECT PG ERROR:', err);
  } finally {
    await pool.end();
  }
}

main();
