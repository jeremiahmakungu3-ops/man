import React, { useState } from 'react';
import { Router as RouterIcon, X, RefreshCw } from 'lucide-react';
import { Site, RouterVendor } from '../../types/index.ts';
import { safeFetch } from '../../services/api.ts';

interface AddRouterModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: Site[];
  onRouterAdded: () => void;
}

export const AddRouterModal: React.FC<AddRouterModalProps> = ({
  isOpen,
  onClose,
  sites,
  onRouterAdded,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [vendor, setVendor] = useState<RouterVendor>('MIKROTIK');
  const [model, setModel] = useState('RB4011iGS+RM');
  const [ipAddress, setIpAddress] = useState('192.168.88.1');
  const [managementPort, setManagementPort] = useState('8728');
  const [username, setUsername] = useState('xcloud_api');
  const [siteId, setSiteId] = useState(sites[0]?.id || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await safeFetch<any>('/api/routers', {
      method: 'POST',
      body: JSON.stringify({
        name,
        vendor,
        model,
        ipAddress,
        managementPort: parseInt(managementPort, 10),
        username,
        siteId,
      }),
    }, null);

    if (res.success) {
      onRouterAdded();
      onClose();
    } else {
      alert(res.message || 'Failed to add router');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <RouterIcon className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Register Network Router</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-300 font-medium">Router Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Mlimani City Mall Hotspot"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium">Hardware Vendor</label>
              <select
                value={vendor}
                onChange={(e) => {
                  const v = e.target.value as RouterVendor;
                  setVendor(v);
                  if (v === 'OMADA') {
                    setModel('ER7206 Omada Multi-WAN');
                    setManagementPort('8043');
                  } else {
                    setModel('RB4011iGS+RM');
                    setManagementPort('8728');
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1"
              >
                <option value="MIKROTIK">MikroTik RouterOS</option>
                <option value="OMADA">TP-Link Omada SDN</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium">Hardware Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium">Management IP</label>
              <input
                type="text"
                required
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium">API Port</label>
              <input
                type="number"
                value={managementPort}
                onChange={(e) => setManagementPort(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-medium">Site Location</label>
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

          <p className="text-[11px] text-slate-400">
            Upon creation, XCLOUD generates an encrypted WireGuard tunnel pair and an automated bootstrap installation script.
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
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Register & Generate Token</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
