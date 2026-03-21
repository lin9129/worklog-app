const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    const res = await pool.query('SELECT current_schema()');
    console.log('Current Schema:', res.rows[0].current_schema);

    const schemas = await pool.query('SELECT schema_name FROM information_schema.schemata');
    console.log('Available Schemas:', schemas.rows.map(s => s.schema_name));

    const tables = await pool.query('SELECT schemaname, tablename FROM pg_catalog.pg_tables');
    console.log('All Tables:', tables.rows.filter(t => !t.schemaname.startsWith('pg_') && t.schemaname !== 'information_schema'));

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await pool.end();
  }
}

main();
