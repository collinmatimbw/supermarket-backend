const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    console.log('🔍 GET /products for user:', req.user.email);
    const products = await Product.find({ userId: req.user.email, visible: { $ne: 'false' } }).sort({ createdAt: -1 });
    console.log(`📦 Returning ${products.length} products`);
    res.json({ success: true, data: products });
  } catch (err) {
    console.error('❌ GET /products error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /products for user:', req.user.email);
    const { name, category, buyingPrice, sellingPrice, quantity, barcode, supplier } = req.body;
    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Name and category are required' });
    }

    if (barcode) {
      const existing = await Product.findOne({ userId: req.user.email, barcode });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Barcode already exists' });
      }
    }

    const newProduct = new Product({
      userId: req.user.email,
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
    });

    await newProduct.save();
    console.log(`✅ Product added: ${newProduct.name} (${newProduct.id})`);
    res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    console.error('❌ POST /products error:', err.message);
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

    const updated = await Product.findOneAndUpdate({ userId: req.user.email, id }, updates, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Product.findOneAndDelete({ userId: req.user.email, id: req.params.id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/visible', async (req, res) => {
  try {
    const { id } = req.params;
    const { visible } = req.body;
    const newVisibility = visible === false ? 'false' : 'true';
    const updated = await Product.findOneAndUpdate({ userId: req.user.email, id }, { visible: newVisibility }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: updated, message: visible === false ? 'Product hidden' : 'Product shown' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;