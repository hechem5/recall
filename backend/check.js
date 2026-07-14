const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
async function check() {
  await client.connect();
  const res = await client.query(`SELECT atttypmod FROM pg_attribute WHERE attrelid = 'public."Chunk"'::regclass AND attname = 'embedding'`);
  console.log("atttypmod:", res.rows[0].atttypmod);
  const res2 = await client.query(`SELECT embedding FROM "Chunk" LIMIT 1`);
  if (res2.rows.length > 0) {
    const vec = JSON.parse(res2.rows[0].embedding);
    console.log("First row dimension:", vec.length);
  } else {
    console.log("No rows in Chunk table.");
  }
  await client.end();
}
check();
