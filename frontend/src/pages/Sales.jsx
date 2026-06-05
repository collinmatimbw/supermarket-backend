import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, ShoppingCart, Trash2, Filter, Download, MessageCircle, Phone, DollarSign, X, Cloud } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { LoadingState, EmptyState } from '../components/LoadingState';
import api from '../utils/api';
import { formatCurrency, formatDate, exportToCSV, sendWhatsApp, formatReceipt, formatDebtReminder } from '../utils/helpers';
import { enqueueSale, getPendingSales } from '../utils/offlineQueue';

const emptyCartItem = { productId: '', productName: '', quantity: 1, price: 0, total: 0, profit: 0 };

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [saving, setSaving] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentSale, setPaymentSale] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [customerName, setCustomerName] = useState('Walk-in');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState(0);
  const [soldBy, setSoldBy] = useState('');
  const [sendReceipt, setSendReceipt] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      api.get('/sales'),
      api.get('/products'),
      api.get('/customers'),
      api.get('/employees'),
      getPendingSales(),
    ]).then(([s, p, c, e, pending]) => {
      const serverSales = s.data.data || [];
      const allSales = [...pending.filter(ps => ps._pending), ...serverSales];
      setSales(allSales);
      setProducts(p.data.data);
      setCustomers(c.data.data);
      setEmployees(e.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = paymentFilter === 'all' ? sales : sales.filter(s => s.paymentMethod === paymentFilter);
  const searched = filtered.filter(s =>
    !search || s.productName?.toLowerCase().includes(search.toLowerCase()) || s.customerName?.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (pid) => {
    const p = products.find(pr => pr.id === pid);
    if (!p) return;
    const stock = p.quantity || 0;
    if (stock <= 0) return toast.error(`${p.name} is out of stock`);

    const existing = cart.find(i => i.productId === pid);
    if (existing) {
      if (existing.quantity + 1 > stock) return toast.error(`Only ${stock} of ${p.name} in stock`);
      setCart(cart.map(i => i.productId === pid
        ? { ...i, quantity: i.quantity + 1, total: p.price * (i.quantity + 1), profit: ((p.price - (p.costPrice || 0)) * (i.quantity + 1)) }
        : i
      ));
    } else {
      setCart([...cart, {
        productId: p.id, productName: p.name, quantity: 1, price: p.price,
        total: p.price, profit: p.price - (p.costPrice || 0),
      }]);
    }
  };

  const updateCartQty = (pid, qty) => {
    const p = products.find(pr => pr.id === pid);
    if (!p) return;
    const stock = p.quantity || 0;
    const quantity = Math.min(Math.max(1, Number(qty) || 1), stock);
    setCart(cart.map(i => i.productId === pid
      ? { ...i, quantity, total: p.price * quantity, profit: (p.price - (p.costPrice || 0)) * quantity }
      : i
    ));
  };

  const removeFromCart = (pid) => setCart(cart.filter(i => i.productId !== pid));

  const cartTotal = cart.reduce((s, i) => s + i.total, 0);
  const cartProfit = cart.reduce((s, i) => s + i.profit, 0);

  const stockErrors = cart.map(item => {
    const p = products.find(pr => pr.id === item.productId);
    const stock = p ? (p.quantity || 0) : 0;
    return { productId: item.productId, name: item.productName, qty: item.quantity, stock, overstock: item.quantity > stock };
  });
  const hasOverstock = stockErrors.some(e => e.overstock);

  const openNewSale = () => {
    setCart([]);
    setCustomerName('Walk-in');
    setCustomerPhone('');
    setPaymentMethod('cash');
    setPaidAmount(0);
    setSoldBy('');
    setSendReceipt(false);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (cart.length === 0) return toast.error('Add at least one product');
    if (hasOverstock) return toast.error('Some products exceed available stock');

    const payload = {
      items: cart,
      customerName, customerPhone,
      paymentMethod,
      paidAmount: paymentMethod === 'credit' ? Number(paidAmount) : cartTotal,
      soldBy,
    };

    if (!navigator.onLine) {
      const localSale = await enqueueSale(payload);
      toast.success('Sale saved offline — will sync when connected');
      setModalOpen(false);
      setSales(prev => [localSale, ...prev]);
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post('/sales', payload);
      if (sendReceipt && data.data) {
        sendWhatsApp(customerPhone, formatReceipt(data.data));
      }
      toast.success('Sale recorded');
      setModalOpen(false);
      load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sale?')) return;
    try { await api.delete(`/sales/${id}`); toast.success('Sale deleted'); load(); } catch (e) { toast.error(e.message); }
  };

  const openPayment = (sale) => {
    setPaymentSale(sale);
    setPaymentAmount(sale.balance);
    setPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!paymentSale || paymentAmount <= 0) return toast.error('Enter payment amount');
    try {
      await api.put(`/sales/${paymentSale.id}/payment`, { paidAmount: paymentAmount });
      toast.success('Payment recorded');
      setPaymentModal(false);
      setPaymentSale(null);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (loading) return <LoadingState message="Loading sales..." />;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Sales</h1>
          <p className="text-sm text-slate-500 mt-0.5">{sales.length} transactions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(sales, 'sales-export', [
            { label: 'Date', key: 'date' },
            { label: 'Product', key: 'productName' },
            { label: 'Quantity', key: 'quantity' },
            { label: 'Total', key: 'total' },
            { label: 'Profit', key: 'profit' },
            { label: 'Payment', key: 'paymentMethod' },
            { label: 'Status', key: 'paymentStatus' },
            { label: 'Balance', key: 'balance' },
            { label: 'Customer', key: 'customerName' },
          ])} className="btn-ghost text-sm px-3 py-2.5">
            <Download size={16} className="mr-1.5" />Export
          </button>
          <button onClick={openNewSale} className="btn-primary text-sm px-5 py-2.5 text-base">
            <Plus size={18} className="mr-1.5" />New Sale
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="form-input pl-9" placeholder="Search sales..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {['all', 'cash', 'mobile', 'credit'].map(p => (
            <button key={p} onClick={() => setPaymentFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${paymentFilter === p ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {searched.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
          <ShoppingCart size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No sales found</p>
          <button onClick={openNewSale} className="btn-primary text-sm mt-4">Record your first sale</button>
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Product</th>
                  <th className="text-center py-3 px-4 font-medium">Qty</th>
                  <th className="text-right py-3 px-4 font-medium">Total</th>
                  <th className="text-right py-3 px-4 font-medium">Profit</th>
                  <th className="text-center py-3 px-4 font-medium">Payment</th>
                  <th className="text-center py-3 px-4 font-medium">Status</th>
                  <th className="text-center py-3 px-4 font-medium">Sold By</th>
                  <th className="text-center py-3 px-4 font-medium">Customer</th>
                  <th className="text-center py-3 px-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {searched.map(sale => (
                  <tr key={sale.id} className="border-b border-slate-700/50 hover:bg-white/5">
                    <td className="py-3 px-4 text-slate-400 text-xs">{sale.date}</td>
                    <td className="py-3 px-4 text-white font-medium">
                      <div className="flex items-center gap-2">
                        {sale.items && sale.items.length > 1
                          ? <span>{sale.items.length} items</span>
                          : sale.productName}
                        {sale._pending && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium flex items-center gap-1"><Cloud size={10} />Pending</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-300">{sale.quantity}</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-medium">{formatCurrency(sale.total)}</td>
                    <td className="py-3 px-4 text-right text-emerald-400">{formatCurrency(sale.profit)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${sale.paymentMethod === 'cash' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${sale.paymentStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : sale.paymentStatus === 'partial' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {sale.paymentStatus === 'paid' ? 'Paid' : sale.paymentStatus === 'partial' ? `${formatCurrency(sale.balance)} due` : 'Debt'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400 text-xs">{sale.soldBy || '—'}</td>
                    <td className="py-3 px-4 text-center text-slate-400 text-xs">
                      <div className="flex items-center justify-center gap-1">
                        <span>{sale.customerName}</span>
                        {sale.customerName && sale.customerName !== 'Walk-in' && sale.balance > 0 && (
                          <button onClick={() => sendWhatsApp(sale.customerPhone || '', formatDebtReminder(sale))}
                            className="p-1 rounded text-green-400 hover:bg-green-500/10 transition-colors" title="Send debt reminder">
                            <MessageCircle size={11} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {sale.balance > 0 && (
                          <button onClick={() => openPayment(sale)}
                            className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors" title="Record payment">
                            <DollarSign size={13} />
                          </button>
                        )}
                        {sale.customerPhone && (
                          <button onClick={() => sendWhatsApp(sale.customerPhone, formatReceipt(sale))}
                            className="p-1.5 rounded-lg text-green-500 hover:bg-green-500/10 transition-colors" title="Send WhatsApp receipt">
                            <MessageCircle size={12} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(sale.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Sale" size="lg">
        <div className="space-y-4">
          {/* Product Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Add Products</label>
            <select className="form-input" value="" onChange={e => { if (e.target.value) { addToCart(e.target.value); e.target.value = ''; } }}>
              <option value="">Select product to add...</option>
              {products.filter(p => (p.quantity || 0) > 0).map(p => (
                <option key={p.id} value={p.id}>{p.name} - TZS {p.price.toLocaleString()} (Stock: {p.quantity})</option>
              ))}
              {products.filter(p => (p.quantity || 0) <= 0).length > 0 && (
                <optgroup label="— Out of Stock —">
                  {products.filter(p => (p.quantity || 0) <= 0).map(p => (
                    <option key={p.id} value={p.id} disabled>{p.name} (0 in stock)</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Cart Items */}
          {cart.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cart ({cart.length} items)</p>
              {cart.map(item => {
                const err = stockErrors.find(e => e.productId === item.productId);
                const oos = err && err.overstock;
                return (
                <div key={item.productId} className={`flex items-center gap-2 p-2.5 rounded-xl ${oos ? 'bg-red-500/10 border border-red-500/30' : 'bg-white/5'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.productName}</p>
                    <p className={`text-xs ${oos ? 'text-red-400' : 'text-slate-500'}`}>
                      TZS {item.price.toLocaleString()} each{oos ? ` · Stock: ${err.stock}` : ` · ${err.stock} left`}
                    </p>
                  </div>
                  <input className={`form-input w-16 text-center text-sm py-1.5 px-2 ${oos ? 'border-red-500/50 text-red-400' : ''}`} type="number" min={1} max={err?.stock || 9999} value={item.quantity}
                    onChange={e => updateCartQty(item.productId, e.target.value)} />
                  <p className={`text-sm font-semibold w-20 text-right ${oos ? 'text-red-400' : 'text-emerald-400'}`}>{formatCurrency(item.total)}</p>
                  <button onClick={() => removeFromCart(item.productId)} className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors">
                    <X size={14} />
                  </button>
                </div>
                );
              })}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-sm font-semibold text-white">Total</span>
                <span className="text-lg font-bold text-emerald-400">{formatCurrency(cartTotal)}</span>
              </div>
            </div>
          )}

          {cart.length === 0 && (
            <div className="p-6 rounded-xl bg-white/5 text-center">
              <ShoppingCart size={24} className="mx-auto mb-2 text-slate-500" />
              <p className="text-sm text-slate-500">No products added yet</p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Customer</label>
            <select className="form-input" value={customerName} onChange={e => {
              const c = customers.find(c => c.name === e.target.value);
              setCustomerName(e.target.value);
              setCustomerPhone(c?.phone || '');
            }}>
              <option value="Walk-in">Walk-in Customer</option>
              {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          {(customerName && customerName !== 'Walk-in') && (
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Customer Phone</label>
              <input className="form-input" placeholder="Phone for WhatsApp receipt" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Payment Method</label>
            <div className="flex gap-2">
              {['cash', 'mobile', 'credit'].map(m => (
                <button key={m} onClick={() => { setPaymentMethod(m); if (m !== 'credit') setPaidAmount(0); }}
                  className={`flex-1 p-2.5 rounded-xl text-xs font-medium capitalize transition-all ${paymentMethod === m ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          {paymentMethod === 'credit' && (
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Amount Paid Now (TZS)</label>
              <input className="form-input" type="number" min={0} max={cartTotal} placeholder="0" value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))} />
              {Number(paidAmount) < cartTotal && (
                <p className="text-xs text-yellow-400 mt-1">Balance: {formatCurrency(cartTotal - Number(paidAmount))}</p>
              )}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Sold By</label>
            {employees.length > 0 ? (
              <select className="form-input" value={soldBy} onChange={e => setSoldBy(e.target.value)}>
                <option value="">Select employee</option>
                {employees.filter(e => e.status === 'active').map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
              </select>
            ) : (
              <input className="form-input" placeholder="Employee name (optional)" value={soldBy} onChange={e => setSoldBy(e.target.value)} />
            )}
          </div>
          {customerName && customerName !== 'Walk-in' && customerPhone && (
            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 cursor-pointer">
              <input type="checkbox" checked={sendReceipt} onChange={e => setSendReceipt(e.target.checked)}
                className="rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500" />
              <span className="text-xs text-slate-300">Send WhatsApp receipt to customer</span>
            </label>
          )}
          <button onClick={handleSave} className="btn-primary w-full justify-center py-3 text-base" disabled={saving || cart.length === 0 || hasOverstock}>
            {saving ? 'Recording...' : hasOverstock ? 'Some items exceed stock' : `Complete Sale (${cart.length} item${cart.length > 1 ? 's' : ''})`}
          </button>
        </div>
      </Modal>

      <Modal open={paymentModal} onClose={() => setPaymentModal(false)} title="Record Payment">
        <div className="space-y-4">
          {paymentSale && (
            <>
              <div className="p-3 rounded-xl bg-white/5">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Product</span>
                  <span className="text-white">{paymentSale.items?.length > 1 ? `${paymentSale.items.length} items` : paymentSale.productName}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Customer</span>
                  <span className="text-white">{paymentSale.customerName}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Total</span>
                  <span className="text-emerald-400">{formatCurrency(paymentSale.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Balance Due</span>
                  <span className="text-red-400 font-bold">{formatCurrency(paymentSale.balance)}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Amount Paying (TZS)</label>
                <input className="form-input" type="number" min={1} max={paymentSale.balance} value={paymentAmount}
                  onChange={e => setPaymentAmount(Math.min(Number(e.target.value), paymentSale.balance))} />
              </div>
              <button onClick={handlePayment} className="btn-primary w-full justify-center">
                {paymentAmount >= paymentSale.balance ? 'Mark as Paid' : `Record Partial Payment (${formatCurrency(paymentAmount)})`}
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
