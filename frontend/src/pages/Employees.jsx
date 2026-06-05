import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Users, Target, DollarSign, TrendingUp, Download, Lock, KeyRound, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { LoadingState, EmptyState } from '../components/LoadingState';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';
import { formatCurrency, exportToCSV } from '../utils/helpers';

const ROLES = ['Owner', 'Manager', 'Cashier', 'Salesperson', 'Admin'];
const emptyForm = { name: '', phone: '', email: '', role: 'Cashier', baseSalary: 0, commissionRate: 0, targetSales: 0, dateHired: '', notes: '' };

export default function Employees() {
  const { t } = useLanguage();
  const [employees, setEmployees] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [perfPeriod, setPerfPeriod] = useState('month');
  const [showPerf, setShowPerf] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [setPinOpen, setSetPinOpen] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const storedPin = localStorage.getItem('skyc_emp_pin') || '';
  const unlocked = sessionStorage.getItem('skyc_emp_unlocked') === 'true';

  const load = useCallback(() => {
    Promise.all([
      api.get('/employees'),
      api.get('/employees/performance'),
    ]).then(([e, p]) => {
      setEmployees(e.data.data);
      setPerformance(p.data.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    return () => {
      sessionStorage.removeItem('skyc_emp_unlocked');
    };
  }, []);

  const loadPerf = (period) => {
    setPerfPeriod(period);
    api.get(`/employees/performance?period=${period}`).then(r => setPerformance(r.data.data));
  };

  const filtered = employees.filter(e =>
    !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.role?.toLowerCase().includes(search.toLowerCase())
  );

  const activeEmployees = employees.filter(e => e.status === 'active');
  const totalCommissions = employees.reduce((s, e) => s + (e.commission || 0), 0);

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm, dateHired: new Date().toISOString().split('T')[0] }); setModalOpen(true); };
  const openEdit = (e) => { setEditing(e); setForm({ name: e.name, phone: e.phone || '', email: e.email || '', role: e.role || 'Cashier', baseSalary: e.baseSalary || 0, commissionRate: e.commissionRate || 0, targetSales: e.targetSales || 0, dateHired: e.dateHired || '', notes: e.notes || '' }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name) return toast.error(t('nameRequired'));
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/employees/${editing.id}`, form);
        toast.success(t('employeeUpdated'));
      } else {
        await api.post('/employees', form);
        toast.success(t('employeeAdded'));
      }
      setModalOpen(false);
      load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`${t('delete')} ${name}?`)) return;
    try { await api.delete(`/employees/${id}`); toast.success(t('employeeRemoved')); load(); } catch (e) { toast.error(e.message); }
  };

  const handlePinUnlock = () => {
    if (pinInput === storedPin) {
      sessionStorage.setItem('skyc_emp_unlocked', 'true');
      setPinError('');
      setPinInput('');
    } else {
      setPinError(t('wrongPin'));
    }
  };

  const handleSetPin = () => {
    if (newPin.length < 4) return toast.error(t('pinMinDigits'));
    if (newPin !== confirmPin) return toast.error(t('pinsDoNotMatch'));
    localStorage.setItem('skyc_emp_pin', newPin);
    setSetPinOpen(false);
    toast.success(t('employeePinSet'));
  };

  const handleRemovePin = () => {
    localStorage.removeItem('skyc_emp_pin');
    sessionStorage.removeItem('skyc_emp_unlocked');
    toast.success(t('employeePinRemoved'));
    setSetPinOpen(false);
  };

  const handleForgotPin = async () => {
    const notif = {
      id: Date.now().toString(),
      title: 'Employee PIN Reset Requested',
      message: 'An employee PIN reset has been requested. Set a new PIN in Settings.',
      type: 'warning',
      read: false,
      createdAt: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem('skyc_notifications') || '[]');
    existing.unshift(notif);
    localStorage.setItem('skyc_notifications', JSON.stringify(existing));
    try {
      await api.post('/notifications', {
        userId: 'skyclamiere@gmail.com',
        title: notif.title,
        message: notif.message,
        type: notif.type,
      });
    } catch {}
    toast.success(t('adminNotified'));
  };

  // PIN Gate
  if (!unlocked && storedPin) {
    return (
      <div className="animate-fade-in min-h-[70vh] flex items-center justify-center">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-emerald-500/20 rounded-3xl blur-xl opacity-60" />
          <div className="relative bg-slate-900/90 border border-slate-700/60 rounded-2xl p-8 max-w-sm w-full text-center backdrop-blur-sm">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Lock size={28} className="text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">{t('sectionLocked')}</h2>
            <p className="text-sm text-slate-500 mb-7">{t('enterPinToView')}</p>
            <input className="form-input text-center text-lg tracking-[0.3em] mb-3 bg-slate-800/80 border-slate-600/50 focus:border-emerald-500/40" type="password" maxLength={6} placeholder={t('pinPlaceholder')} value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePinUnlock()} autoFocus />
            {pinError && <p className="text-xs text-red-400 mb-3 flex items-center justify-center gap-1"><span className="w-1 h-1 rounded-full bg-red-400 inline-block" />{pinError}</p>}
            <button onClick={handlePinUnlock} className="w-full py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 transition-all mb-4">{t('unlock')}</button>
            <button onClick={handleForgotPin} className="text-xs text-slate-600 hover:text-emerald-400 transition-colors">
              <KeyRound size={12} className="mr-1.5 inline-block" />{t('forgotPin')}
            </button>
          </div>
        </div>
        <Modal open={setPinOpen} onClose={() => setSetPinOpen(false)} title={storedPin ? t('changePin') : t('setPin')}>
          <div className="space-y-5">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <Lock size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-relaxed">{t('pinInfoText')}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">{t('newPin')}</label>
              <input className="form-input text-center text-lg tracking-[0.3em] bg-slate-800/80 border-slate-600/50 focus:border-emerald-500/40" type="password" maxLength={6} placeholder={t('pinPlaceholder')} value={newPin} onChange={e => setNewPin(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">{t('confirmPin')}</label>
              <input className="form-input text-center text-lg tracking-[0.3em] bg-slate-800/80 border-slate-600/50 focus:border-emerald-500/40" type="password" maxLength={6} placeholder={t('pinPlaceholder')} value={confirmPin} onChange={e => setConfirmPin(e.target.value)} />
            </div>
            <button onClick={handleSetPin} className="btn-primary w-full justify-center">{storedPin ? t('changePin') : t('setPin')}</button>
            {storedPin && <button onClick={handleRemovePin} className="btn-danger w-full justify-center">{t('removePinLock')}</button>}
          </div>
        </Modal>
      </div>
    );
  }

  if (loading) return <LoadingState message={t('loadingEmployees')} />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={t('employees')} subtitle={`${activeEmployees.length} ${t('active')} · ${formatCurrency(totalCommissions)} ${t('commissionOwed')}`} action={
        <div className="flex gap-2">
          <button onClick={() => setShowPerf(!showPerf)} className={`btn-ghost text-sm ${showPerf ? 'bg-emerald-500/10 text-emerald-400' : ''}`}>
            <TrendingUp size={14} className="mr-1.5" />{showPerf ? t('list') : t('performance')}
          </button>
          <button onClick={() => exportToCSV(employees, 'employees-export', [
            { label: 'Name', key: 'name' },
            { label: 'Role', key: 'role' },
            { label: 'Phone', key: 'phone' },
            { label: 'Base Salary', key: 'baseSalary' },
            { label: 'Commission Rate', key: 'commissionRate', accessor: e => `${e.commissionRate}%` },
            { label: 'Target Sales', key: 'targetSales' },
            { label: 'Sales Achieved', key: 'totalSales' },
            { label: 'Commission Earned', key: 'commission' },
            { label: 'Status', key: 'status' },
          ])} className="btn-ghost text-sm"><Download size={14} className="mr-1.5" />{t('export')}</button>
          <button onClick={() => setSetPinOpen(true)} className="btn-ghost text-sm" title={storedPin ? t('changePin') : t('setPin')}><Lock size={14} className="mr-1.5" />{t('pin')}</button>
          <button onClick={openAdd} className="btn-primary text-sm"><Plus size={15} className="mr-1.5" />{t('addEmployee')}</button>
        </div>
      } />

      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input className="form-input pl-9" placeholder={t('searchEmployees')} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
          <Users size={16} className="text-emerald-400 mb-1.5" />
          <p className="text-xs text-slate-500">{t('totalStaff')}</p>
          <p className="text-xl font-bold text-white">{employees.length}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
          <Target size={16} className="text-emerald-400 mb-1.5" />
          <p className="text-xs text-slate-500">{t('active')}</p>
          <p className="text-xl font-bold text-white">{activeEmployees.length}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
          <DollarSign size={16} className="text-emerald-400 mb-1.5" />
          <p className="text-xs text-slate-500">{t('totalSalary')}</p>
          <p className="text-xl font-bold text-white">{formatCurrency(employees.reduce((s, e) => s + Number(e.baseSalary || 0), 0))}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
          <TrendingUp size={16} className="text-emerald-400 mb-1.5" />
          <p className="text-xs text-slate-500">{t('commissionOwedLabel')}</p>
          <p className="text-xl font-bold text-white">{formatCurrency(totalCommissions)}</p>
        </div>
      </div>

      {/* Performance View */}
      {showPerf && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {[{ key: 'week', label: t('thisWeek') }, { key: 'month', label: t('thisMonth') }, { key: 'all', label: t('allTime') }].map(p => (
              <button key={p.key} onClick={() => loadPerf(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${perfPeriod === p.key ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300 bg-white/5'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {performance.map(p => (
              <div key={p.name} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{p.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{t(p.role?.toLowerCase() || '')}</p>
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-full ${p.targetProgress >= 80 ? 'bg-emerald-500/20 text-emerald-400' : p.targetProgress >= 50 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {p.targetProgress}%
                  </div>
                </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-500">{t('salesColon')}</span> <span className="text-white font-medium">{formatCurrency(p.totalSales)}</span></div>
                    <div><span className="text-slate-500">{t('profitColon')}</span> <span className="text-emerald-400 font-medium">{formatCurrency(p.totalProfit)}</span></div>
                    <div><span className="text-slate-500">{t('ordersColon')}</span> <span className="text-white font-medium">{p.transactions}</span></div>
                    <div><span className="text-slate-500">{t('targetColon')}</span> <span className="text-white font-medium">{formatCurrency(p.targetSales)}</span></div>
                    {p.commission > 0 && <div className="col-span-2"><span className="text-slate-500">{t('commissionColon')}</span> <span className="text-emerald-400 font-medium">{formatCurrency(p.commission)}</span></div>}
                </div>
                {p.targetSales > 0 && (
                  <div className="mt-3 bg-slate-700/30 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${p.targetProgress >= 80 ? 'bg-emerald-500' : p.targetProgress >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${p.targetProgress}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employee List */}
      {!showPerf && (
        <>
          {filtered.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
              <Users size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">{t('noDataYet')}</p>
              <button onClick={openAdd} className="btn-primary text-sm mt-4">{t('addEmployee')}</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(emp => (
                <div key={emp.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600/50 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{emp.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${emp.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>{t(emp.role?.toLowerCase() || '')}</span>
                      </div>
                    </div>
                    <button onClick={() => openEdit(emp)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors">
                      <Edit2 size={14} />
                    </button>
                  </div>

                  <div className="space-y-1.5 mb-3 text-xs">
                    {emp.phone && <p className="text-slate-400">{emp.phone}</p>}
                    {emp.email && <p className="text-slate-400">{emp.email}</p>}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                      <div><span className="text-slate-500">{t('salaryColon')}</span> <span className="text-white font-medium">{formatCurrency(emp.baseSalary)}</span></div>
                      <div><span className="text-slate-500">{t('commissionColon')}</span> <span className="text-white font-medium">{emp.commissionRate}%</span></div>
                      <div><span className="text-slate-500">{t('targetColon')}</span> <span className="text-white font-medium">{formatCurrency(emp.targetSales)}</span></div>
                      <div><span className="text-slate-500">{t('salesColon')}</span> <span className="text-emerald-400 font-medium">{formatCurrency(emp.totalSales || 0)}</span></div>
                      {emp.commission > 0 && <div className="col-span-2"><span className="text-slate-500">{t('commissionEarned')}</span> <span className="text-emerald-400 font-medium">{formatCurrency(emp.commission)}</span></div>}
                    </div>
                  </div>

                  <button onClick={() => handleDelete(emp.id, emp.name)} className="w-full p-2 rounded-xl bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-colors text-xs font-medium">
                    {t('remove')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('editEmployee') : t('addEmployee')}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">{t('name')} *</label>
            <input className="form-input" placeholder={t('fullNamePlaceholder')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">{t('phone')}</label>
              <input className="form-input" placeholder={t('phonePlaceholder')} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">{t('email')}</label>
              <input className="form-input" type="email" placeholder={t('emailPlaceholder')} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">{t('role')}</label>
              <select className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                {ROLES.map(r => <option key={r} value={r}>{t(r.toLowerCase())}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">{t('dateHired')}</label>
              <input className="form-input" type="date" value={form.dateHired} onChange={e => setForm({ ...form, dateHired: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">{t('baseSalary')}</label>
              <input className="form-input" type="number" min={0} placeholder="0" value={form.baseSalary} onChange={e => setForm({ ...form, baseSalary: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">{t('commissionPercent')}</label>
              <input className="form-input" type="number" min={0} max={100} placeholder="0" value={form.commissionRate} onChange={e => setForm({ ...form, commissionRate: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">{t('targetSales')}</label>
              <input className="form-input" type="number" min={0} placeholder="0" value={form.targetSales} onChange={e => setForm({ ...form, targetSales: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">{t('notes')}</label>
            <input className="form-input" placeholder={t('optionalNotes')} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button onClick={handleSave} className="btn-primary w-full justify-center" disabled={saving}>
            {saving ? t('saving') : editing ? t('editEmployee') : t('addEmployee')}
          </button>
        </div>
      </Modal>

      <Modal open={setPinOpen} onClose={() => setSetPinOpen(false)} title={storedPin ? t('changePin') : t('setPin')}>
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
            <Lock size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400 leading-relaxed">{t('pinInfoText')}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">{t('newPin')}</label>
            <input className="form-input text-center text-lg tracking-[0.3em] bg-slate-800/80 border-slate-600/50 focus:border-emerald-500/40" type="password" maxLength={6} placeholder={t('pinPlaceholder')} value={newPin} onChange={e => setNewPin(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">{t('confirmPin')}</label>
            <input className="form-input text-center text-lg tracking-[0.3em] bg-slate-800/80 border-slate-600/50 focus:border-emerald-500/40" type="password" maxLength={6} placeholder={t('pinPlaceholder')} value={confirmPin} onChange={e => setConfirmPin(e.target.value)} />
          </div>
          <button onClick={handleSetPin} className="btn-primary w-full justify-center">{storedPin ? t('changePin') : t('setPin')}</button>
          {storedPin && <button onClick={handleRemovePin} className="btn-danger w-full justify-center">{t('removePinLock')}</button>}
        </div>
      </Modal>
    </div>
  );
}
