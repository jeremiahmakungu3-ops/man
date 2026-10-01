import React, { useState } from 'react';
import { 
  Activity, 
  RefreshCw, 
  Power, 
  Search, 
  ArrowDownRight, 
  ArrowUpRight, 
  Clock, 
  Wifi, 
  CheckCircle2 
} from 'lucide-react';
import { RadiusSession } from '../../types/index.ts';
import { formatBytes, formatUptime } from '../../lib/formatters.ts';
import { safeFetch } from '../../services/api.ts';

interface SessionsViewProps {
  sessions: RadiusSession[];
  onRefreshSessions: () => void;
}

export const SessionsView: React.FC<SessionsViewProps> = ({
  sessions,
  onRefreshSessions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const filteredSessions = sessions.filter(s => 
    s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.framedIpAddress.includes(searchTerm) ||
    s.callingStationId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDisconnect = async (session: RadiusSession) => {
    if (!confirm(`Disconnect session for ${session.username} (${session.framedIpAddress})?`)) return;
    setDisconnectingId(session.id);
    await safeFetch<any>(`/api/sessions/${session.id}/disconnect`, { method: 'POST' }, null);
    onRefreshSessions();
    setDisconnectingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Active RADIUS Accounting Sessions</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time FreeRADIUS radacct accounting records, Framed-IP leases, MAC bindings, and bandwidth counters
          </p>
        </div>
        <button
          onClick={onRefreshSessions}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Sessions</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-lg">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by username, Framed-IP, or MAC address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 pl-9 pr-3 py-2 rounded focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="text-xs font-mono text-slate-400 hidden sm:block">
          Active Leases: <strong className="text-emerald-400">{filteredSessions.filter(s => s.status === 'ACTIVE').length}</strong>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Subscriber / Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Framed IP</th>
                <th className="px-4 py-3">MAC Address</th>
                <th className="px-4 py-3">Downloaded</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3">Connected Since</th>
                <th className="px-4 py-3 text-right">Disconnect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredSessions.map(s => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${s.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                      <span className="font-bold text-slate-200">{s.username}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{s.routerName}</div>
                  </td>

                  <td className="px-4 py-3 font-sans">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                      {s.serviceType}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-cyan-400 font-bold">
                    {s.framedIpAddress}
                  </td>

                  <td className="px-4 py-3 text-slate-400">
                    {s.callingStationId}
                  </td>

                  <td className="px-4 py-3 text-emerald-400 font-semibold">
                    <div className="flex items-center gap-1">
                      <ArrowDownRight className="w-3 h-3" />
                      <span>{formatBytes(s.inputOctets)}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-cyan-400 font-semibold">
                    <div className="flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                      <span>{formatBytes(s.outputOctets)}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-slate-400 text-[11px]">
                    {new Date(s.startTime).toLocaleTimeString()}
                  </td>

                  <td className="px-4 py-3 text-right">
                    {s.status === 'ACTIVE' ? (
                      <button
                        onClick={() => handleDisconnect(s)}
                        disabled={disconnectingId === s.id}
                        className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-[11px] font-sans font-semibold transition-colors"
                      >
                        {disconnectingId === s.id ? 'Kicking...' : 'Kick'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">CLOSED</span>
                    )}
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
