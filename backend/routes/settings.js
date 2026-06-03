const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');

router.get('/export', async (req, res) => {
  try {
    const [products, sales, customers, suppliers] = await Promise.all([
      Product.find({ userId: req.user.email }),
      Sale.find({ userId: req.user.email }),
      Customer.find({ userId: req.user.email }),
      Supplier.find({ userId: req.user.email }),
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(products.map(p => ({ Name: p.name, Category: p.category, Quantity: p.quantity, Price: p.price, Cost: p.costPrice }))), 'Products');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sales.map(s => ({ Date: s.date, Product: s.productName, Quantity: s.quantity, Total: s.total, Profit: s.profit, Customer: s.customerName }))), 'Sales');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(customers.map(c => ({ Name: c.name, Phone: c.phone, Email: c.email, Address: c.address }))), 'Customers');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(suppliers.map(s => ({ Name: s.name, Phone: s.phone, Product: s.product }))), 'Suppliers');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=supermarket-backup.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/sales', async (req, res) => {
  try {
    await Sale.deleteMany({ userId: req.user.email });
    res.json({ success: true, message: 'Sales cleared' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/info', async (req, res) => {
  try {
    const [products, sales, customers] = await Promise.all([
      Product.countDocuments({ userId: req.user.email }),
      Sale.countDocuments({ userId: req.user.email }),
      Customer.countDocuments({ userId: req.user.email }),
    ]);
    res.json({ success: true, data: { version: '3.0.0', totalProducts: products, totalSales: sales, totalCustomers: customers, storageType: 'MongoDB', nodeVersion: process.version, uptime: Math.floor(process.uptime()) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
