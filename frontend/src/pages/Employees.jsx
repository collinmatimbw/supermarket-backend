import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Users, Target, DollarSign, TrendingUp, Download, Lock, KeyRound, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { LoadingState, EmptyState } from '../components/LoadingState';
import api from '../utils/api';
import { formatCurrency, exportToCSV } from '../utils/helpers';

const ROLES = ['Owner', 'Manager', 'Cashier', 'Salesperson', 'Admin'];
const emptyForm = { name: '', phone: '', email: '', role: 'Cashier', baseSalary: 0, commissionRate: 0, targetSales: 0, dateHired: '', notes: '' };

export default function Employees() {
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
  const [pinGate, setPinGate] = useState(true);
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
    if (!form.name) return toast.error('Name is required');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/employees/${editing.id}`, form);
        toast.success('Employee updated');
      } else {
        await api.post('/employees', form);
        toast.success('Employee added');
      }
      setModalOpen(false);
      load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name}?`)) return;
    try { await api.delete(`/employees/${id}`); toast.success('Removed'); load(); } catch (e) { toast.error(e.message); }
  };

  const handlePinUnlock = () => {
    if (pinInput === storedPin) {
      sessionStorage.setItem('skyc_emp_unlocked', 'true');
      setPinGate(false);
      setPinError('');
      setPinInput('');
    } else {
      setPinError('Wrong PIN');
    }
  };

  const handleSetPin = () => {
    if (newPin.length < 4) return toast.error('PIN must be at least 4 digits');
    if (newPin !== confirmPin) return toast.error('PINs do not match');
    localStorage.setItem('skyc_emp_pin', newPin);
    setSetPinOpen(false);
    toast.success('Employee PIN set');
  };

  const handleRemovePin = () => {
    localStorage.removeItem('skyc_emp_pin');
    sessionStorage.removeItem('skyc_emp_unlocked');
    toast.success('Employee PIN removed');
    setSetPinOpen(false);
  };

  // PIN Gate
  if (!unlocked && storedPin) {
    return (
      <div className="animate-fade-in min-h-[60vh] flex items-center justify-center">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-amber-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">Employee Section Locked</h2>
          <p className="text-sm text-slate-500 mb-6">Enter PIN to view employee data</p>
          <input className="form-input text-center text-lg tracking-widest mb-3" type="password" maxLength={6} placeholder="••••" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePinUnlock()} autoFocus />
          {pinError && <p className="text-xs text-red-400 mb-3">{pinError}</p>}
          <button onClick={handlePinUnlock} className="btn-primary w-full justify-center mb-3">Unlock</button>
          <button onClick={() => setSetPinOpen(true)} className="text-xs text-slate-500 hover:text-slate-300"><Settings size={11} className="mr-1 inline" />Manage PIN</button>
          <Modal open={setPinOpen} onClose={() => setSetPinOpen(false)} title={storedPin ? 'Change Employee PIN' : 'Set Employee PIN'}>
            <div className="space-y-4">
              <p className="text-xs text-slate-500">Set a PIN to restrict access to employee data. Only people with the PIN can view salaries, commissions, and targets.</p>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">New PIN</label>
                <input className="form-input text-center text-lg tracking-widest" type="password" maxLength={6} placeholder="••••" value={newPin} onChange={e => setNewPin(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Confirm PIN</label>
                <input className="form-input text-center text-lg tracking-widest" type="password" maxLength={6} placeholder="••••" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} />
              </div>
              <button onClick={handleSetPin} className="btn-primary w-full justify-center">{storedPin ? 'Change PIN' : 'Set PIN'}</button>
              {storedPin && <button onClick={handleRemovePin} className="btn-danger w-full justify-center">Remove PIN Lock</button>}
            </div>
          </Modal>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingState message="Loading employees..." />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Employees" subtitle={`${activeEmployees.length} active · ${formatCurrency(totalCommissions)} commission owed`} action={
        <div className="flex gap-2">
          <button onClick={() => setShowPerf(!showPerf)} className={`btn-ghost text-sm ${showPerf ? 'bg-emerald-500/10 text-emerald-400' : ''}`}>
            <TrendingUp size={14} className="mr-1.5" />{showPerf ? 'List' : 'Performance'}
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
          ])} className="btn-ghost text-sm"><Download size={14} className="mr-1.5" />Export</button>
          <button onClick={openAdd} className="btn-primary text-sm"><Plus size={15} className="mr-1.5" />Add Employee</button>
        </div>
      } />

      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input className="form-input pl-9" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
          <Users size={16} className="text-emerald-400 mb-1.5" />
          <p className="text-xs text-slate-500">Total Staff</p>
          <p className="text-xl font-bold text-white">{employees.length}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
          <Target size={16} className="text-blue-400 mb-1.5" />
          <p className="text-xs text-slate-500">Active</p>
          <p className="text-xl font-bold text-white">{activeEmployees.length}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
          <DollarSign size={16} className="text-purple-400 mb-1.5" />
          <p className="text-xs text-slate-500">Total Salary</p>
          <p className="text-xl font-bold text-white">{formatCurrency(employees.reduce((s, e) => s + Number(e.baseSalary || 0), 0))}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
          <TrendingUp size={16} className="text-amber-400 mb-1.5" />
          <p className="text-xs text-slate-500">Commission Owed</p>
          <p className="text-xl font-bold text-white">{formatCurrency(totalCommissions)}</p>
        </div>
      </div>

      {/* Performance View */}
      {showPerf && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {[{ key: 'week', label: 'This Week' }, { key: 'month', label: 'This Month' }, { key: 'all', label: 'All Time' }].map(p => (
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
                    <p className="text-xs text-slate-500 capitalize">{p.role}</p>
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-full ${p.targetProgress >= 80 ? 'bg-emerald-500/20 text-emerald-400' : p.targetProgress >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                    {p.targetProgress}%
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-500">Sales:</span> <span className="text-white font-medium">{formatCurrency(p.totalSales)}</span></div>
                  <div><span className="text-slate-500">Profit:</span> <span className="text-emerald-400 font-medium">{formatCurrency(p.totalProfit)}</span></div>
                  <div><span className="text-slate-500">Orders:</span> <span className="text-white font-medium">{p.transactions}</span></div>
                  <div><span className="text-slate-500">Target:</span> <span className="text-white font-medium">{formatCurrency(p.targetSales)}</span></div>
                  {p.commission > 0 && <div className="col-span-2"><span className="text-slate-500">Commission:</span> <span className="text-amber-400 font-medium">{formatCurrency(p.commission)}</span></div>}
                </div>
                {p.targetSales > 0 && (
                  <div className="mt-3 bg-slate-700/30 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${p.targetProgress >= 80 ? 'bg-emerald-500' : p.targetProgress >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${p.targetProgress}%` }} />
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
              <p className="text-slate-400 font-medium">No employees yet</p>
              <button onClick={openAdd} className="btn-primary text-sm mt-4">Add your first employee</button>
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
                        <span className={`text-xs px-2 py-0.5 rounded-full ${emp.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>{emp.role}</span>
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
                      <div><span className="text-slate-500">Salary:</span> <span className="text-white font-medium">{formatCurrency(emp.baseSalary)}</span></div>
                      <div><span className="text-slate-500">Commission:</span> <span className="text-white font-medium">{emp.commissionRate}%</span></div>
                      <div><span className="text-slate-500">Target:</span> <span className="text-white font-medium">{formatCurrency(emp.targetSales)}</span></div>
                      <div><span className="text-slate-500">Sales:</span> <span className="text-emerald-400 font-medium">{formatCurrency(emp.totalSales || 0)}</span></div>
                      {emp.commission > 0 && <div className="col-span-2"><span className="text-slate-500">Commission earned:</span> <span className="text-amber-400 font-medium">{formatCurrency(emp.commission)}</span></div>}
                    </div>
                  </div>

                  <button onClick={() => handleDelete(emp.id, emp.name)} className="w-full p-2 rounded-xl bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-colors text-xs font-medium">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Employee' : 'Add Employee'}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Name *</label>
            <input className="form-input" placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Phone</label>
              <input className="form-input" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Email</label>
              <input className="form-input" type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Role</label>
              <select className="form-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Date Hired</label>
              <input className="form-input" type="date" value={form.dateHired} onChange={e => setForm({ ...form, dateHired: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Base Salary</label>
              <input className="form-input" type="number" min={0} placeholder="0" value={form.baseSalary} onChange={e => setForm({ ...form, baseSalary: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Commission %</label>
              <input className="form-input" type="number" min={0} max={100} placeholder="0" value={form.commissionRate} onChange={e => setForm({ ...form, commissionRate: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Target Sales</label>
              <input className="form-input" type="number" min={0} placeholder="0" value={form.targetSales} onChange={e => setForm({ ...form, targetSales: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Notes</label>
            <input className="form-input" placeholder="Optional notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button onClick={handleSave} className="btn-primary w-full justify-center" disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Update Employee' : 'Add Employee'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
