process.env.NODE_ENV = 'test';
const db = require('./src/config/db');
async function main() {
  const r = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='jadwal'");
  console.log('jadwal columns:', r.rows.map(x => x.column_name).join(', '));
  
  const r2 = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='pengajar'");
  console.log('pengajar columns:', r2.rows.map(x => x.column_name).join(', '));

  const r3 = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='users'");
  console.log('users columns:', r3.rows.map(x => x.column_name).join(', '));

  const r4 = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='santri'");
  console.log('santri columns:', r4.rows.map(x => x.column_name).join(', '));
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
