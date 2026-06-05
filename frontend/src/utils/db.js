const DB_NAME = 'skyc-crm-offline';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('queue')) {
        const store = db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
      }
      if (!db.objectStoreNames.contains('localSales')) {
        db.createObjectStore('localSales', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addToQueue(item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readwrite');
    tx.objectStore('queue').add({ ...item, synced: false, createdAt: new Date().toISOString() });
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getPendingQueue() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readonly');
    const store = tx.objectStore('queue');
    const index = store.index('synced');
    const range = IDBKeyRange.only(false);
    const items = [];
    index.openCursor(range).onsuccess = e => {
      const cursor = e.target.result;
      if (cursor) { items.push(cursor.value); cursor.continue(); }
      else { db.close(); resolve(items); }
    };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function markAsSynced(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readwrite');
    const store = tx.objectStore('queue');
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const item = getReq.result;
      if (item) { item.synced = true; store.put(item); }
    };
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function removeFromQueue(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readwrite');
    tx.objectStore('queue').delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function saveLocalSale(sale) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('localSales', 'readwrite');
    tx.objectStore('localSales').put(sale);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getLocalSales() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('localSales', 'readonly');
    const store = tx.objectStore('localSales');
    const items = [];
    store.openCursor().onsuccess = e => {
      const cursor = e.target.result;
      if (cursor) { items.push(cursor.value); cursor.continue(); }
      else { db.close(); resolve(items); }
    };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function removeLocalSale(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('localSales', 'readwrite');
    tx.objectStore('localSales').delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function clearLocalSales() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('localSales', 'readwrite');
    tx.objectStore('localSales').clear();
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
