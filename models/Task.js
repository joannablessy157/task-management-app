const { pool } = require('../db');

// ── Task Model ───────────────────────────────────────────────
// Simple functions to interact with the tasks table.

const Task = {
  // Get all tasks for a user (sorted by newest first)
  async findByUserId(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  },

  // Find a single task by id
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    return rows[0] || null;
  },

  // Create a new task
  async create({ title, description, priority, dueDate, userId }) {
    const [result] = await pool.query(
      'INSERT INTO tasks (title, description, priority, due_date, user_id) VALUES (?, ?, ?, ?, ?)',
      [title, description || '', priority || 'medium', dueDate || null, userId]
    );

    // Return the newly created task
    return this.findById(result.insertId);
  },

  // Update a task
  async update(id, { title, description, priority, dueDate, status }) {
    await pool.query(
      `UPDATE tasks SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        priority = COALESCE(?, priority),
        due_date = ?,
        status = COALESCE(?, status)
      WHERE id = ?`,
      [title, description, priority, dueDate, status, id]
    );

    return this.findById(id);
  },

  // Delete a task
  async delete(id) {
    await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
  },

  // Toggle task completion status
  async toggleComplete(id) {
    await pool.query(
      `UPDATE tasks SET status = IF(status = 'completed', 'pending', 'completed') WHERE id = ?`,
      [id]
    );

    return this.findById(id);
  }
};

module.exports = Task;
