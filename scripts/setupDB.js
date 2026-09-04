const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupDatabase() {
  let connection;
  try {
    // 1. Connect without database to create it if it doesn't exist
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
    });

    const dbName = process.env.DB_NAME || 'helpdesk_tracker';
    console.log(`Creating database ${dbName} if it doesn't exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    
    // Switch to the database
    await connection.query(`USE ${dbName}`);

    // 2. Create users table
    console.log('Creating users table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NULL,
        google_id VARCHAR(255) NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure google_id column exists if table was created previously
    try {
      await connection.query('ALTER TABLE users ADD COLUMN google_id VARCHAR(255) NULL');
    } catch (e) {
      // Column may already exist
    }
    try {
      await connection.query('ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL');
    } catch (e) {
      // Password may already be nullable
    }

    // 3. Create tickets table
    console.log('Creating tickets table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Low',
        category VARCHAR(100),
        requestedBy VARCHAR(255),
        status ENUM('Open', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Open',
        assignedTo VARCHAR(255),
        date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Seed demo users with separate credentials
    console.log('Seeding demo users...');

    const usersToInsert = [
      { 
        name: 'Sithuminiariyasena', 
        email: 'sithuminiariyasena@gmail.com', 
        password: 'user@1', 
        role: 'user' 
      },
      { 
        name: 'Ishara Perera', 
        email: 'ishara@company.com', 
        password: 'Pass@1', 
        role: 'user' 
      },
      { 
        name: 'Admin User', 
        email: 'admin@company.com', 
        password: 'Pass@1', 
        role: 'admin' 
      }
    ];

    for (const user of usersToInsert) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const [existing] = await connection.query('SELECT * FROM users WHERE email = ?', [user.email]);
      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          [user.name, user.email, hashedPassword, user.role]
        );
        console.log(`Inserted demo user: ${user.email} (role: ${user.role})`);
      } else {
        await connection.query(
          'UPDATE users SET password = ?, role = ?, name = ? WHERE email = ?',
          [hashedPassword, user.role, user.name, user.email]
        );
        console.log(`Updated demo user: ${user.email} (role: ${user.role})`);
      }
    }

    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error during database setup:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
