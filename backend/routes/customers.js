const express = require('express');
const router = express.Router();
const { readSheet, appendRow, updateRow, deleteRow } = require('../helpers/googleSheets');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const customers = await readSheet(req.user.spreadsheetId, 'customers');
    res.json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    const newCustomer = {
      id: 'C' + uuidv4().slice(0, 8).toUpperCase(),
      name,
      phone: phone || '',
      email: email || '',
      address: address || '',
      dateAdded: new Date().toISOString().split('T')[0],
    };
    await appendRow(req.user.spreadsheetId, 'customers', newCustomer);
    res.status(201).json({ success: true, data: newCustomer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await updateRow(req.user.spreadsheetId, 'customers', req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteRow(req.user.spreadsheetId, 'customers', req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
