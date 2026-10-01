import React, { useState } from 'react';
import { Boxes, X, RefreshCw } from 'lucide-react';
import { ServiceType } from '../../types/index.ts';
import { safeFetch } from '../../services/api.ts';

interface CreatePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPackageCreated: () => void;
}

export const CreatePackageModal: React.FC<CreatePackageModalProps> = ({
  isOpen,
  onClose,
  onPackageCreated,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('2000');
  const [durationMinutes, setDurationMinutes] = useState('360');
  const [downloadSpeedKbps, setDownloadSpeedKbps] = useState('10240');
  const [uploadSpeedKbps, setUploadSpeedKbps] = useState('5120');
  const [serviceType, setServiceType] = useState<ServiceType>('HOTSPOT');
  const [validityHours, setValidityHours] = useState('48');
  const [deviceLimit, setDeviceLimit] = useState('2');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await safeFetch<any>('/api/packages', {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        price: Number(price),
        durationMinutes: Number(durationMinutes),
        downloadSpeedKbps: Number(downloadSpeedKbps),
        uploadSpeedKbps: Number(uploadSpeedKbps),
        serviceType,
        validityHours: Number(validityHours),
        deviceLimit: Number(deviceLimit),
      }),
    }, null);

    if (res.success) {
      onPackageCreated();
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
            <Boxes className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Create Bandwidth Plan</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-300 font-medium">Package Plan Name</label>
            <input
              type="text"
              required
              placeholder="e.g. 6 Hours Turbo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium">Price (TZS)</label>
              <input
                type="number"
                step="100"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1 font-mono text-amber-400 font-bold"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium">Service Type</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1"
              >
                <option value="HOTSPOT">Hotspot WiFi</option>
                <option value="PPPOE">PPPoE Fiber</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <div>
              <label className="text-slate-300 font-sans font-medium">Download (Kbps)</label>
              <input
                type="number"
                value={downloadSpeedKbps}
                onChange={(e) => setDownloadSpeedKbps(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-emerald-400 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1"
              />
            </div>

            <div>
              <label className="text-slate-300 font-sans font-medium">Upload (Kbps)</label>
              <input
                type="number"
                value={uploadSpeedKbps}
                onChange={(e) => setUploadSpeedKbps(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-cyan-400 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <div>
              <label className="text-slate-300 font-sans font-medium">Duration (Minutes)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1"
              />
            </div>

            <div>
              <label className="text-slate-300 font-sans font-medium">Device Limit</label>
              <input
                type="number"
                value={deviceLimit}
                onChange={(e) => setDeviceLimit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1"
              />
            </div>
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
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Save Plan</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
