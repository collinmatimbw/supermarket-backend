const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const EXCEL_DIR = path.join(__dirname, '../../excel');

const FILES = {
  products: path.join(EXCEL_DIR, 'products.xlsx'),
  sales: path.join(EXCEL_DIR, 'sales.xlsx'),
  customers: path.join(EXCEL_DIR, 'customers.xlsx'),
  suppliers: path.join(EXCEL_DIR, 'suppliers.xlsx'),
};

const HEADERS = {
  products: ['id', 'name', 'category', 'buyingPrice', 'sellingPrice', 'quantity', 'barcode', 'supplier', 'dateAdded'],
  sales: ['id', 'productId', 'productName', 'quantity', 'price', 'buyingPrice', 'total', 'profit', 'date', 'customerId', 'customerName'],
  customers: ['id', 'name', 'phone', 'email', 'address', 'dateAdded'],
  suppliers: ['id', 'name', 'phone', 'email', 'address', 'productsSupplied', 'dateAdded'],
};

function ensureExcelDir() {
  if (!fs.existsSync(EXCEL_DIR)) {
    fs.mkdirSync(EXCEL_DIR, { recursive: true });
  }
}

function initExcelFile(type) {
  ensureExcelDir();
  const filePath = FILES[type];
  if (!fs.existsSync(filePath)) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([HEADERS[type]]);
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[addr]) continue;
      ws[addr].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
        fill: { fgColor: { rgb: '1E293B' } },
        alignment: { horizontal: 'center' },
      };
    }
    ws['!autofilter'] = { ref: ws['!ref'] };
    XLSX.utils.book_append_sheet(wb, ws, type);
    XLSX.writeFile(wb, filePath);
  }
}

function readExcel(type) {
  initExcelFile(type);
  const wb = XLSX.readFile(FILES[type]);
  const ws = wb.Sheets[type];
  if (!ws) return [];
  const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
  return data;
}

function writeExcel(type, data) {
  ensureExcelDir();
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data, { header: HEADERS[type] });
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let C = range.s.c; C <= range.e.c; C++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[addr]) continue;
    ws[addr].s = { font: { bold: true }, fill: { fgColor: { rgb: '1E293B' } } };
  }
  ws['!autofilter'] = { ref: ws['!ref'] };
  XLSX.utils.book_append_sheet(wb, ws, type);
  XLSX.writeFile(wb, FILES[type]);
}

function appendRow(type, row) {
  const data = readExcel(type);
  data.push(row);
  writeExcel(type, data);
  return row;
}

function updateRow(type, id, updates) {
  const data = readExcel(type);
  const idx = data.findIndex(r => r.id === id);
  if (idx === -1) return null;
  data[idx] = { ...data[idx], ...updates };
  writeExcel(type, data);
  return data[idx];
}

function deleteRow(type, id) {
  const data = readExcel(type);
  const filtered = data.filter(r => r.id !== id);
  if (filtered.length === data.length) return false;
  writeExcel(type, filtered);
  return true;
}

function clearSheet(type) {
  writeExcel(type, []);
}

function findProductByName(name) {
  const products = readExcel('products');
  return products.find(p => p.name.toLowerCase() === name.toLowerCase());
}

function findOrCreateProduct(name, category, sellingPrice, buyingPrice, supplier) {
  let product = findProductByName(name);
  if (!product) {
    product = {
      id: 'P' + require('uuid').v4().slice(0, 8).toUpperCase(),
      name,
      category: category || 'General',
      buyingPrice: Number(buyingPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      quantity: 0,
      barcode: '',
      supplier: supplier || '',
      dateAdded: new Date().toISOString().split('T')[0],
    };
    appendRow('products', product);
  }
  return product;
}

module.exports = { readExcel, writeExcel, appendRow, updateRow, deleteRow, clearSheet, FILES, findProductByName, findOrCreateProduct };
