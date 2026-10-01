import React, { useState } from 'react';
import { 
  Router as RouterIcon, 
  Plus, 
  RefreshCw, 
  Terminal, 
  Cpu, 
  HardDrive, 
  Activity, 
  Wifi, 
  Power, 
  CheckCircle2, 
  AlertCircle,
  Network,
  Clock,
  ShieldCheck,
  Users
} from 'lucide-react';
import { RouterDevice, Site } from '../../types/index.ts';
import { formatBytes, formatBps, formatUptime } from '../../lib/formatters.ts';
import { safeFetch } from '../../services/api.ts';

interface RoutersViewProps {
  routers: RouterDevice[];
  sites: Site[];
  onOpenAddRouter: () => void;
  onOpenInstaller: (router: RouterDevice) => void;
  onRefreshRouters: () => void;
}

export const RoutersView: React.FC<RoutersViewProps> = ({
  routers,
  sites,
  onOpenAddRouter,
  onOpenInstaller,
  onRefreshRouters,
}) => {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [rebootingId, setRebootingId] = useState<string | null>(null);

  const handleTestConnection = async (router: RouterDevice) => {
    setTestingId(router.id);
    setTestResult(null);
    const res = await safeFetch<any>(`/api/routers/${router.id}/test-connection`, { method: 'POST' }, null);
    setTestResult({
      id: router.id,
      success: res.success,
      message: res.message || (res.success ? 'Connection verified' : 'Connection failed'),
    });
    onRefreshRouters();
    setTestingId(null);
  };

  const handleReboot = async (router: RouterDevice) => {
    if (!confirm(`Are you sure you want to reboot router ${router.name} (${router.routerId})?`)) return;
    setRebootingId(router.id);
    const res = await safeFetch<any>(`/api/routers/${router.id}/reboot`, { method: 'POST' }, null);
    alert(res.message || `Reboot command dispatched to ${router.name}`);
    onRefreshRouters();
    setRebootingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Routers & Network Hardware</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            MikroTik RouterOS API and TP-Link Omada SDN gateways with WireGuard overlay
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefreshRouters}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Refresh Telemetry</span>
          </button>
          <button
            onClick={onOpenAddRouter}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white rounded shadow-sm shadow-cyan-600/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Router</span>
          </button>
        </div>
      </div>

      {/* Test result toast banner if present */}
      {testResult && (
        <div className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
          testResult.success 
            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200' 
            : 'bg-rose-950/60 border-rose-800 text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span className="font-semibold">{testResult.message}</span>
          </div>
          <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Routers Cards List */}
      <div className="space-y-4">
        {routers.map(router => (
          <div key={router.id} className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4 hover:border-slate-750 transition-colors">
            {/* Top row: Status, Name, Vendor, Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className={`p-2.5 rounded-lg ${router.status === 'ONLINE' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80' : 'bg-slate-800 text-slate-400'}`}>
                  <RouterIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-white">{router.name}</span>
                    <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-cyan-400 font-semibold">
                      {router.routerId}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded font-bold uppercase bg-slate-800 text-slate-300">
                      {router.vendor}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      router.status === 'ONLINE' 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      {router.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-1 flex flex-wrap items-center gap-3">
                    <span>Model: {router.model}</span>
                    <span>·</span>
                    <span>IP: {router.ipAddress}:{router.managementPort}</span>
                    <span>·</span>
                    <span>Site: {router.siteName}</span>
                    <span>·</span>
                    <span>OS: {router.version || 'RouterOS'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleTestConnection(router)}
                  disabled={testingId === router.id}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingId === router.id ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>{testingId === router.id ? 'Testing...' : 'Test Connection'}</span>
                </button>

                <button
                  onClick={() => onOpenInstaller(router)}
                  className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-800/80 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Bootstrap / Install</span>
                </button>

                <button
                  onClick={() => handleReboot(router)}
                  disabled={rebootingId === router.id}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 border border-slate-700 text-xs font-medium rounded transition-colors"
                  title="Reboot Router"
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Hardware Telemetry Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-950/60 rounded-md border border-slate-800/60 font-mono text-xs">
              <div className="space-y-1">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>CPU Usage</span>
                </div>
                <div className="text-sm font-bold text-slate-200">{router.cpuUsage}%</div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${router.cpuUsage}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                  <span>RAM Usage</span>
                </div>
                <div className="text-sm font-bold text-slate-200">{router.memoryUsage}%</div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${router.memoryUsage}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>Active Users</span>
                </div>
                <div className="text-sm font-bold text-amber-400">{router.activeUsers}</div>
                <div className="text-[10px] text-slate-400">Hotspot + PPPoE</div>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>System Uptime</span>
                </div>
                <div className="text-sm font-bold text-slate-200">{formatUptime(router.uptimeSeconds)}</div>
                <div className="text-[10px] text-slate-400">Last seen: {new Date(router.lastSeen).toLocaleTimeString()}</div>
              </div>
            </div>

            {/* Interfaces List */}
            {router.interfaces && router.interfaces.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Network Interfaces & WireGuard Tunnels</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {router.interfaces.map(iface => (
                    <div key={iface.name} className="p-2.5 bg-slate-950/80 rounded border border-slate-800/80 text-xs font-mono flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${iface.linkUp ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                          <span>{iface.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{iface.ipAddress || iface.macAddress}</div>
                      </div>
                      <div className="text-right text-[11px]">
                        <div className="text-emerald-400 font-semibold">↓ {formatBps(iface.rxRate)}</div>
                        <div className="text-cyan-400 font-semibold">↑ {formatBps(iface.txRate)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

