import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Activity, 
  Cpu, 
  HardDrive, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Wifi,
  Radio
} from 'lucide-react';
import { RouterDevice, AuditLog } from '../../types/index.ts';
import { formatBps, formatUptime } from '../../lib/formatters.ts';
import { safeFetch } from '../../services/api.ts';

interface MonitoringViewProps {
  routers: RouterDevice[];
  auditLogs: AuditLog[];
  onRefreshData: () => void;
}

export const MonitoringView: React.FC<MonitoringViewProps> = ({
  routers,
  auditLogs,
  onRefreshData,
}) => {
  const [monitoringStats, setMonitoringStats] = useState<any>(null);

  useEffect(() => {
    safeFetch<any>('/api/monitoring/stats', {}, null).then(res => {
      if (res.success && res.data) setMonitoringStats(res.data);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Real-Time Network Telemetry & Monitoring</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated heartbeat watchdog, CPU/RAM utilization, link state, and live alarm triggers
          </p>
        </div>
        <button
          onClick={onRefreshData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Aggregate Traffic Gauge */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              <span>Backbone Throughput Utilization</span>
            </div>
            <h2 className="text-2xl font-black text-white font-mono mt-1">142.8 Mbps</h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>Download: <strong className="text-emerald-400">98.4 Mbps</strong></div>
            <span>·</span>
            <div>Upload: <strong className="text-cyan-400">44.4 Mbps</strong></div>
          </div>
        </div>

        {/* Visual Simulated Traffic Bars */}
        <div className="space-y-2">
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden flex border border-slate-800">
            <div className="bg-emerald-500 h-full" style={{ width: '65%' }}></div>
            <div className="bg-cyan-500 h-full" style={{ width: '25%' }}></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0 Mbps</span>
            <span>WAN Capacity: 1.0 Gbps (Peak Bandwidth)</span>
            <span>1000 Mbps</span>
          </div>
        </div>
      </div>

      {/* Router Node Health Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {routers.map(router => (
          <div key={router.id} className="p-4 bg-slate-900/90 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${router.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                <span className="font-bold text-sm text-slate-100">{router.name}</span>
              </div>
              <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                {router.routerId}
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div>
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>CPU Load</span>
                  <span className="text-slate-200">{router.cpuUsage}%</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full" style={{ width: `${router.cpuUsage}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>Memory</span>
                  <span className="text-slate-200">{router.memoryUsage}%</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${router.memoryUsage}%` }}></div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                <span>Uptime</span>
                <span className="text-slate-200">{formatUptime(router.uptimeSeconds)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Audit & Watchdog Alarms Log */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Watchdog Health Alarms & Security Events
        </h3>
        <div className="space-y-2 font-mono text-xs">
          {auditLogs.map(log => (
            <div key={log.id} className="p-3 bg-slate-950/80 rounded border border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-bold">{log.action}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-200 font-sans">{log.details}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Node IP: {log.ipAddress} · User: {log.userName}
                </div>
              </div>
              <div className="text-[11px] text-slate-400">
                {new Date(log.createdAt).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
