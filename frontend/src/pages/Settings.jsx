import React, { useEffect, useState, useRef } from 'react';
import { Download, Upload, Trash2, Info, Database, Server, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import { LoadingState } from '../components/LoadingState';
import api from '../utils/api';

export default function Settings() {
  const [sysInfo, setSysInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const loadInfo = () => {
    api.get('/settings/info').then(r => setSysInfo(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { loadInfo(); }, []);

  const handleExport = async () => {
    try {
      const response = await api.get('/settings/export', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'supermarket-backup.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Downloading Excel backup...');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/settings/import-excel', formData, { timeout: 120000 });
      toast.success(`Imported ${res.data.totalImported || 0} records`);
      loadInfo();
    } catch (e) {
      toast.error('Import failed: ' + (e.response?.data?.message || e.message));
    }
    setImporting(false);
    e.target.value = '';
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
          <Server size={15} className="text-emerald-400" />
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
              <p className="text-sm font-semibold text-slate-200">Export All Data (Excel)</p>
              <p className="text-xs text-slate-500 mt-0.5">Download all data as .xlsx — edit offline, then re-import</p>
            </div>
            <button className="btn-primary" onClick={handleExport}>
              <Download size={14} /> Export
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: 'rgba(110,231,183,0.04)', border: '1px solid rgba(110,231,183,0.1)' }}>
            <div>
              <p className="text-sm font-semibold text-slate-200">Import Excel</p>
              <p className="text-xs text-slate-500 mt-0.5">Upload a .xlsx file to bulk-import/update all data</p>
            </div>
            <button className="btn-primary" onClick={() => fileRef.current?.click()} disabled={importing}>
              <Upload size={14} /> {importing ? 'Importing...' : 'Import Excel'}
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
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
          <Info size={15} className="text-emerald-400" />
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
