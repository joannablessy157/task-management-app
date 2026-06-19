const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mysql = require('mysql2/promise');

// ── MySQL Connection Pool ────────────────────────────────────
// A pool reuses connections for better performance.
// All models import this file to run queries.

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'taskflow',
  waitForConnections: true,
  connectionLimit: 10
});

// ── Initialize Database Tables ───────────────────────────────
// Creates the users and tasks tables if they don't already exist.

async function initializeDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  // Create database if it doesn't exist
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'taskflow'}\``);
  await connection.end();

  // Create tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(100) NOT NULL,
      description VARCHAR(500) DEFAULT '',
      priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
      status ENUM('pending', 'completed') DEFAULT 'pending',
      due_date DATETIME DEFAULT NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Migrate existing due_date column from DATE to DATETIME if needed
  try {
    await pool.query('ALTER TABLE tasks MODIFY COLUMN due_date DATETIME DEFAULT NULL');
  } catch (e) {
    // Ignore if column is already DATETIME
  }
}

module.exports = { pool, initializeDatabase };
