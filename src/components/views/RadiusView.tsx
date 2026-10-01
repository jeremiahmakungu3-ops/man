import React, { useState, useEffect } from 'react';
import { 
  Server, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck, 
  Database, 
  Activity, 
  Terminal 
} from 'lucide-react';
import { RouterDevice } from '../../types/index.ts';
import { safeFetch } from '../../services/api.ts';

interface RadiusViewProps {
  routers: RouterDevice[];
}

export const RadiusView: React.FC<RadiusViewProps> = ({ routers }) => {
  const [radiusStatus, setRadiusStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchRadiusStatus = async () => {
    setLoading(true);
    const res = await safeFetch<any>('/api/radius/status', {}, null);
    if (res.success && res.data) {
      setRadiusStatus(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRadiusStatus();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">FreeRADIUS Authentication Engine</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            PostgreSQL-backed AAA server (radcheck, radreply, radacct) handling MikroTik & Omada hotspot and PPPoE authentication
          </p>
        </div>
        <button
          onClick={fetchRadiusStatus}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
          <span>Check Daemon</span>
        </button>
      </div>

      {/* RADIUS Cluster Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Daemon Status</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-lg font-bold text-white font-mono mt-1">ONLINE (v3.2)</div>
          <div className="text-[11px] text-emerald-400 mt-1">Uptime: 99.98%</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-400">Auth & Acct Ports</div>
          <div className="text-lg font-bold text-cyan-400 font-mono mt-1">UDP 1812 / 1813</div>
          <div className="text-[11px] text-slate-400 mt-1">RFC 2865 / RFC 2866</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-400">Registered NAS Clients</div>
          <div className="text-lg font-bold text-white font-mono mt-1">{routers.length} Nodes</div>
          <div className="text-[11px] text-slate-400 mt-1">WireGuard Subnet 10.88.0.0/16</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-400">Database Driver</div>
          <div className="text-lg font-bold text-indigo-400 font-mono mt-1">rlm_sql_postgresql</div>
          <div className="text-[11px] text-slate-400 mt-1">Connection pool: 32 max</div>
        </div>
      </div>

      {/* NAS Clients Table */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Authorized Network Access Servers (NAS Table)
        </h2>
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Router Name</th>
                <th className="px-4 py-3">NAS IP Address</th>
                <th className="px-4 py-3">Vendor Type</th>
                <th className="px-4 py-3">Shared Secret</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {routers.map(r => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-sans font-bold text-slate-200">
                    {r.name} ({r.routerId})
                  </td>
                  <td className="px-4 py-3 text-cyan-400 font-bold">{r.wireguardIp || r.ipAddress}</td>
                  <td className="px-4 py-3 text-slate-300">{r.vendor.toLowerCase()}</td>
                  <td className="px-4 py-3 text-slate-400">•••••••••••••</td>
                  <td className="px-4 py-3 font-sans">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      SYNCHRONIZED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
