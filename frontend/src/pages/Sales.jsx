import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Search, Receipt, Trash2, ShoppingCart, Printer, Package, Check, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { LoadingState, EmptyState } from '../components/LoadingState';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saleModal, setSaleModal] = useState(false);
  const [receiptModal, setReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [form, setForm] = useState({
    productName: '',
    category: 'General',
    quantity: 1,
    price: '',
    buyingPrice: '',
    customerName: '',
    customerId: '',
    supplier: '',
  });

  const productInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const load = useCallback(() => {
    Promise.all([
      api.get('/sales'),
      api.get('/products'),
      api.get('/customers'),
    ]).then(([s, p, c]) => {
      setSales(s.data.data);
      setProducts(p.data.data);
      setCustomers(c.data.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProductDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const lineTotal = Number(form.price || 0) * Number(form.quantity || 0);
  const profit = lineTotal - (Number(form.buyingPrice || 0) * Number(form.quantity || 0));

  const matchedProducts = form.productName.trim()
    ? products.filter(p => p.name.toLowerCase().includes(form.productName.toLowerCase()))
    : products;

  const selectProduct = (p) => {
    setForm({
      ...form,
      productName: p.name,
      category: p.category || 'General',
      price: p.sellingPrice || '',
      buyingPrice: p.buyingPrice || '',
      supplier: p.supplier || form.supplier,
    });
    setProductDropdownOpen(false);
  };

  const handleProductNameChange = (e) => {
    setForm({ ...form, productName: e.target.value });
    setProductDropdownOpen(true);
  };

  const handleSale = async () => {
    if (!form.productName.trim()) return toast.error('Enter product name');
    if (!form.quantity || form.quantity < 1) return toast.error('Quantity must be at least 1');
    if (!form.price) return toast.error('Enter selling price');
    setSaving(true);
    try {
      const r = await api.post('/sales', {
        productName: form.productName.trim(),
        category: form.category,
        quantity: form.quantity,
        price: form.price,
        buyingPrice: form.buyingPrice || 0,
        customerName: form.customerName || (customers.find(c => c.id === form.customerId)?.name) || 'Walk-in Customer',
        customerId: form.customerId,
        supplier: form.supplier,
      });
      toast.success('Sale recorded!');
      setSaleModal(false);
      setForm({ productName: '', category: 'General', quantity: 1, price: '', buyingPrice: '', customerName: '', customerId: '', supplier: '' });
      setReceiptData(r.data.data);
      setReceiptModal(true);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sale record?')) return;
    try {
      await api.delete(`/sales/${id}`);
      toast.success('Sale deleted');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const filtered = sales.filter(s =>
    !search ||
    s.productName?.toLowerCase().includes(search.toLowerCase()) ||
    s.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    s.id?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = filtered.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const totalProfit = filtered.reduce((sum, s) => sum + Number(s.profit || 0), 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Sales"
        subtitle={`${sales.length} transactions · ${formatCurrency(totalRevenue)} revenue · ${formatCurrency(totalProfit)} profit`}
        action={
          <button className="btn-primary" onClick={() => setSaleModal(true)}>
            <Plus size={15} /> Record Sale
          </button>
        }
      />

      <div className="glass p-3 sm:p-4 mb-4">
        <div className="relative w-full sm:max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="form-input pl-9" placeholder="Search by product, customer, ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="glass overflow-hidden">
        {loading ? <LoadingState /> : filtered.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="No sales yet" subtitle="Record your first sale to get started"
            action={<button className="btn-primary" onClick={() => setSaleModal(true)}><Plus size={14} />Record Sale</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sale ID</th>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>Profit</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...filtered].reverse().map(s => (
                  <tr key={s.id}>
                    <td className="font-mono text-xs text-slate-500">{s.id}</td>
                    <td className="text-slate-200 font-medium text-sm">{s.productName}</td>
                    <td className="text-slate-400">{s.customerName || '—'}</td>
                    <td><span className="badge badge-blue">{s.quantity}</span></td>
                    <td className="font-mono text-xs text-slate-400">{formatCurrency(s.price)}</td>
                    <td className="font-mono font-bold text-emerald-400">{formatCurrency(s.total)}</td>
                    <td className={`font-mono font-bold text-xs ${Number(s.profit) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(s.profit || 0)}
                    </td>
                    <td className="text-slate-500 text-xs">{formatDate(s.date)}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn-edit" onClick={() => { setReceiptData(s); setReceiptModal(true); }}>
                          <Receipt size={12} />
                        </button>
                        <button className="btn-danger" onClick={() => handleDelete(s.id)}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className="text-right text-xs font-semibold text-slate-400 pr-4 py-3">TOTAL SHOWN:</td>
                  <td className="font-mono font-bold text-emerald-400 py-3">{formatCurrency(totalRevenue)}</td>
                  <td className="font-mono font-bold text-green-400 py-3">{formatCurrency(totalProfit)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <Modal open={saleModal} onClose={() => setSaleModal(false)} title="Record New Sale">
        <div className="space-y-4">
          <div ref={dropdownRef} className="relative">
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Product Name *</label>
            <div className="relative">
              <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                ref={productInputRef}
                className="form-input pl-9 pr-9"
                placeholder="Type to search or enter new product..."
                value={form.productName}
                onChange={handleProductNameChange}
                onFocus={() => setProductDropdownOpen(true)}
                autoFocus
              />
              {form.productName && products.some(p => p.name.toLowerCase() === form.productName.toLowerCase()) && (
                <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" />
              )}
            </div>

            {productDropdownOpen && matchedProducts.length > 0 && (
              <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden border border-white/10"
                style={{ background: '#1e293b', maxHeight: '200px', overflowY: 'auto' }}>
                {matchedProducts.map(p => (
                  <button
                    key={p.id}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors flex items-center justify-between"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    onClick={() => selectProduct(p)}
                  >
                    <div>
                      <span className="text-slate-200 text-sm font-medium">{p.name}</span>
                      <span className="text-slate-500 text-xs ml-2">({p.category})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">Stock: {p.quantity}</span>
                      <span className="text-emerald-400 text-sm font-semibold">{formatCurrency(p.sellingPrice)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {productDropdownOpen && form.productName.trim() && matchedProducts.length === 0 && (
              <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden border border-white/10"
                style={{ background: '#1e293b' }}>
                <div className="px-4 py-3 text-sm text-slate-400">
                  <Package size={14} className="inline mr-2" />
                  New product — will be auto-created on sale
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Category</label>
              <select className="form-input" value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="General">General</option>
                <option value="Grains">Grains</option>
                <option value="Oils">Oils</option>
                <option value="Dairy">Dairy</option>
                <option value="Beverages">Beverages</option>
                <option value="Snacks">Snacks</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Spices">Spices</option>
                <option value="Condiments">Condiments</option>
                <option value="Sweeteners">Sweeteners</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Quantity *</label>
              <input className="form-input" type="number" min="1" value={form.quantity}
                onChange={e => setForm({ ...form, quantity: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Selling Price (TZS) *</label>
              <input className="form-input" type="number" min="0" placeholder="0" value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Buying Price (optional)</label>
              <input className="form-input" type="number" min="0" placeholder="0" value={form.buyingPrice}
                onChange={e => setForm({ ...form, buyingPrice: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Supplier (optional)</label>
            <input className="form-input" placeholder="Supplier name" value={form.supplier}
              onChange={e => setForm({ ...form, supplier: e.target.value })} />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Customer (optional)</label>
            <select className="form-input" value={form.customerId}
              onChange={e => setForm({ ...form, customerId: e.target.value, customerName: customers.find(c => c.id === e.target.value)?.name || '' })}>
              <option value="">Walk-in Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {form.productName && form.price && (
            <div className="p-4 rounded-xl" style={{ background: 'rgba(110,231,183,0.06)', border: '1px solid rgba(110,231,183,0.15)' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400 font-medium">Order Total</span>
                <span className="text-2xl font-bold text-emerald-400">{formatCurrency(lineTotal)}</span>
              </div>
              {form.buyingPrice && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Estimated Profit</span>
                  <span className={`text-lg font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(profit)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button className="btn-secondary flex-1" onClick={() => setSaleModal(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleSale} disabled={saving}>
              {saving ? 'Processing...' : '✓ Confirm Sale'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={receiptModal} onClose={() => setReceiptModal(false)} title="Sale Receipt" maxWidth="420px">
        {receiptData && (
          <div>
            <div id="receipt" className="p-6 rounded-xl text-center" style={{ background: '#0a0f1e', border: '1px dashed rgba(255,255,255,0.12)' }}>
              <img src="/mylogo.png" alt="SKYC CRM" className="w-14 h-14 mx-auto mb-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }} />
              <p className="font-bold text-xl text-slate-100 tracking-wide">SKYC CRM</p>
              <p className="text-xs text-slate-500 mb-1">Supermarket Management System</p>
              <p className="text-xs text-slate-600">123 Market Street, Dar es Salaam</p>
              <p className="text-xs text-slate-600 mb-4">Tel: +255 700 000 000</p>

              <div className="text-xs text-slate-400 mb-4 space-y-1 bg-white/5 rounded-xl p-3">
                <div className="flex justify-between">
                  <span>Receipt #</span>
                  <span className="font-mono text-slate-200 font-semibold">{receiptData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date</span>
                  <span className="text-slate-200">{formatDate(receiptData.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time</span>
                  <span className="text-slate-200">{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer</span>
                  <span className="text-slate-200">{receiptData.customerName || 'Walk-in Customer'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier</span>
                  <span className="text-slate-200">System</span>
                </div>
              </div>

              <div className="border-t border-dashed border-white/10 pt-3 mb-3">
                <div className="flex items-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-2 border-b border-dashed border-white/8">
                  <span className="flex-[3] text-left">Item</span>
                  <span className="w-10 text-center">Qty</span>
                  <span className="w-16 text-right">Price</span>
                  <span className="w-20 text-right">Total</span>
                </div>
                <div className="flex items-center py-3 text-sm text-slate-200 border-b border-dashed border-white/8">
                  <span className="flex-[3] text-left font-medium">{receiptData.productName}</span>
                  <span className="w-10 text-center text-slate-300">{receiptData.quantity}</span>
                  <span className="w-16 text-right font-mono text-slate-400">{formatCurrency(receiptData.price)}</span>
                  <span className="w-20 text-right font-mono text-emerald-400 font-bold">{formatCurrency(receiptData.total)}</span>
                </div>
              </div>

              <div className="border-t-2 border-double border-white/10 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="font-mono text-slate-200">{formatCurrency(Number(receiptData.price) * Number(receiptData.quantity))}</span>
                </div>
                <div className="flex justify-between items-center border-t border-dashed border-white/10">
                  <span className="font-bold text-lg text-slate-100">TOTAL (TZS)</span>
                  <span className="text-2xl font-bold text-emerald-400">{formatCurrency(receiptData.total)}</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-dashed border-white/10">
                <p className="text-[13px] text-slate-400 font-medium">Thank you for shopping with us!</p>
                <p className="text-[10px] text-slate-600 mt-1">Goods once sold are not returnable</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button className="btn-secondary flex-1" onClick={() => setReceiptModal(false)}>Close</button>
              <button className="btn-primary flex-1" onClick={() => window.print()}>
                <Printer size={14} /> Print
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
