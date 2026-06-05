import api from './api';
import { addToQueue, getPendingQueue, removeFromQueue, saveLocalSale, getLocalSales, removeLocalSale } from './db';

export async function enqueueSale(saleData) {
  const localId = 'LOCAL-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
  const localSale = {
    id: localId,
    items: saleData.items,
    productName: saleData.items?.[0]?.productName || 'Pending',
    quantity: saleData.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0,
    total: saleData.items?.reduce((s, i) => s + (i.total || 0), 0) || 0,
    profit: saleData.items?.reduce((s, i) => s + (i.profit || 0), 0) || 0,
    customerName: saleData.customerName || 'Walk-in',
    customerPhone: saleData.customerPhone || '',
    paymentMethod: saleData.paymentMethod || 'cash',
    paymentStatus: 'pending',
    paidAmount: saleData.paidAmount || 0,
    balance: (saleData.items?.reduce((s, i) => s + (i.total || 0), 0) || 0) - (saleData.paidAmount || 0),
    soldBy: saleData.soldBy || '',
    date: new Date().toISOString().split('T')[0],
    _pending: true,
  };
  await saveLocalSale(localSale);
  await addToQueue({ type: 'sale', payload: saleData, localId });
  return localSale;
}

export async function getPendingSales() {
  return getLocalSales();
}

export async function syncPending() {
  const queue = await getPendingQueue();
  const results = { synced: 0, failed: 0, errors: [] };

  for (const entry of queue) {
    if (entry.synced) continue;
    try {
      if (entry.type === 'sale') {
        await api.post('/sales', entry.payload);
      }
      await removeFromQueue(entry.id);
      if (entry.localId) await removeLocalSale(entry.localId);
      results.synced++;
    } catch (e) {
      results.failed++;
      results.errors.push(e.message);
    }
  }

  return results;
}
