const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.email }).sort({ createdAt: -1 });
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, type, dueDate, priority } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title required' });
    const task = new Task({
      userId: req.user.email,
      id: 'T' + uuidv4().slice(0, 8).toUpperCase(),
      title, description: description || '', type: type || 'general', dueDate: dueDate || '', priority: priority || 'medium',
      dateAdded: new Date().toISOString().split('T')[0],
    });
    await task.save();
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Task.findOneAndUpdate({ userId: req.user.email, id: req.params.id }, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Task.findOneAndDelete({ userId: req.user.email, id: req.params.id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
