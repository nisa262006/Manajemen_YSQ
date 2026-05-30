process.env.NODE_ENV = 'test';
const db = require('./src/config/db');

async function main() {
  const tablesRes = await db.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema='public' AND table_type='BASE TABLE'
  `);
  
  for (const row of tablesRes.rows) {
    const colsRes = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1
    `, [row.table_name]);
    console.log(`Table: ${row.table_name}`);
    console.log(`Columns: ${colsRes.rows.map(x => x.column_name).join(', ')}`);
    console.log('-------------------');
  }
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
