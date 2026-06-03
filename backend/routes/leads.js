const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const leads = await Lead.find({ userId: req.user.email }).sort({ createdAt: -1 });
    res.json({ success: true, data: leads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, notes, stage } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name required' });
    const lead = new Lead({
      userId: req.user.email,
      id: 'L' + uuidv4().slice(0, 8).toUpperCase(),
      name, phone: phone || '', email: email || '', notes: notes || '', stage: stage || 'new',
      dateAdded: new Date().toISOString().split('T')[0],
    });
    await lead.save();
    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Lead.findOneAndUpdate({ userId: req.user.email, id: req.params.id }, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Lead.findOneAndDelete({ userId: req.user.email, id: req.params.id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
