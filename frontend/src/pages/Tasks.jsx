import React, { useEffect, useState } from 'react';
import { Plus, CheckCircle2, Circle, Clock, Calendar, Phone, Users, AlertCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { LoadingState, EmptyState } from '../components/LoadingState';
import api from '../utils/api';

const TASK_TYPES = [
  { key: 'call', label: 'Follow-up Call', icon: Phone, color: 'text-blue-400 bg-blue-500/10' },
  { key: 'meeting', label: 'Meeting', icon: Users, color: 'text-purple-400 bg-purple-500/10' },
  { key: 'reminder', label: 'Customer Reminder', icon: AlertCircle, color: 'text-yellow-400 bg-yellow-500/10' },
  { key: 'general', label: 'General', icon: Clock, color: 'text-slate-400 bg-slate-500/10' },
];

const emptyForm = { title: '', description: '', type: 'general', dueDate: '', priority: 'medium' };

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = () => api.get('/tasks').then(r => setTasks(r.data.data || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.title) return toast.error('Task title is required');
    setSaving(true);
    try {
      await api.post('/tasks', form);
      toast.success('Task added');
      setModalOpen(false);
      load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const toggleDone = async (task) => {
    try {
      await api.put(`/tasks/${task.id}`, { done: task.done === 'true' ? 'false' : 'true' });
      load();
    } catch (e) { toast.error(e.message); }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete task "${title}"?`)) return;
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Task deleted');
      load();
    } catch (e) { toast.error(e.message); }
  };

  const filtered = tasks.filter(t => {
    if (filter === 'pending') return t.done !== 'true';
    if (filter === 'done') return t.done === 'true';
    if (filter === 'overdue') return t.dueDate && new Date(t.dueDate) < new Date() && t.done !== 'true';
    return true;
  });

  const today = new Date().toISOString().split('T')[0];

  if (loading) return <LoadingState message="Loading tasks..." />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Tasks" subtitle={`${tasks.filter(t => t.done !== 'true').length} pending`} action={
        <button onClick={openAdd} className="btn-primary text-sm"><Plus size={15} className="mr-1.5" />New Task</button>
      } />

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'pending', 'done', 'overdue'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all capitalize ${filter === f ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200 bg-white/5'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
          <CheckCircle2 size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">All clear!</p>
          <p className="text-slate-500 text-sm mt-1">No {filter !== 'all' ? filter : ''} tasks</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const typeInfo = TASK_TYPES.find(t => t.key === task.type) || TASK_TYPES[3];
            const isOverdue = task.dueDate && task.dueDate < today && task.done !== 'true';
            return (
              <div key={task.id} className={`flex items-start gap-4 p-4 rounded-xl transition-all ${task.done === 'true' ? 'bg-slate-800/20 opacity-60' : 'bg-slate-800/50 border border-slate-700/50'} ${isOverdue ? 'border-red-500/30' : ''}`}>
                <button onClick={() => toggleDone(task)} className="mt-0.5 flex-shrink-0">
                  {task.done === 'true' ? <CheckCircle2 size={20} className="text-emerald-400" /> : <Circle size={20} className="text-slate-500 hover:text-slate-300" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`p-1 rounded ${typeInfo.color}`}><typeInfo.icon size={12} /></span>
                    <p className={`text-sm font-medium ${task.done === 'true' ? 'text-slate-500 line-through' : 'text-white'}`}>{task.title}</p>
                    {isOverdue && <span className="text-xs text-red-400 font-medium">Overdue</span>}
                  </div>
                  {task.description && <p className="text-xs text-slate-500 mt-1">{task.description}</p>}
                  {task.dueDate && (
                    <p className={`text-xs mt-1 flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                      <Calendar size={11} />{new Date(task.dueDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>
                <button onClick={() => handleDelete(task.id, task.title)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Task">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Title *</label>
            <input className="form-input" placeholder="Task title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Type</label>
            <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {TASK_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Due Date</label>
            <input className="form-input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Description</label>
            <textarea className="form-input" rows={3} placeholder="Details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <button onClick={handleSave} className="btn-primary w-full justify-center" disabled={saving}>
            {saving ? 'Adding...' : 'Add Task'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
