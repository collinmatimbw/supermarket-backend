const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user.email, visible: 'true' }).sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, category, quantity, price, costPrice, unit } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name required' });
    const product = new Product({
      userId: req.user.email, id: 'P' + uuidv4().slice(0, 8).toUpperCase(),
      name, category: category || '', quantity: Number(quantity) || 0, price: Number(price) || 0,
      costPrice: Number(costPrice) || 0, unit: unit || '',
      dateAdded: new Date().toISOString().split('T')[0],
    });
    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Product.findOneAndUpdate({ userId: req.user.email, id: req.params.id }, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { permanent } = req.query;
    if (permanent === 'true') {
      const deleted = await Product.findOneAndDelete({ userId: req.user.email, id: req.params.id });
      if (!deleted) return res.status(404).json({ success: false, message: 'Product not found' });
      res.json({ success: true, message: 'Permanently deleted' });
    } else {
      const hidden = await Product.findOneAndUpdate({ userId: req.user.email, id: req.params.id }, { visible: 'false' }, { new: true });
      if (!hidden) return res.status(404).json({ success: false, message: 'Product not found' });
      res.json({ success: true, message: 'Hidden from view' });
    }
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
