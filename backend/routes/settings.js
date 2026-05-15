const express = require('express');
const router = express.Router();
const path = require('path');
const { clearSheet, FILES, readExcel } = require('../helpers/excel');
const XLSX = require('xlsx');

// Export all data as a single Excel backup
router.get('/export', (req, res) => {
  try {
    const wb = XLSX.utils.book_new();
    ['products', 'sales', 'customers'].forEach(type => {
      const data = readExcel(type);
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, type.charAt(0).toUpperCase() + type.slice(1));
    });
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=supermarket-backup.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Clear sales history
router.delete('/sales', (req, res) => {
  try {
    clearSheet('sales');
    res.json({ success: true, message: 'Sales history cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// System info
router.get('/info', (req, res) => {
  try {
    const products = readExcel('products');
    const sales = readExcel('sales');
    const customers = readExcel('customers');
    res.json({
      success: true,
      data: {
        version: '1.0.0',
        totalProducts: products.length,
        totalSales: sales.length,
        totalCustomers: customers.length,
        storageLocation: path.resolve('../../excel'),
        nodeVersion: process.version,
        uptime: Math.floor(process.uptime()),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
