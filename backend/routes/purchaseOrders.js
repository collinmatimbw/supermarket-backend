const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const orders = await PurchaseOrder.find({ userId: req.user.email }).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { supplierId, supplierName, items, expectedDate, notes } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'At least one item required' });
    const totalAmount = items.reduce((s, i) => s + (i.unitPrice || 0) * (i.quantity || 0), 0);
    const order = new PurchaseOrder({
      userId: req.user.email, id: 'PO' + uuidv4().slice(0, 8).toUpperCase(),
      supplierId: supplierId || '', supplierName: supplierName || '',
      items: items.map(i => ({ ...i, total: (i.unitPrice || 0) * (i.quantity || 0) })),
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: expectedDate || '', totalAmount, notes: notes || '', status: 'pending',
    });
    await order.save();
    res.status(201).json({ success: true, data: order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { status, items, supplierId, supplierName, expectedDate, notes } = req.body;
    const order = await PurchaseOrder.findOne({ userId: req.user.email, id: req.params.id });
    if (!order) return res.status(404).json({ success: false, message: 'Purchase order not found' });

    if (status === 'received' && order.status !== 'received' && order.status !== 'cancelled') {
      for (const item of (items || order.items)) {
        const product = await Product.findOne({ userId: req.user.email, name: item.productName });
        if (product) {
          await Product.findOneAndUpdate(
            { userId: req.user.email, _id: product._id },
            { $inc: { quantity: item.quantity } }
          );
        }
      }
      order.receivedDate = new Date().toISOString().split('T')[0];
    }

    if (status) order.status = status;
    if (items) order.items = items.map(i => ({ ...i, total: (i.unitPrice || 0) * (i.quantity || 0) }));
    if (supplierId !== undefined) order.supplierId = supplierId;
    if (supplierName !== undefined) order.supplierName = supplierName;
    if (expectedDate !== undefined) order.expectedDate = expectedDate;
    if (notes !== undefined) order.notes = notes;
    if (items) order.totalAmount = order.items.reduce((s, i) => s + i.total, 0);

    await order.save();
    res.json({ success: true, data: order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await PurchaseOrder.findOneAndDelete({ userId: req.user.email, id: req.params.id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Purchase order not found' });
    res.json({ success: true, message: 'Purchase order deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
