const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  console.log('--- Checking Unique Constraints on LotSummary ---');
  const res = await client.query(`
    SELECT
        conname AS constraint_name,
        confrelid::regclass AS referenced_table,
        pg_get_constraintdef(c.oid) AS constraint_definition
    FROM
        pg_constraint c
    JOIN
        pg_namespace n ON n.oid = c.connamespace
    WHERE
        conrelid = '"LotSummary"'::regclass;
  `);
  console.table(res.rows);

  console.log('--- Checking Indices on LotSummary ---');
  const res2 = await client.query(`
    SELECT
        indexname,
        indexdef
    FROM
        pg_indexes
    WHERE
        tablename = 'LotSummary';
  `);
  console.table(res2.rows);

  await client.end();
}

main().catch(console.error);
