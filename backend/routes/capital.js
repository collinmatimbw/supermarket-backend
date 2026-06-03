const express = require('express');
const router = express.Router();
const Capital = require('../models/Capital');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const records = await Capital.find({ userId: req.user.email, visible: 'true' }).sort({ date: -1, createdAt: -1 });
    res.json({ success: true, data: records });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { amount, source, date, notes } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
    const record = new Capital({
      userId: req.user.email, id: 'CAP' + uuidv4().slice(0, 8).toUpperCase(),
      amount: Number(amount), source: source || 'personal',
      date: date || new Date().toISOString().split('T')[0], notes: notes || '',
    });
    await record.save();
    res.status(201).json({ success: true, data: record });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Capital.findOneAndUpdate({ userId: req.user.email, id: req.params.id }, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Capital record not found' });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Capital.findOneAndUpdate({ userId: req.user.email, id: req.params.id }, { visible: 'false' }, { new: true });
    if (!deleted) return res.status(404).json({ success: false, message: 'Capital record not found' });
    res.json({ success: true, message: 'Capital record deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
