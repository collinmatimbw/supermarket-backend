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

export const exportToCSV = (data, filename, columns) => {
  if (!data || data.length === 0) return;
  const headers = columns.map(c => c.label).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      let val = c.accessor ? c.accessor(row) : row[c.key];
      if (val == null) val = '';
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    }).join(',')
  );
  const csv = [headers, ...rows].join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
