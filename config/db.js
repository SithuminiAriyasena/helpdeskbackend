const mysql = require('mysql2/promise');
require('dotenv').config();

function parseDatabaseUrl(urlStr) {
  try {
    const url = new URL(urlStr);
    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : undefined,
      user: url.username,
      password: url.password,
      database: url.pathname ? url.pathname.replace(/^\//, '') : undefined,
    }
  } catch (err) {
    return null
  }
}

// Prefer a full connection string if provided
const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQLURL;
const parsed = dbUrl ? parseDatabaseUrl(dbUrl) : null;

const host = parsed?.host || process.env.DB_HOST || process.env.MYSQLHOST || process.env.MYSQL_HOST || 'localhost';
const port = parsed?.port || Number(process.env.DB_PORT) || Number(process.env.MYSQLPORT) || Number(process.env.MYSQL_PORT) || 3306;
const user = parsed?.user || process.env.DB_USER || process.env.MYSQLUSER || process.env.MYSQL_USER || 'root';
const password = parsed?.password || process.env.DB_PASSWORD || process.env.DB_PASS || process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || '';
const database = parsed?.database || process.env.DB_NAME || process.env.DB_DATABASE || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'helpdesk_tracker';

const pool = mysql.createPool({
  host,
  port,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
