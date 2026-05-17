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
const cache = new Map();
const CACHE_TTL = 120000;
const pending = new Map();

async function initSheets() {
  if (sheets) return sheets;
  try {
    const authClient = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    sheets = google.sheets({ version: 'v4', auth: authClient });
    console.log('✅ Google Sheets initialized');
    return sheets;
  } catch (err) {
    console.error('❌ Google Sheets init failed:', err.message);
    throw err;
  }
}

function cacheKey(spreadsheetId, sheetName) {
  return `${spreadsheetId}:${sheetName}`;
}

function setCache(spreadsheetId, sheetName, data) {
  cache.set(cacheKey(spreadsheetId, sheetName), { data, ts: Date.now() });
}

function invalidate(spreadsheetId, sheetName) {
  const key = cacheKey(spreadsheetId, sheetName);
  cache.delete(key);
  pending.delete(key);
  if (!sheetName) {
    for (const k of [...cache.keys()]) {
      if (k.startsWith(spreadsheetId + ':')) {
        cache.delete(k);
        pending.delete(k);
      }
    }
  }
}

async function ensureSheetExists(spreadsheetId, sheetName) {
  const s = await initSheets();
  try {
    const res = await s.spreadsheets.get({ spreadsheetId, fields: 'sheets(properties/title)' });
    const exists = res.data.sheets?.some(s => s.properties.title === sheetName);
    if (!exists) {
      console.log(`📝 Creating sheet: ${sheetName}`);
      await s.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title: sheetName } } }] }
      });
      await s.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [HEADERS[sheetName]] }
      });
    }
  } catch (err) {
    if (err.code === 403) throw new Error(`Permission denied. Share spreadsheet with service account as Editor.`);
    if (err.code === 404) throw new Error(`Spreadsheet not found: ${spreadsheetId}`);
    throw err;
  }
}

async function readSheet(spreadsheetId, sheetName) {
  const key = cacheKey(spreadsheetId, sheetName);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  if (pending.has(key)) return pending.get(key);

  const promise = (async () => {
    try {
      await ensureSheetExists(spreadsheetId, sheetName);
      const s = await initSheets();
      console.log(`📖 Reading: ${sheetName}`);
      const res = await s.spreadsheets.values.get({ spreadsheetId, range: `${sheetName}!A:Z` });
      const rows = res.data.values || [];
      console.log(`📊 ${sheetName}: ${rows.length} rows`);

      const expected = HEADERS[sheetName];
      if (!expected || rows.length === 0) {
        setCache(spreadsheetId, sheetName, []);
        return [];
      }

      // Detect if row 1 is a header row (contains expected column names)
      const firstRow = rows[0] || [];
      console.log(`🔍 First row: ${JSON.stringify(firstRow)}`);
      const hasHeaderRow = firstRow.some(v => expected.includes(v));
      console.log(`🔍 Has header row: ${hasHeaderRow}, Expected headers: ${expected.join(', ')}`);
      const dataRows = hasHeaderRow ? rows.slice(1) : rows;

      const data = dataRows.map(row => {
        const obj = {};
        expected.forEach((h, i) => { obj[h] = (row[i] || '').toString(); });
        return obj;
      });

      console.log(`✅ ${sheetName}: ${data.length} records${hasHeaderRow ? '' : ' (no header row)'}`);
      setCache(spreadsheetId, sheetName, data);
      return data;
    } catch (err) {
      console.error(`❌ Read error ${sheetName}:`, err.message);
      if (err.code === 403) throw new Error(`Permission denied. Share spreadsheet with service account as Editor.`);
      if (err.code === 429) throw new Error('API quota exceeded. Wait a moment.');
      throw err;
    } finally {
      pending.delete(key);
    }
  })();

  pending.set(key, promise);
  return promise;
}

async function readMultipleSheets(spreadsheetId, sheetNames) {
  const results = {};
  await Promise.all(sheetNames.map(name => ensureSheetExists(spreadsheetId, name)));
  const s = await initSheets();
  const ranges = sheetNames.map(name => `${name}!A:Z`);
  console.log(`📖 Batch reading: ${sheetNames.join(', ')}`);
  try {
    const res = await s.spreadsheets.values.batchGet({ spreadsheetId, ranges });
    res.data.valueRanges.forEach((vr, i) => {
      const sheetName = sheetNames[i];
      const rows = vr.values || [];
      console.log(`📊 ${sheetName}: ${rows.length} rows`);

      const expected = HEADERS[sheetName];
      if (!expected || rows.length === 0) {
        results[sheetName] = [];
        return;
      }

      const hasHeaderRow = rows[0].some(v => expected.includes(v));
      const dataRows = hasHeaderRow ? rows.slice(1) : rows;

      const data = dataRows.map(row => {
        const obj = {};
        expected.forEach((h, j) => { obj[h] = (row[j] || '').toString(); });
        return obj;
      });

      console.log(`✅ ${sheetName}: ${data.length} records${hasHeaderRow ? '' : ' (no header row)'}`);
      setCache(spreadsheetId, sheetName, data);
      results[sheetName] = data;
    });
  } catch (err) {
    console.error('❌ Batch read error:', err.message);
    if (err.code === 403) throw new Error(`Permission denied. Share spreadsheet with service account as Editor.`);
    if (err.code === 429) throw new Error('API quota exceeded. Wait a moment.');
    throw err;
  }
  return results;
}

async function writeSheet(spreadsheetId, sheetName, data) {
  const s = await initSheets();
  const headers = HEADERS[sheetName];
  const values = [headers, ...data.map(row => headers.map(h => String(row[h] || '')))];
  await s.spreadsheets.values.update({ spreadsheetId, range: `${sheetName}!A:Z`, valueInputOption: 'RAW', requestBody: { values } });
  setCache(spreadsheetId, sheetName, data);
}

async function appendRow(spreadsheetId, sheetName, row) {
  await ensureSheetExists(spreadsheetId, sheetName);
  const s = await initSheets();
  const headers = HEADERS[sheetName];
  await s.spreadsheets.values.append({ spreadsheetId, range: `${sheetName}!A:Z`, valueInputOption: 'RAW', requestBody: { values: [headers.map(h => String(row[h] || ''))] } });
  invalidate(spreadsheetId, sheetName);
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
  await ensureSheetExists(spreadsheetId, sheetName);
  const s = await initSheets();
  await s.spreadsheets.values.clear({ spreadsheetId, range: `${sheetName}!A2:Z` });
  invalidate(spreadsheetId, sheetName);
}

async function testConnection(spreadsheetId) {
  try {
    const s = await initSheets();
    await s.spreadsheets.get({ spreadsheetId, fields: 'properties/title' });
    return { success: true, message: 'Connected' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

module.exports = { readSheet, writeSheet, appendRow, updateRow, deleteRow, clearSheet, readMultipleSheets, ensureSheetExists, initSheets, HEADERS, SHEETS, invalidate, testConnection };
