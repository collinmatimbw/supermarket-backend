const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Sale = require('../models/Sale');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find({ userId: req.user.email, visible: 'true' }).sort({ createdAt: -1 });
    const sales = await Sale.find({ userId: req.user.email });
    const enriched = employees.map(emp => {
      const empSales = sales.filter(s => s.soldBy === emp.name);
      const totalSales = empSales.reduce((s, sale) => s + Number(sale.total || 0), 0);
      const commission = totalSales * (emp.commissionRate || 0) / 100;
      return { ...emp.toObject(), totalSales, commission };
    });
    res.json({ success: true, data: enriched });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, role, baseSalary, commissionRate, targetSales, dateHired, notes } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name required' });
    const employee = new Employee({
      userId: req.user.email, id: 'EMP' + uuidv4().slice(0, 8).toUpperCase(),
      name, phone: phone || '', email: email || '', role: role || 'Cashier',
      baseSalary: Number(baseSalary) || 0, commissionRate: Number(commissionRate) || 0,
      targetSales: Number(targetSales) || 0, dateHired: dateHired || new Date().toISOString().split('T')[0],
      notes: notes || '',
    });
    await employee.save();
    res.status(201).json({ success: true, data: employee });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Employee.findOneAndUpdate({ userId: req.user.email, id: req.params.id }, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Employee not found' });
    const sales = await Sale.find({ userId: req.user.email, soldBy: updated.name });
    const totalSales = sales.reduce((s, sale) => s + Number(sale.total || 0), 0);
    const commission = totalSales * (updated.commissionRate || 0) / 100;
    res.json({ success: true, data: { ...updated.toObject(), totalSales, commission } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Employee.findOneAndUpdate({ userId: req.user.email, id: req.params.id }, { visible: 'false' }, { new: true });
    if (!deleted) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, message: 'Employee removed' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/performance', async (req, res) => {
  try {
    const employees = await Employee.find({ userId: req.user.email, visible: 'true', status: 'active' });
    const sales = await Sale.find({ userId: req.user.email });
    const period = req.query.period || 'month';
    const now = new Date();
    let startDate;
    if (period === 'month') { startDate = new Date(now.getFullYear(), now.getMonth(), 1); }
    else if (period === 'week') { startDate = new Date(now); startDate.setDate(now.getDate() - now.getDay()); }
    else { startDate = new Date(0); }
    const filtered = sales.filter(s => new Date(s.date) >= startDate);
    const performance = employees.map(emp => {
      const empSales = filtered.filter(s => s.soldBy === emp.name);
      const totalSales = empSales.reduce((s, sale) => s + Number(sale.total || 0), 0);
      const totalProfit = empSales.reduce((s, sale) => s + Number(sale.profit || 0), 0);
      const transactions = empSales.length;
      const targetProgress = emp.targetSales > 0 ? Math.min(100, Math.round((totalSales / emp.targetSales) * 100)) : 0;
      const commission = totalSales * (emp.commissionRate || 0) / 100;
      return { name: emp.name, role: emp.role, totalSales, totalProfit, transactions, targetSales: emp.targetSales, targetProgress, commission };
    });
    res.json({ success: true, data: performance.sort((a, b) => b.totalSales - a.totalSales) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
