const { pool } = require('../db');
const bcrypt = require('bcryptjs');

// ── User Model ───────────────────────────────────────────────
// Simple functions to interact with the users table.

const User = {
  // Find a user by email
  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  // Find a user by id
  async findById(id) {
    const [rows] = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  // Find a user by id (includes password for verification)
  async findByIdWithPassword(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  // Create a new user (hashes password before saving)
  async create({ name, email, password }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    return { id: result.insertId, name, email };
  },

  // Update user profile (name and/or email)
  async updateProfile(id, { name, email }) {
    await pool.query(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [name, email, id]
    );
    return this.findById(id);
  },

  // Update user password (hashes new password)
  async updatePassword(id, newPassword) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
  },

  // Delete user account (tasks cascade-delete via FK)
  async deleteAccount(id) {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
  },

  // Compare a candidate password with the stored hash
  async comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }
};

module.exports = User;
