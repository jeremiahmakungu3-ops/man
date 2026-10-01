import React, { useState } from 'react';
import { 
  Radio, 
  Wifi, 
  Smartphone, 
  RefreshCw, 
  Power, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  HardDrive, 
  ArrowDownRight, 
  ArrowUpRight 
} from 'lucide-react';
import { OmadaAccessPoint, OmadaClient } from '../../types/index.ts';
import { formatBytes, formatBps } from '../../lib/formatters.ts';
import { safeFetch } from '../../services/api.ts';

interface OmadaViewProps {
  accessPoints: OmadaAccessPoint[];
  clients: OmadaClient[];
  onRefreshData: () => void;
}

export const OmadaView: React.FC<OmadaViewProps> = ({
  accessPoints,
  clients,
  onRefreshData,
}) => {
  const [kickingMac, setKickingMac] = useState<string | null>(null);

  const handleKickClient = async (client: OmadaClient) => {
    if (!confirm(`Disconnect wireless client ${client.name || client.mac} from Omada AP?`)) return;
    setKickingMac(client.mac);
    await safeFetch<any>('/api/omada/kick', {
      method: 'POST',
      body: JSON.stringify({ mac: client.mac }),
    }, null);
    onRefreshData();
    setKickingMac(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">TP-Link Omada SDN Wireless Mesh</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Omada Controller OpenAPI integration, EAP ceiling/outdoor access points, and live wireless client monitoring
          </p>
        </div>
        <button
          onClick={onRefreshData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Sync Controller</span>
        </button>
      </div>

      {/* Controller Status Banner */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">Omada SDN Controller (v5.14.26)</div>
            <div className="text-slate-400 text-[11px]">https://102.68.10.50:8043 · Mwanza Rock City Mall</div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-300">
          <div>APs: <strong className="text-emerald-400">{accessPoints.length} Connected</strong></div>
          <span>·</span>
          <div>Clients: <strong className="text-cyan-400">{clients.length} Active</strong></div>
        </div>
      </div>

      {/* Access Points Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Managed Access Points (EAP Series)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accessPoints.map(ap => (
            <div key={ap.id} className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-sm text-slate-100">{ap.name}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    {ap.model} · {ap.ip} · MAC: {ap.mac}
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {ap.status}
                </span>
              </div>

              {/* AP Radios and Load */}
              <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-950/80 rounded border border-slate-800 font-mono text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Clients</div>
                  <div className="text-sm font-bold text-cyan-400 mt-0.5">{ap.clientsCount} connected</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Radios</div>
                  <div className="text-[11px] text-slate-200 mt-0.5">CH {ap.channel2g} / {ap.channel5g}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Throughput</div>
                  <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                    {formatBps(ap.txRate)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wireless Clients Table */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Connected Wireless Clients
        </h2>
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Device / Hostname</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">MAC Address</th>
                <th className="px-4 py-3">Connected AP & SSID</th>
                <th className="px-4 py-3">Signal (RSSI)</th>
                <th className="px-4 py-3">Traffic (Down/Up)</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {clients.map(c => (
                <tr key={c.mac} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-sans font-bold text-slate-100">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-cyan-400 font-bold">{c.ip}</td>
                  <td className="px-4 py-3 text-slate-400">{c.mac}</td>
                  <td className="px-4 py-3 font-sans">
                    <div className="text-slate-200">{c.apName}</div>
                    <span className="text-[10px] text-slate-400 font-mono">{c.ssid}</span>
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-bold">
                    {c.signalStrength} dBm
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-[11px]">
                    ↓ {formatBytes(c.trafficDown)} · ↑ {formatBytes(c.trafficUp)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleKickClient(c)}
                      disabled={kickingMac === c.mac}
                      className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-[11px] font-sans font-semibold transition-colors"
                    >
                      {kickingMac === c.mac ? 'Kicking...' : 'Kick'}
                    </button>
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
