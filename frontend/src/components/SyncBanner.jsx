import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Cloud, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { getPendingQueue } from '../utils/db';
import { syncPending } from '../utils/offlineQueue';

export default function SyncBanner({ onSync }) {
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const autoSyncFired = useRef(false);

  const checkPending = useCallback(async () => {
    try {
      const queue = await getPendingQueue();
      setPending(queue.filter(q => !q.synced).length);
    } catch {}
  }, []);

  const handleSync = useCallback(async () => {
    if (syncing || pending === 0) return;
    setSyncing(true);
    setResult(null);
    const res = await syncPending();
    setResult(res);
    setSyncing(false);
    await checkPending();
    if (onSync) onSync();
    setTimeout(() => setResult(null), 4000);
  }, [syncing, pending, onSync, checkPending]);

  useEffect(() => {
    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, [checkPending]);

  useEffect(() => {
    if (navigator.onLine && pending > 0 && !autoSyncFired.current) {
      autoSyncFired.current = true;
      handleSync();
    }
  }, [pending, handleSync]);

  useEffect(() => {
    const goOnline = () => { autoSyncFired.current = false; checkPending(); };
    window.addEventListener('online', goOnline);
    return () => window.removeEventListener('online', goOnline);
  }, [checkPending]);

  if (!navigator.onLine) return null;

  return (
    <>
      {result && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-up ${result.failed === 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
          <div className="flex items-center gap-2">
            {result.failed === 0 ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            {result.failed === 0
              ? `Synced ${result.synced} item${result.synced > 1 ? 's' : ''}`
              : `Synced ${result.synced}, ${result.failed} failed`}
          </div>
        </div>
      )}
      {pending > 0 && (
        <button onClick={handleSync} disabled={syncing}
          className="fixed bottom-4 left-4 z-50 px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium flex items-center gap-2 hover:bg-amber-500/30 transition-all animate-slide-up shadow-lg">
          <Cloud size={14} />
          {syncing ? 'Syncing...' : `${pending} pending — Sync now`}
          {syncing && <RefreshCw size={12} className="animate-spin" />}
        </button>
      )}
    </>
  );
}
