const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const notifs = await Notification.find({ userId: req.user.email }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, data: notifs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/unread', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user.email, read: false });
    res.json({ success: true, count });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;
    if (!userId || !message) return res.status(400).json({ success: false, message: 'userId and message required' });
    const notif = new Notification({
      userId, id: 'N' + uuidv4().slice(0, 8).toUpperCase(),
      title: title || '', message, type: type || 'info',
    });
    await notif.save();
    res.status(201).json({ success: true, data: notif });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/read', async (req, res) => {
  try {
    const updated = await Notification.findOneAndUpdate({ userId: req.user.email, id: req.params.id }, { read: true }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.email, read: false }, { read: true });
    res.json({ success: true, message: 'All marked read' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
