const { google } = require('googleapis');

const SHEETS = {
  sky: process.env.GOOGLE_SHEET_ID_SKY,
  lukelo: process.env.GOOGLE_SHEET_ID_LUKELO,
};

const HEADERS = {
  products: ['id', 'name', 'category', 'buyingPrice', 'sellingPrice', 'quantity', 'barcode', 'supplier', 'dateAdded'],
  sales: ['id', 'productId', 'productName', 'quantity', 'price', 'buyingPrice', 'total', 'profit', 'date', 'customerId', 'customerName'],
  customers: ['id', 'name', 'phone', 'email', 'address', 'dateAdded'],
  suppliers: ['id', 'name', 'phone', 'email', 'address', 'productsSupplied', 'dateAdded'],
};

let sheets;
let auth;

async function initSheets() {
  if (sheets) return sheets;

  const authClient = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  auth = authClient;
  sheets = google.sheets({ version: 'v4', auth: authClient });
  return sheets;
}

async function getSheetId(spreadsheetId, sheetName) {
  const s = await initSheets();
  const res = await s.spreadsheets.get({ spreadsheetId });
  const sheet = res.data.sheets.find(s => s.properties.title === sheetName);
  return sheet ? sheet.properties.sheetId : null;
}

async function ensureSheet(spreadsheetId, sheetName, headers) {
  const s = await initSheets();
  let sheetId = await getSheetId(spreadsheetId, sheetName);

  if (!sheetId) {
    await s.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: { properties: { title: sheetName } }
        }]
      }
    });
    sheetId = await getSheetId(spreadsheetId, sheetName);
  }

  const existing = await readSheet(spreadsheetId, sheetName);
  if (existing.length === 0 && headers) {
    await s.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] }
    });
  }
  return sheetId;
}

async function readSheet(spreadsheetId, sheetName) {
  const s = await initSheets();
  await ensureSheet(spreadsheetId, sheetName, HEADERS[sheetName]);

  const res = await s.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
  });

  const rows = res.data.values || [];
  if (rows.length <= 1) return [];

  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] || ''; });
    return obj;
  });
}

async function writeSheet(spreadsheetId, sheetName, data) {
  const s = await initSheets();
  const headers = HEADERS[sheetName];
  const values = [headers, ...data.map(row => headers.map(h => String(row[h] || '')))];

  await s.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
    valueInputOption: 'RAW',
    requestBody: { values }
  });
}

async function appendRow(spreadsheetId, sheetName, row) {
  const s = await initSheets();
  await ensureSheet(spreadsheetId, sheetName, HEADERS[sheetName]);

  const headers = HEADERS[sheetName];
  const values = [headers.map(h => String(row[h] || ''))];

  await s.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
    valueInputOption: 'RAW',
    requestBody: { values }
  });
  return row;
}

async function updateRow(spreadsheetId, sheetName, id, updates) {
  const data = await readSheet(spreadsheetId, sheetName);
  const idx = data.findIndex(r => r.id === id);
  if (idx === -1) return null;

  data[idx] = { ...data[idx], ...updates };
  await writeSheet(spreadsheetId, sheetName, data);
  return data[idx];
}

async function deleteRow(spreadsheetId, sheetName, id) {
  const data = await readSheet(spreadsheetId, sheetName);
  const filtered = data.filter(r => r.id !== id);
  if (filtered.length === data.length) return false;

  await writeSheet(spreadsheetId, sheetName, filtered);
  return true;
}

async function clearSheet(spreadsheetId, sheetName) {
  const s = await initSheets();
  await ensureSheet(spreadsheetId, sheetName, HEADERS[sheetName]);

  await s.spreadsheets.values.clear({
    spreadsheetId,
    range: `${sheetName}!A2:Z`,
  });
}

module.exports = {
  readSheet, writeSheet, appendRow, updateRow, deleteRow, clearSheet,
  ensureSheet, initSheets, HEADERS, SHEETS
};
