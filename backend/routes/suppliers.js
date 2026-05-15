const express = require('express');
const router = express.Router();
const { readExcel, appendRow, updateRow, deleteRow } = require('../helpers/excel');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
  try {
    const suppliers = readExcel('suppliers');
    res.json({ success: true, data: suppliers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, phone, email, address, productsSupplied } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    const newSupplier = {
      id: 'SUP' + uuidv4().slice(0, 8).toUpperCase(),
      name,
      phone: phone || '',
      email: email || '',
      address: address || '',
      productsSupplied: productsSupplied || '',
      dateAdded: new Date().toISOString().split('T')[0],
    };
    appendRow('suppliers', newSupplier);
    res.status(201).json({ success: true, data: newSupplier });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const updated = updateRow('suppliers', req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const deleted = deleteRow('suppliers', req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
