import React, { useEffect, useState } from 'react';
import { Plus, Phone, Mail, UserPlus, ArrowRight, Check, X, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { LoadingState, EmptyState } from '../components/LoadingState';
import api from '../utils/api';

const STAGES = [
  { key: 'new', label: 'New Lead', color: 'bg-blue-500/20 text-blue-300' },
  { key: 'contacted', label: 'Contacted', color: 'bg-yellow-500/20 text-yellow-300' },
  { key: 'interested', label: 'Interested', color: 'bg-purple-500/20 text-purple-300' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-orange-500/20 text-orange-300' },
  { key: 'won', label: 'Won', color: 'bg-emerald-500/20 text-emerald-300' },
  { key: 'lost', label: 'Lost', color: 'bg-red-500/20 text-red-300' },
];

const emptyForm = { name: '', phone: '', email: '', notes: '', stage: 'new' };

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/leads').then(r => setLeads(r.data.data || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (l) => { setEditing(l); setForm({ name: l.name, phone: l.phone || '', email: l.email || '', notes: l.notes || '', stage: l.stage || 'new' }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name) return toast.error('Lead name is required');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/leads/${editing.id}`, form);
        toast.success('Lead updated');
      } else {
        await api.post('/leads', form);
        toast.success('Lead added');
      }
      setModalOpen(false);
      load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const advanceStage = async (lead) => {
    const idx = STAGES.findIndex(s => s.key === lead.stage);
    if (idx < STAGES.length - 2) { // can advance until won/lost
      try {
        await api.put(`/leads/${lead.id}`, { stage: STAGES[idx + 1].key });
        load();
      } catch (e) { toast.error(e.message); }
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete lead "${name}"?`)) return;
    try {
      await api.delete(`/leads/${id}`);
      toast.success('Lead deleted');
      load();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <LoadingState message="Loading leads..." />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Leads" subtitle={`${leads.length} potential customers`} action={
        <button onClick={openAdd} className="btn-primary text-sm"><Plus size={15} className="mr-1.5" />New Lead</button>
      } />

      {/* Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGES.map(stage => {
          const stageLeads = leads.filter(l => l.stage === stage.key);
          return (
            <div key={stage.key} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 min-h-[200px]">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold px-2 py-1 rounded ${stage.color}`}>{stage.label}</span>
                <span className="text-xs text-slate-500">{stageLeads.length}</span>
              </div>
              <div className="space-y-2">
                {stageLeads.map(lead => (
                  <div key={lead.id} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => openEdit(lead)}>
                    <p className="text-sm font-medium text-white truncate">{lead.name}</p>
                    {lead.phone && <p className="text-xs text-slate-500 mt-0.5">{lead.phone}</p>}
                    {lead.notes && <p className="text-xs text-slate-600 mt-1 truncate">{lead.notes}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" onClick={e => e.stopPropagation()}>
                          <Phone size={12} />
                        </a>
                      )}
                      {lead.stage !== 'won' && lead.stage !== 'lost' && (
                        <button onClick={e => { e.stopPropagation(); advanceStage(lead); }} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                          <ArrowRight size={12} />
                        </button>
                      )}
                      <button onClick={e => { e.stopPropagation(); handleDelete(lead.id, lead.name); }} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors ml-auto">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {stageLeads.length === 0 && (
                  <p className="text-xs text-slate-600 text-center py-4">No leads</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Lead' : 'New Lead'}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Name *</label>
            <input className="form-input" placeholder="Lead name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Phone</label>
            <input className="form-input" placeholder="Phone number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Email</label>
            <input className="form-input" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Stage</label>
            <select className="form-input" value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
              {STAGES.slice(0, 4).map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Notes</label>
            <textarea className="form-input" rows={3} placeholder="Notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button onClick={handleSave} className="btn-primary w-full justify-center" disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Update Lead' : 'Add Lead'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
