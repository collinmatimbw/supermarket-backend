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
    const a = document.createElement('a');
    a.href = 'http://localhost:5000/api/settings/export';
    a.download = 'supermarket-backup.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
          <h3 className="font-semibold text-slate-200 text-sm">About SKYC CRM</h3>
        </div>
        <div className="space-y-2 text-sm text-slate-400">
          <p>Manage your entire supermarket — track <span className="text-slate-300">products</span>, record <span className="text-slate-300">sales</span>, and maintain <span className="text-slate-300">customer</span> profiles all in one place.</p>
          <p>Monitor <span className="text-slate-300">real-time analytics</span> with revenue trends, category breakdowns, and top-selling products. Get <span className="text-slate-300">AI-powered sales predictions</span> and stock alerts to stay ahead.</p>
          <p>Export your data as Excel workbooks with an interactive dashboard for offline reporting and analysis.</p>
        </div>
      </div>
    </div>
  );
}
