const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  user: 'postgres',
  password: '12345',
  port: 5432,
  database: 'manajemen_db'
});

client.connect()
  .then(() => {
    console.log('Connected successfully to 5432');
    return client.query('SELECT current_database()');
  })
  .then(res => {
    console.log('Database:', res.rows[0].current_database);
    return client.end();
  })
  .catch(err => {
    console.error('Connection failed:', err.message);
    process.exit(1);
  });
