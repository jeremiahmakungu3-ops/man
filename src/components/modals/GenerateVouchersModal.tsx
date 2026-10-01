import React, { useState } from 'react';
import { Ticket, X, RefreshCw } from 'lucide-react';
import { PackagePlan, Site } from '../../types/index.ts';
import { formatTZS } from '../../lib/formatters.ts';
import { safeFetch } from '../../services/api.ts';

interface GenerateVouchersModalProps {
  isOpen: boolean;
  onClose: () => void;
  packages: PackagePlan[];
  sites: Site[];
  onGenerated: () => void;
}

export const GenerateVouchersModal: React.FC<GenerateVouchersModalProps> = ({
  isOpen,
  onClose,
  packages,
  sites,
  onGenerated,
}) => {
  if (!isOpen) return null;

  const [packageId, setPackageId] = useState(packages[0]?.id || '');
  const [siteId, setSiteId] = useState(sites[0]?.id || '');
  const [count, setCount] = useState('10');
  const [prefix, setPrefix] = useState('TZ');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await safeFetch<any>('/api/vouchers/generate', {
      method: 'POST',
      body: JSON.stringify({
        packageId,
        siteId,
        count: parseInt(count, 10),
        prefix,
      }),
    }, null);

    if (res.success) {
      onGenerated();
      onClose();
    } else {
      alert(res.message || 'Generation failed');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Bulk Voucher Generator</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-medium">Internet Package / Speed Tier</label>
            <select
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1"
            >
              {packages.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatTZS(p.price)} ({p.downloadSpeedKbps / 1024} Mbps)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-medium">Hotspot Site Location</label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1"
            >
              {sites.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium">Voucher Prefix</label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1 font-mono uppercase"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium">Quantity (Max 200)</label>
              <input
                type="number"
                min="1"
                max="200"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1 font-mono"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Generates unique, cryptographically random voucher codes and clears passwords into FreeRADIUS radcheck table.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold flex items-center gap-1.5 shadow-sm shadow-cyan-600/30"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Generate {count} Vouchers</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
