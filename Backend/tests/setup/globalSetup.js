const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.test') });
const seedTestUsers = require('./seedTestUsers');
const fs = require('fs');

module.exports = async () => {
  process.env.NODE_ENV = 'test';
  
  const db = require('../../src/config/db');
  
  console.log('=== GLOBAL SETUP: RE-INITIALIZING DATABASE ===');
  
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
  
  // 2. Read and run init.sql
  const initSqlPath = path.resolve(__dirname, '../../docker/init.sql');
  const sqlContent = fs.readFileSync(initSqlPath, 'utf8');
  await db.query(sqlContent);
  console.log('✅ Schema initialized.');

  // 3. Seed data yang dibutuhkan functional test
  await seedTestUsers();

  // Tutup pool DB after seed
  await db.end();
};
