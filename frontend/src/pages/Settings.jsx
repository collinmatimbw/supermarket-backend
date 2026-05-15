import React, { useEffect, useState } from 'react';
import { Download, Trash2, Info, Database, Activity, Server, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import { LoadingState } from '../components/LoadingState';
import api from '../utils/api';

export default function Settings() {
  const [sysInfo, setSysInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const loadInfo = () => {
    api.get('/settings/info').then(r => setSysInfo(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { loadInfo(); }, []);

  const handleExport = () => {
    window.open('/api/settings/export', '_blank');
    toast.success('Downloading Excel backup...');
  };

  const handleClearSales = async () => {
    if (!window.confirm('Clear ALL sales history? This cannot be undone.')) return;
    setClearing(true);
    try {
      await api.delete('/settings/sales');
      toast.success('Sales history cleared');
      loadInfo();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="Settings" subtitle="System configuration and data management" />

      {/* System Info */}
      <div className="glass p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Server size={15} className="text-sky-400" />
          <h3 className="font-semibold text-slate-200 text-sm">System Information</h3>
          <button className="ml-auto text-slate-500 hover:text-slate-300 transition-colors" onClick={loadInfo}>
            <RefreshCw size={13} />
          </button>
        </div>
        {loading ? <LoadingState message="Loading..." /> : sysInfo && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'App Version', value: sysInfo.version },
              { label: 'Node.js', value: sysInfo.nodeVersion },
              { label: 'Total Products', value: sysInfo.totalProducts },
              { label: 'Total Customers', value: sysInfo.totalCustomers },
              { label: 'Total Sales', value: sysInfo.totalSales },
              { label: 'Uptime', value: `${Math.floor(sysInfo.uptime / 60)}m ${sysInfo.uptime % 60}s` },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-sm font-semibold text-slate-200">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Management */}
      <div className="glass p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Database size={15} className="text-emerald-400" />
          <h3 className="font-semibold text-slate-200 text-sm">Data Management</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: 'rgba(110,231,183,0.04)', border: '1px solid rgba(110,231,183,0.1)' }}>
            <div>
              <p className="text-sm font-semibold text-slate-200">Export Excel Backup</p>
              <p className="text-xs text-slate-500 mt-0.5">Download all data as a single .xlsx workbook</p>
            </div>
            <button className="btn-primary" onClick={handleExport}>
              <Download size={14} /> Export
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.1)' }}>
            <div>
              <p className="text-sm font-semibold text-slate-200">Clear Sales History</p>
              <p className="text-xs text-slate-500 mt-0.5">Permanently delete all sales records</p>
            </div>
            <button className="btn-danger" onClick={handleClearSales} disabled={clearing}>
              <Trash2 size={13} /> {clearing ? 'Clearing...' : 'Clear'}
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="glass p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info size={15} className="text-violet-400" />
          <h3 className="font-semibold text-slate-200 text-sm">About Duka CRM</h3>
        </div>
        <div className="space-y-2 text-sm text-slate-400">
          <p>A professional supermarket management system built with React, Tailwind CSS, Node.js, and Excel-based storage.</p>
          <p>All data is stored locally in Excel (.xlsx) files in the <code className="text-emerald-400 bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs">excel/</code> directory.</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {['React 18', 'Tailwind CSS', 'Node.js', 'Express', 'Chart.js', 'XLSX'].map(t => (
              <span key={t} className="badge badge-blue">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
