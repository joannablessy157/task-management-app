const express = require('express');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

const router = express.Router();

// All task routes are protected
router.use(auth);

// ── GET /api/tasks ───────────────────────────────────────────
// Fetch all tasks for the authenticated user
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.findByUserId(req.user.id);
    res.json(tasks);
  } catch (err) {
    console.error('Get tasks error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/tasks ──────────────────────────────────────────
// Create a new task
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const task = await Task.create({
      title,
      description: description || '',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      userId: req.user.id
    });

    res.status(201).json(task);
  } catch (err) {
    console.error('Create task error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── PUT /api/tasks/:id ──────────────────────────────────────
// Update an existing task (verify ownership)
router.put('/:id', async (req, res) => {
  try {
    const { title, description, priority, dueDate, status } = req.body;

    // Find task and verify ownership
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update fields
    const updatedTask = await Task.update(req.params.id, {
      title: title || task.title,
      description: description !== undefined ? description : task.description,
      priority: priority || task.priority,
      dueDate: dueDate !== undefined ? (dueDate || null) : task.due_date,
      status: status || task.status
    });

    res.json(updatedTask);
  } catch (err) {
    console.error('Update task error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── DELETE /api/tasks/:id ───────────────────────────────────
// Delete a task (verify ownership)
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Task.delete(req.params.id);

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── PATCH /api/tasks/:id/complete ───────────────────────────
// Toggle task completion status
router.patch('/:id/complete', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedTask = await Task.toggleComplete(req.params.id);

    res.json(updatedTask);
  } catch (err) {
    console.error('Complete task error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
