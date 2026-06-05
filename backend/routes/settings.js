const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Expense = require('../models/Expense');
const Capital = require('../models/Capital');
const Employee = require('../models/Employee');
const Lead = require('../models/Lead');
const Task = require('../models/Task');

const MODELS = {
  products: Product,
  sales: Sale,
  customers: Customer,
  suppliers: Supplier,
  expenses: Expense,
  capital: Capital,
  employees: Employee,
  leads: Lead,
  tasks: Task,
};

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

router.get('/export-json', async (req, res) => {
  try {
    const userId = req.user.email;
    const entries = {};
    for (const [key, Model] of Object.entries(MODELS)) {
      const docs = await Model.find({ userId }).lean();
      entries[key] = docs.map(d => { const { _id, __v, ...rest } = d; return rest; });
    }
    const payload = { exportedAt: new Date().toISOString(), userId, ...entries };
    res.setHeader('Content-Disposition', 'attachment; filename=skycrm-data.json');
    res.setHeader('Content-Type', 'application/json');
    res.json(payload);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/import-json', async (req, res) => {
  try {
    const userId = req.user.email;
    const { data } = req.body;
    if (!data || typeof data !== 'object') return res.status(400).json({ success: false, message: 'Invalid import data' });

    const results = { imported: {}, skipped: {}, errors: [] };

    for (const [key, Model] of Object.entries(MODELS)) {
      const items = data[key];
      if (!Array.isArray(items) || items.length === 0) {
        results.imported[key] = 0;
        continue;
      }

      let imported = 0;
      for (const item of items) {
        try {
          const doc = { ...item, userId };
          delete doc._id;
          delete doc.__v;
          if (doc.id) {
            await Model.findOneAndUpdate(
              { userId, id: doc.id },
              { $set: doc },
              { upsert: true, new: true }
            );
          } else {
            await new Model(doc).save();
          }
          imported++;
        } catch (e) {
          results.errors.push(`${key}: ${e.message}`);
        }
      }
      results.imported[key] = imported;
    }

    res.json({ success: true, data: results });
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
