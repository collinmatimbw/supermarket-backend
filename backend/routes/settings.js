const express = require('express');
const router = express.Router();
const path = require('path');
const { clearSheet, FILES, readExcel } = require('../helpers/excel');
const XLSX = require('xlsx');

// Export all data as a single Excel backup
router.get('/export', (req, res) => {
  try {
    const wb = XLSX.utils.book_new();

    // Data sheets
    ['products', 'sales', 'customers', 'suppliers'].forEach(type => {
      const data = readExcel(type);
      const ws = XLSX.utils.json_to_sheet(data);
      const sheetName = type.charAt(0).toUpperCase() + type.slice(1);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    // Summary dashboard sheet
    const sales = readExcel('sales');
    const products = readExcel('products');
    const customers = readExcel('customers');
    const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const totalProfit = sales.reduce((sum, s) => sum + (Number(s.profit) || 0), 0);
    const totalCost = sales.reduce((sum, s) => sum + (Number(s.buyingPrice) || 0) * (Number(s.quantity) || 0), 0);

    const catRevenue = {};
    sales.forEach(s => {
      const prod = products.find(p => p.id === s.productId);
      const cat = prod ? prod.category : 'General';
      catRevenue[cat] = (catRevenue[cat] || 0) + Number(s.total);
    });

    const prodSales = {};
    sales.forEach(s => {
      prodSales[s.productName] = (prodSales[s.productName] || 0) + Number(s.total);
    });
    const topProducts = Object.entries(prodSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, revenue], i) => ({ rank: i + 1, product: name, revenue }));

    const today = new Date();
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const daySales = sales.filter(s => s.date === key);
      last7.push({
        date: key,
        revenue: daySales.reduce((sum, s) => sum + (Number(s.total) || 0), 0),
        profit: daySales.reduce((sum, s) => sum + (Number(s.profit) || 0), 0),
        transactions: daySales.length,
      });
    }

    const margin = totalRevenue ? (totalProfit / totalRevenue) * 100 : 0;

    // Build dashboard sheet using array of arrays for precise layout
    const DASH_COLS = ['A', 'B', 'C', 'D', 'E', 'F'];
    const DARK = '1E293B';
    const ACCENT = '3B82F6';
    const GREEN = '10B981';
    const ROSE = 'F43F5E';
    const AMBER = 'F59E0B';
    const WHITE = 'FFFFFF';
    const LIGHT_BG = 'F8FAFC';

    function styleCell(ws, addr, opts) {
      if (!ws[addr]) ws[addr] = { t: 's', v: '' };
      ws[addr].s = { ...ws[addr].s, ...opts };
    }

    function styleRange(ws, startRow, endRow, startCol, endCol, opts) {
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          styleCell(ws, addr, opts);
        }
      }
    }

    const rows = [];
    let r = 0;

    // ── TITLE ROW ──
    rows[r] = ['SKYC CRM Dashboard', '', '', '', '', ''];
    r++;

    // ── KPI ROW ──
    rows[r] = ['Total Products', 'Total Sales', 'Total Customers', 'Total Revenue', 'Total Profit', 'Margin'];
    r++;

    rows[r] = [products.length, sales.length, customers.length, totalRevenue, totalProfit, `${margin.toFixed(1)}%`];
    r++; r++;

    // ── DAILY REVENUE TABLE ──
    rows[r] = ['Daily Revenue (Last 7 Days)', '', '', '', '', ''];
    r++;

    rows[r] = ['Date', 'Revenue', 'Profit', 'Transactions', '', ''];
    const dailyHeaderRow = r;
    r++;

    last7.forEach(d => {
      rows[r] = [d.date, d.revenue, d.profit, d.transactions, '', ''];
      r++;
    });

    // Total row
    const lastDailyRow = r;
    rows[r] = ['TOTAL', '', '', '', '', ''];
    r++; r++;

    // ── CATEGORY REVENUE ──
    rows[r] = ['Revenue by Category', '', '', '', '', ''];
    r++;

    rows[r] = ['Category', 'Revenue', '', '', '', ''];
    const catHeaderRow = r;
    r++;

    Object.entries(catRevenue).forEach(([cat, rev]) => {
      rows[r] = [cat, rev, '', '', '', ''];
      r++;
    });

    const lastCatRow = r;
    rows[r] = ['TOTAL', '', '', '', '', ''];
    r++; r++;

    // ── TOP 10 PRODUCTS ──
    rows[r] = ['Top 10 Products by Revenue', '', '', '', '', ''];
    r++;

    rows[r] = ['Rank', 'Product', 'Revenue', '', '', ''];
    r++;

    topProducts.forEach(p => {
      rows[r] = [p.rank, p.product, p.revenue, '', '', ''];
      r++;
    });

    // Build the worksheet
    const wsSummary = XLSX.utils.aoa_to_sheet(rows);

    // ── Apply all styles (we need to re-apply since aoa_to_sheet resets) ──
    r = 0;
    // Title
    styleRange(wsSummary, r, r, 0, 5, { font: { bold: true, color: { rgb: WHITE }, sz: 18 }, fill: { fgColor: { rgb: DARK } }, alignment: { horizontal: 'center', vertical: 'middle' } });
    r++;

    // KPI header
    styleRange(wsSummary, r, r, 0, 5, { font: { bold: true, color: { rgb: WHITE }, sz: 10 }, fill: { fgColor: { rgb: ACCENT } }, alignment: { horizontal: 'center' } });
    r++;

    // KPI values
    styleRange(wsSummary, r, r, 0, 2, { font: { bold: true, sz: 14, color: { rgb: ACCENT } }, alignment: { horizontal: 'center' }, fill: { fgColor: { rgb: 'EFF6FF' } } });
    styleRange(wsSummary, r, r, 3, 4, { font: { bold: true, sz: 14, color: { rgb: GREEN } }, alignment: { horizontal: 'center' }, fill: { fgColor: { rgb: 'ECFDF5' } }, numFmt: '"$"#,##0.00' });
    styleCell(wsSummary, 'F' + (r + 1), { font: { bold: true, sz: 14, color: { rgb: AMBER } }, alignment: { horizontal: 'center' }, fill: { fgColor: { rgb: 'FFFBEB' } } });
    r++; r++;

    // Daily Revenue section
    const kpiEnd = r;
    styleRange(wsSummary, r, r, 0, 3, { font: { bold: true, color: { rgb: WHITE }, sz: 12 }, fill: { fgColor: { rgb: DARK } } });
    r++;
    styleRange(wsSummary, r, r, 0, 3, { font: { bold: true, color: { rgb: WHITE } }, fill: { fgColor: { rgb: '475569' } }, alignment: { horizontal: 'center' } });
    r++;

    last7.forEach((d, i) => {
      styleRange(wsSummary, r, r, 0, 3, { fill: { fgColor: { rgb: i % 2 === 0 ? LIGHT_BG : WHITE } }, alignment: { horizontal: 'center' } });
      styleCell(wsSummary, 'B' + (r + 1), { numFmt: '"$"#,##0.00' });
      styleCell(wsSummary, 'C' + (r + 1), { numFmt: '"$"#,##0.00' });
      r++;
    });

    // Daily total row with formulas
    const drStart = dailyHeaderRow + 2;
    const drEnd = lastDailyRow;
    styleRange(wsSummary, r, r, 0, 3, { font: { bold: true, color: { rgb: WHITE } }, fill: { fgColor: { rgb: DARK } }, alignment: { horizontal: 'center' } });
    wsSummary['B' + (r + 1)] = { t: 'n', f: `SUM(B${drStart}:B${drEnd})` };
    wsSummary['C' + (r + 1)] = { t: 'n', f: `SUM(C${drStart}:C${drEnd})` };
    wsSummary['D' + (r + 1)] = { t: 'n', f: `SUM(D${drStart}:D${drEnd})` };
    r++; r++;

    // Category section
    styleRange(wsSummary, r, r, 0, 1, { font: { bold: true, color: { rgb: WHITE }, sz: 12 }, fill: { fgColor: { rgb: DARK } } });
    r++;
    styleRange(wsSummary, r, r, 0, 1, { font: { bold: true, color: { rgb: WHITE } }, fill: { fgColor: { rgb: '475569' } }, alignment: { horizontal: 'center' } });
    const catHdrR = r;
    r++;

    const catEntries = Object.entries(catRevenue);
    catEntries.forEach(([cat, rev], i) => {
      styleCell(wsSummary, 'A' + (r + 1), { fill: { fgColor: { rgb: i % 2 === 0 ? LIGHT_BG : WHITE } } });
      styleCell(wsSummary, 'B' + (r + 1), { numFmt: '"$"#,##0.00', fill: { fgColor: { rgb: i % 2 === 0 ? LIGHT_BG : WHITE } } });
      r++;
    });

    // Category total with formula
    const catDataStart = catHdrR + 2;
    const catDataEnd = r;
    styleRange(wsSummary, r, r, 0, 1, { font: { bold: true, color: { rgb: WHITE } }, fill: { fgColor: { rgb: DARK } }, alignment: { horizontal: 'center' } });
    wsSummary['B' + (r + 1)] = { t: 'n', f: `SUM(B${catDataStart}:B${catDataEnd})` };
    r++; r++;

    // Top 10 section
    styleRange(wsSummary, r, r, 0, 2, { font: { bold: true, color: { rgb: WHITE }, sz: 12 }, fill: { fgColor: { rgb: DARK } } });
    r++;
    styleRange(wsSummary, r, r, 0, 2, { font: { bold: true, color: { rgb: WHITE } }, fill: { fgColor: { rgb: '475569' } }, alignment: { horizontal: 'center' } });
    r++;

    topProducts.forEach((p, i) => {
      styleRange(wsSummary, r, r, 0, 2, { fill: { fgColor: { rgb: i % 2 === 0 ? LIGHT_BG : WHITE } }, alignment: { horizontal: 'center' } });
      styleCell(wsSummary, 'C' + (r + 1), { numFmt: '"$"#,##0.00' });
      r++;
    });

    // ── Merges ──
    wsSummary['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },    // Title
    ];

    // ── Column widths ──
    wsSummary['!cols'] = [
      { wch: 22 }, { wch: 20 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Dashboard');

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
