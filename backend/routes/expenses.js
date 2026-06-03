const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.email, visible: 'true' }).sort({ date: -1, createdAt: -1 });
    res.json({ success: true, data: expenses });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, category, amount, date, paymentMethod, notes } = req.body;
    if (!name || !amount) return res.status(400).json({ success: false, message: 'Name and amount required' });
    const expense = new Expense({
      userId: req.user.email, id: 'E' + uuidv4().slice(0, 8).toUpperCase(),
      name, category: category || 'other', amount: Number(amount) || 0,
      date: date || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'cash', notes: notes || '',
    });
    await expense.save();
    res.status(201).json({ success: true, data: expense });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Expense.findOneAndUpdate({ userId: req.user.email, id: req.params.id }, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Expense.findOneAndUpdate({ userId: req.user.email, id: req.params.id }, { visible: 'false' }, { new: true });
    if (!deleted) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
