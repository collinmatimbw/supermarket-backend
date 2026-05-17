const express = require('express');
const router = express.Router();
const { readSheet, appendRow, updateRow, deleteRow } = require('../helpers/googleSheets');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const products = await readSheet(req.user.spreadsheetId, 'products');
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, category, buyingPrice, sellingPrice, quantity, barcode, supplier } = req.body;
    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Name and category are required' });
    }
    const existing = await readSheet(req.user.spreadsheetId, 'products');
    if (barcode && existing.some(p => p.barcode === barcode)) {
      return res.status(400).json({ success: false, message: 'Barcode already exists' });
    }
    const newProduct = {
      id: 'P' + uuidv4().slice(0, 8).toUpperCase(),
      name,
      category,
      buyingPrice: Number(buyingPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      quantity: Number(quantity) || 0,
      barcode: barcode || '',
      supplier: supplier || '',
      dateAdded: new Date().toISOString().split('T')[0],
    };
    await appendRow(req.user.spreadsheetId, 'products', newProduct);
    res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates.buyingPrice !== undefined) updates.buyingPrice = Number(updates.buyingPrice);
    if (updates.sellingPrice !== undefined) updates.sellingPrice = Number(updates.sellingPrice);
    if (updates.quantity !== undefined) updates.quantity = Number(updates.quantity);
    const updated = await updateRow(req.user.spreadsheetId, 'products', id, updates);
    if (!updated) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteRow(req.user.spreadsheetId, 'products', req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
