const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || '';
const isLocalHost =
  connectionString.includes('localhost') ||
  connectionString.includes('127.0.0.1') ||
  connectionString.includes('@db:');

const pool = new Pool({
  connectionString,
  ssl: isLocalHost ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Error en cliente inactivo del pool PostgreSQL:', err.message);
});

module.exports = pool;
