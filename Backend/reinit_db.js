process.env.NODE_ENV = 'test';
const db = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('=== RE-INITIALIZING DATABASE SCHEMA ===');
  
  // 1. Drop all tables in public schema
  const dropTablesQuery = `
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `;
  
  await db.query(dropTablesQuery);
  console.log('✅ Dropped all existing tables in public schema.');

  // 2. Read and run init.sql
  const initSqlPath = path.join(__dirname, 'docker', 'init.sql');
  if (!fs.existsSync(initSqlPath)) {
    console.error(`❌ init.sql not found at ${initSqlPath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(initSqlPath, 'utf8');
  
  // Split queries by semicolon (simplified, handles comments and quotes well enough for init.sql)
  // We can execute it as one query because pg client supports multi-statement queries in a single query() call!
  console.log('Running init.sql...');
  await db.query(sqlContent);
  console.log('✅ Re-created database schema from init.sql successfully.');

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Failed to re-initialize database:', err);
  process.exit(1);
});
