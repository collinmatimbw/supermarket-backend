import React, { useEffect, useState } from 'react';
import { Plus, Phone, Mail, UserPlus, ArrowRight, Check, X, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { LoadingState, EmptyState } from '../components/LoadingState';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';

const STAGES = [
  { key: 'new', label: 'New Lead', color: 'bg-emerald-500/20 text-emerald-300' },
  { key: 'contacted', label: 'Contacted', color: 'bg-emerald-500/20 text-emerald-300' },
  { key: 'interested', label: 'Interested', color: 'bg-emerald-500/20 text-emerald-300' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-emerald-500/20 text-emerald-300' },
  { key: 'won', label: 'Won', color: 'bg-emerald-500/20 text-emerald-300' },
  { key: 'lost', label: 'Lost', color: 'bg-red-500/20 text-red-300' },
];

const emptyForm = { name: '', phone: '', email: '', notes: '', stage: 'new' };

export default function Leads() {
  const { t } = useLanguage();
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
    if (!form.name) return toast.error(t('leadNameRequired'));
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/leads/${editing.id}`, form);
        toast.success(t('leadUpdated'));
      } else {
        await api.post('/leads', form);
        toast.success(t('leadAdded'));
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
    if (!window.confirm(`${t('deleteLead')} "${name}"?`)) return;
    try {
      await api.delete(`/leads/${id}`);
      toast.success(t('leadDeleted'));
      load();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <LoadingState message={t('loadingLeads')} />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={t('leads')} subtitle={`${leads.length} ${t('potentialCustomers')}`} action={
        <button onClick={openAdd} className="btn-primary text-sm"><Plus size={15} className="mr-1.5" />{t('newLead')}</button>
      } />

      {/* Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGES.map(stage => {
          const stageLeads = leads.filter(l => l.stage === stage.key);
          return (
            <div key={stage.key} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 min-h-[200px]">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold px-2 py-1 rounded ${stage.color}`}>{t(stage.key === 'new' ? 'newLead' : stage.key)}</span>
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
                        <button onClick={e => { e.stopPropagation(); advanceStage(lead); }} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
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
                  <p className="text-xs text-slate-600 text-center py-4">{t('noLeads')}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('editLead') : t('newLead')}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">{t('name')} *</label>
            <input className="form-input" placeholder={t('leadName')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">{t('phone')}</label>
            <input className="form-input" placeholder={t('phonePlaceholder')} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">{t('email')}</label>
            <input className="form-input" placeholder={t('emailPlaceholder')} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">{t('stage')}</label>
            <select className="form-input" value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
              {STAGES.slice(0, 4).map(s => <option key={s.key} value={s.key}>{t(s.key === 'new' ? 'newLead' : s.key)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">{t('notes')}</label>
            <textarea className="form-input" rows={3} placeholder={t('notesPlaceholder')} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button onClick={handleSave} className="btn-primary w-full justify-center" disabled={saving}>
            {saving ? t('saving') : editing ? t('updateLead') : t('addLead')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
