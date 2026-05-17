const express = require('express');
const router = express.Router();
const { readSheet, appendRow, updateRow, deleteRow } = require('../helpers/googleSheets');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    console.log(`🔍 GET /products for user ${req.user.username}, sheet: ${req.user.spreadsheetId}`);
    const products = await readSheet(req.user.spreadsheetId, 'products');
    // Filter out hidden products (visible !== 'false')
    const visibleProducts = products.filter(p => p.visible !== 'false');
    console.log(`📦 Returning ${visibleProducts.length} visible products (${products.length} total)`);
    res.json({ success: true, data: visibleProducts });
  } catch (err) {
    console.error(`❌ GET /products error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log(`📝 POST /products for user ${req.user.username}`);
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
      visible: 'true',
    };
    await appendRow(req.user.spreadsheetId, 'products', newProduct);
    console.log(`✅ Product added: ${newProduct.name} (${newProduct.id})`);
    res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    console.error(`❌ POST /products error: ${err.message}`);
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

// Toggle product visibility
router.put('/:id/visible', async (req, res) => {
  try {
    const { id } = req.params;
    const { visible } = req.body;
    const products = await readSheet(req.user.spreadsheetId, 'products');
    const product = products.find(p => p.id === id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    
    const newVisibility = visible === false ? 'false' : 'true';
    const updated = await updateRow(req.user.spreadsheetId, 'products', id, { visible: newVisibility });
    res.json({ success: true, data: updated, message: visible === false ? 'Product hidden from web' : 'Product shown on web' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
