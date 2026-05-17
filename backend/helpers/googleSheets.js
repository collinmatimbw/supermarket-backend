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
const CACHE_TTL = 120000; // 2 minutes
const pending = new Map();

async function initSheets() {
  if (sheets) return sheets;
  
  try {
    const authClient = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    sheets = google.sheets({ version: 'v4', auth: authClient });
    console.log('✅ Google Sheets initialized successfully');
    return sheets;
  } catch (err) {
    console.error('❌ Failed to initialize Google Sheets:', err.message);
    throw new Error(`Google Sheets auth failed: ${err.message}`);
  }
}

function cacheKey(spreadsheetId, sheetName) {
  return `${spreadsheetId}:${sheetName}`;
}

function getFromCache(spreadsheetId, sheetName) {
  const key = cacheKey(spreadsheetId, sheetName);
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(spreadsheetId, sheetName, data) {
  cache.set(cacheKey(spreadsheetId, sheetName), { data, ts: Date.now() });
}

function invalidate(spreadsheetId, sheetName) {
  const key = cacheKey(spreadsheetId, sheetName);
  cache.delete(key);
  pending.delete(key); // Clear pending requests too
  if (!sheetName) {
    for (const k of cache.keys()) {
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
    if (err.code === 403) {
      throw new Error(`Permission denied. Make sure the service account has Editor access to spreadsheet: ${spreadsheetId}`);
    }
    if (err.code === 404) {
      throw new Error(`Spreadsheet not found: ${spreadsheetId}. Check your GOOGLE_SHEET_ID env vars.`);
    }
    throw err;
  }
}

async function readSheet(spreadsheetId, sheetName) {
  const cached = getFromCache(spreadsheetId, sheetName);
  if (cached) return cached;

  const key = cacheKey(spreadsheetId, sheetName);
  if (pending.has(key)) return pending.get(key);

  const promise = (async () => {
    try {
      await ensureSheetExists(spreadsheetId, sheetName);
      const s = await initSheets();
      const res = await s.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:Z`,
      });
      const rows = res.data.values || [];
      if (rows.length <= 1) {
        setCache(spreadsheetId, sheetName, []);
        return [];
      }
      const headers = rows[0];
      const data = rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = row[i] || ''; });
        return obj;
      });
      setCache(spreadsheetId, sheetName, data);
      return data;
    } catch (err) {
      if (err.code === 403) {
        throw new Error(`Permission denied for sheet ${sheetName}. Share the spreadsheet with the service account email as Editor.`);
      }
      if (err.code === 429) {
        throw new Error('Google Sheets API quota exceeded. Please wait a moment and try again.');
      }
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
  const uncached = sheetNames.filter(name => !getFromCache(spreadsheetId, name));

  if (uncached.length > 0) {
    await Promise.all(uncached.map(name => ensureSheetExists(spreadsheetId, name)));
    const s = await initSheets();
    const ranges = uncached.map(name => `${name}!A:Z`);
    
    try {
      const res = await s.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges,
      });

      res.data.valueRanges.forEach((vr, i) => {
        const sheetName = uncached[i];
        const rows = vr.values || [];
        if (rows.length <= 1) {
          setCache(spreadsheetId, sheetName, []);
          results[sheetName] = [];
        } else {
          const headers = rows[0];
          const data = rows.slice(1).map(row => {
            const obj = {};
            headers.forEach((h, j) => { obj[h] = row[j] || ''; });
            return obj;
          });
          setCache(spreadsheetId, sheetName, data);
          results[sheetName] = data;
        }
      });
    } catch (err) {
      if (err.code === 403) {
        throw new Error(`Permission denied. Share the spreadsheet with the service account email as Editor.`);
      }
      if (err.code === 429) {
        throw new Error('Google Sheets API quota exceeded. Please wait and try again.');
      }
      throw err;
    }
  }

  sheetNames.forEach(name => {
    if (!results[name]) results[name] = getFromCache(spreadsheetId, name);
  });

  return results;
}

async function writeSheet(spreadsheetId, sheetName, data) {
  const s = await initSheets();
  const headers = HEADERS[sheetName];
  const values = [headers, ...data.map(row => headers.map(h => String(row[h] || '')))];
  
  try {
    await s.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'RAW',
      requestBody: { values }
    });
    setCache(spreadsheetId, sheetName, data);
  } catch (err) {
    if (err.code === 403) {
      throw new Error(`Permission denied. Share the spreadsheet with the service account email as Editor.`);
    }
    throw err;
  }
}

async function appendRow(spreadsheetId, sheetName, row) {
  await ensureSheetExists(spreadsheetId, sheetName);
  const s = await initSheets();
  const headers = HEADERS[sheetName];
  
  try {
    await s.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers.map(h => String(row[h] || ''))] }
    });
    invalidate(spreadsheetId, sheetName);
    return row;
  } catch (err) {
    if (err.code === 403) {
      throw new Error(`Permission denied. Share the spreadsheet with the service account email as Editor.`);
    }
    if (err.code === 429) {
      throw new Error('Google Sheets API quota exceeded. Please wait and try again.');
    }
    throw err;
  }
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
    return { success: true, message: 'Connection successful' };
  } catch (err) {
    return { 
      success: false, 
      message: err.message,
      hint: err.code === 403 ? 'Share spreadsheet with service account email as Editor' :
             err.code === 404 ? 'Check spreadsheet ID in env vars' :
             'Unknown error'
    };
  }
}

module.exports = {
  readSheet, writeSheet, appendRow, updateRow, deleteRow, clearSheet,
  readMultipleSheets, ensureSheetExists, initSheets, HEADERS, SHEETS, 
  invalidate, testConnection
};
