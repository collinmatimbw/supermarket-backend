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

export const sendWhatsApp = (phone, message) => {
  if (!phone) return;
  const cleaned = phone.replace(/[^0-9]/g, '');
  const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

export const formatReceipt = (sale, businessName = 'SKYC CRM') => {
  const itemLines = sale.items && sale.items.length > 0
    ? sale.items.map(i => `  ${i.productName} × ${i.quantity} = TZS ${(i.total || 0).toLocaleString()}`).join('\n')
    : `  ${sale.productName || 'N/A'} × ${sale.quantity} = TZS ${(sale.total || 0).toLocaleString()}`;
  const lines = [
    `🧾 *${businessName}*`,
    `─────────────────`,
    itemLines,
    `─────────────────`,
    `Total: TZS ${(sale.total || 0).toLocaleString()}`,
    `Payment: ${(sale.paymentMethod || 'cash').toUpperCase()}`,
    sale.balance > 0 ? `Balance Due: TZS ${sale.balance.toLocaleString()}` : '',
    `─────────────────`,
    `Date: ${sale.date || new Date().toISOString().split('T')[0]}`,
    `Thank you for your purchase!`,
  ].filter(Boolean).join('\n');
  return lines;
};

export const formatDebtReminder = (sale, businessName = 'SKYC CRM') => {
  const itemList = sale.items && sale.items.length > 0
    ? sale.items.map(i => `  ${i.productName} × ${i.quantity}`).join('\n')
    : `  ${sale.productName || 'N/A'} × ${sale.quantity}`;
  return [
    `🔔 *Payment Reminder - ${businessName}*`,
    `─────────────────`,
    `Dear ${sale.customerName || 'Customer'},`,
    ``,
    `This is a reminder of your outstanding balance:`,
    itemList,
    `Total: TZS ${(sale.total || 0).toLocaleString()}`,
    `Paid: TZS ${(sale.paidAmount || 0).toLocaleString()}`,
    `*Balance: TZS ${(sale.balance || 0).toLocaleString()}*`,
    ``,
    `Please clear the balance at your earliest convenience.`,
    `─────────────────`,
    `${businessName}`,
  ].join('\n');
};

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
