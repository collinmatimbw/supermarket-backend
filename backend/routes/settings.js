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
    const [
      products, sales, customers, suppliers,
      expenses, capital, employees, leads, tasks,
    ] = await Promise.all([
      Product.find({ userId: req.user.email }).lean(),
      Sale.find({ userId: req.user.email }).lean(),
      Customer.find({ userId: req.user.email }).lean(),
      Supplier.find({ userId: req.user.email }).lean(),
      Expense.find({ userId: req.user.email }).lean(),
      Capital.find({ userId: req.user.email }).lean(),
      Employee.find({ userId: req.user.email }).lean(),
      Lead.find({ userId: req.user.email }).lean(),
      Task.find({ userId: req.user.email }).lean(),
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(products.map(p => ({ id: p.id, Name: p.name, Category: p.category || '', Quantity: p.quantity || 0, Price: p.price || 0, CostPrice: p.costPrice || 0, Barcode: p.barcode || '', Supplier: p.supplier || '' }))), 'products');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sales.map(s => ({ id: s.id, Date: s.date, Customer: s.customerName || '', CustomerPhone: s.customerPhone || '', Items: JSON.stringify(s.items || [{ productName: s.productName, quantity: s.quantity, price: s.price, total: s.total }]), Total: s.total || 0, Profit: s.profit || 0, PaymentMethod: s.paymentMethod || '', PaymentStatus: s.paymentStatus || '', PaidAmount: s.paidAmount || 0, Balance: s.balance || 0, SoldBy: s.soldBy || '' }))), 'sales');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(customers.map(c => ({ id: c.id, Name: c.name, Phone: c.phone || '', Email: c.email || '', Address: c.address || '' }))), 'customers');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(suppliers.map(s => ({ id: s.id, Name: s.name, Phone: s.phone || '', Product: s.product || '', Email: s.email || '' }))), 'suppliers');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenses.map(e => ({ id: e.id, Name: e.name, Category: e.category || '', Amount: e.amount || 0, Date: e.date || '', PaymentMethod: e.paymentMethod || '', Notes: e.notes || '' }))), 'expenses');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(capital.map(c => ({ id: c.id, Amount: c.amount || 0, Source: c.source || '', Date: c.date || '', Notes: c.notes || '' }))), 'capital');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(employees.map(e => ({ id: e.id, Name: e.name, Phone: e.phone || '', Email: e.email || '', Role: e.role || '', BaseSalary: e.baseSalary || 0, CommissionRate: e.commissionRate || 0, TargetSales: e.targetSales || 0, DateHired: e.dateHired || '', Status: e.status || 'active', Notes: e.notes || '' }))), 'employees');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(leads.map(l => ({ id: l.id, Name: l.name, Phone: l.phone || '', Email: l.email || '', Stage: l.stage || 'new', DateAdded: l.dateAdded || '', Notes: l.notes || '' }))), 'leads');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tasks.map(t => ({ id: t.id, Title: t.title, Description: t.description || '', Type: t.type || 'general', DueDate: t.dueDate || '', Priority: t.priority || 'medium', Done: t.done || 'false', DateAdded: t.dateAdded || '' }))), 'tasks');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=skycrm-all-data.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/import-excel', async (req, res) => {
  try {
    const userId = req.user.email;
    if (!req.files || !req.files.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const wb = XLSX.read(req.files.file.data, { type: 'buffer' });
    const results = { imported: {}, errors: [] };

    const SHEET_MODELS = {
      products: Product, sales: Sale, customers: Customer, suppliers: Supplier,
      expenses: Expense, capital: Capital, employees: Employee, leads: Lead, tasks: Task,
    };

    for (const [sheetName, Model] of Object.entries(SHEET_MODELS)) {
      if (!wb.SheetNames.includes(sheetName)) { results.imported[sheetName] = 0; continue; }
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
      if (rows.length === 0) { results.imported[sheetName] = 0; continue; }

      let imported = 0;
      for (const row of rows) {
        try {
          const doc = { userId };
          for (const [key, val] of Object.entries(row)) {
            const k = key.charAt(0).toLowerCase() + key.slice(1);
            doc[k] = val;
          }
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
          results.errors.push(`${sheetName}: ${e.message}`);
        }
      }
      results.imported[sheetName] = imported;
    }

    const total = Object.values(results.imported).reduce((s, v) => s + v, 0);
    res.json({ success: true, data: results, totalImported: total });
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
