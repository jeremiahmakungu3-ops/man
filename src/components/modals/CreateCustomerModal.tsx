import React, { useState } from 'react';
import { Users, X, RefreshCw } from 'lucide-react';
import { PackagePlan, Site, ServiceType } from '../../types/index.ts';
import { safeFetch } from '../../services/api.ts';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  packages: PackagePlan[];
  sites: Site[];
  onCustomerCreated: () => void;
}

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  isOpen,
  onClose,
  packages,
  sites,
  onCustomerCreated,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+255 7');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('PPPOE');
  const [packageId, setPackageId] = useState(packages[0]?.id || '');
  const [siteId, setSiteId] = useState(sites[0]?.id || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await safeFetch<any>('/api/customers', {
      method: 'POST',
      body: JSON.stringify({
        name,
        phone,
        email,
        username: username || phone.replace(/\D/g, ''),
        serviceType,
        packageId,
        siteId,
      }),
    }, null);

    if (res.success) {
      onCustomerCreated();
      onClose();
    } else {
      alert(res.message || 'Creation failed');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Register Customer Account</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-300 font-medium">Customer Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Juma Kassim"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium">Phone Number</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium">Username</label>
              <input
                type="text"
                placeholder="Optional login ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium">Service Type</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1"
              >
                <option value="PPPOE">PPPoE Fiber</option>
                <option value="HOTSPOT">Hotspot Account</option>
                <option value="STATIC_IP">Static IP Lease</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium">Package</label>
              <select
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1"
              >
                {packages.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
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
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Create Account</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
