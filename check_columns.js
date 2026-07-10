const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const res = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'WorkLog' ORDER BY ordinal_position`
  );
  console.log('WorkLog columns:', res.rows.map(r => r.column_name));
  await pool.end();
}

run().catch(console.error);
