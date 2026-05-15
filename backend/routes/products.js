const express = require('express');
const router = express.Router();
const { readExcel, appendRow, updateRow, deleteRow } = require('../helpers/excel');
const { v4: uuidv4 } = require('uuid');

// GET all products
router.get('/', (req, res) => {
  try {
    const products = readExcel('products');
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST add product
router.post('/', (req, res) => {
  try {
    const { name, category, buyingPrice, sellingPrice, quantity, barcode, supplier } = req.body;
    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Name and category are required' });
    }
    // Check duplicate barcode
    const existing = readExcel('products');
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
    appendRow('products', newProduct);
    res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update product
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates.buyingPrice !== undefined) updates.buyingPrice = Number(updates.buyingPrice);
    if (updates.sellingPrice !== undefined) updates.sellingPrice = Number(updates.sellingPrice);
    if (updates.quantity !== undefined) updates.quantity = Number(updates.quantity);
    const updated = updateRow('products', id, updates);
    if (!updated) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE product
router.delete('/:id', (req, res) => {
  try {
    const deleted = deleteRow('products', req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
