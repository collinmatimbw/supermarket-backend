export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('sw-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export const formatNumber = (n) =>
  new Intl.NumberFormat().format(n || 0);

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const LOW_STOCK_THRESHOLD = 10;

export const isLowStock = (qty) => Number(qty) <= LOW_STOCK_THRESHOLD;

export const CATEGORIES = [
  'All', 'Grains', 'Oils', 'Dairy', 'Sweeteners', 'Beverages',
  'Spices', 'Condiments', 'Snacks', 'Cleaning', 'Personal Care', 'Other'
];
