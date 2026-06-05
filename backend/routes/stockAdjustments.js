const express = require('express');
const router = express.Router();
const StockAdjustment = require('../models/StockAdjustment');
const Product = require('../models/Product');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const adjustments = await StockAdjustment.find({ userId: req.user.email }).sort({ date: -1, createdAt: -1 });
    res.json({ success: true, data: adjustments });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { productId, productName, newQuantity, reason, notes } = req.body;
    if (!productName || newQuantity === undefined) return res.status(400).json({ success: false, message: 'Product name and quantity required' });

    const product = await Product.findOne({ userId: req.user.email, name: productName });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const previousQuantity = product.quantity;
    const change = Number(newQuantity) - previousQuantity;

    const adjustment = new StockAdjustment({
      userId: req.user.email, id: 'SA' + uuidv4().slice(0, 8).toUpperCase(),
      productId: product.id, productName,
      previousQuantity, newQuantity: Number(newQuantity), change,
      reason: reason || 'other', notes: notes || '',
      date: new Date().toISOString().split('T')[0],
    });
    await adjustment.save();

    product.quantity = Number(newQuantity);
    await product.save();

    res.status(201).json({ success: true, data: adjustment });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await StockAdjustment.findOneAndDelete({ userId: req.user.email, id: req.params.id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Adjustment not found' });
    res.json({ success: true, message: 'Adjustment deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
