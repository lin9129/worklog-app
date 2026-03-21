const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    const res = await pool.query("SELECT DISTINCT department FROM \"User\" UNION SELECT DISTINCT department FROM \"LotSummary\" UNION SELECT DISTINCT department FROM \"WorkLog\"");
    console.log('Unique departments in DB:', res.rows);
    
    const users = await pool.query("SELECT name, department FROM \"User\" ORDER BY name");
    console.log('Users and their departments:', users.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
