import React from 'react';
import { 
  Router as RouterIcon, 
  Users, 
  DollarSign, 
  Ticket, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  Wifi, 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  HardDrive
} from 'lucide-react';
import { formatTZS, formatBytes, formatBps } from '../../lib/formatters.ts';
import { RouterDevice, PaymentTransaction, Voucher, RadiusSession, AuditLog } from '../../types/index.ts';

interface DashboardViewProps {
  routers: RouterDevice[];
  payments: PaymentTransaction[];
  vouchers: Voucher[];
  sessions: RadiusSession[];
  auditLogs: AuditLog[];
  onSelectView: (view: string) => void;
  onOpenQuickVoucher: () => void;
  onOpenAddRouter: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  routers,
  payments,
  vouchers,
  sessions,
  auditLogs,
  onSelectView,
  onOpenQuickVoucher,
  onOpenAddRouter,
}) => {
  const onlineRouters = routers.filter(r => r.status === 'ONLINE').length;
  const offlineRouters = routers.filter(r => r.status === 'OFFLINE').length;
  const activeSessionsCount = sessions.filter(s => s.status === 'ACTIVE').length;
  
  const todayRevenue = payments
    .filter(p => p.status === 'SUCCESS' && p.createdAt.startsWith('2026-10-01'))
    .reduce((sum, p) => sum + p.amount, 0);

  const monthlyRevenue = payments
    .filter(p => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0);

  const activeVouchers = vouchers.filter(v => v.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Network Operations & Billing</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time subscriber sessions, MikroTik/Omada gateways, FreeRADIUS auth, and Tanzanian Mobile Money
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenAddRouter}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded transition-colors"
          >
            <RouterIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>Add Router</span>
          </button>
          <button
            onClick={onOpenQuickVoucher}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white rounded shadow-sm shadow-cyan-600/30 transition-colors"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Generate Vouchers</span>
          </button>
        </div>
      </div>

      {/* 8 Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Online Routers */}
        <div 
          onClick={() => onSelectView('routers')}
          className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 cursor-pointer hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Routers</span>
            <RouterIcon className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{onlineRouters}</span>
            <span className="text-xs text-slate-400">/ {routers.length} online</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>{offlineRouters === 0 ? 'All nodes responsive' : `${offlineRouters} offline`}</span>
          </div>
        </div>

        {/* Card 2: Active Users */}
        <div 
          onClick={() => onSelectView('sessions')}
          className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 cursor-pointer hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Sessions</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{activeSessionsCount}</span>
            <span className="text-xs text-slate-400">RADIUS leases</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            <span>Hotspot & PPPoE subscribers</span>
          </div>
        </div>

        {/* Card 3: Today's Revenue */}
        <div 
          onClick={() => onSelectView('payments')}
          className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 cursor-pointer hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Today's Revenue</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-amber-400 font-mono">
              {formatTZS(todayRevenue)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            <span>M-Pesa · Airtel · Tigo · Selcom</span>
          </div>
        </div>

        {/* Card 4: Monthly Revenue */}
        <div 
          onClick={() => onSelectView('payments')}
          className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 cursor-pointer hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Monthly Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white font-mono">
              {formatTZS(monthlyRevenue)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18.4% vs last period</span>
          </div>
        </div>

        {/* Card 5: Active Vouchers */}
        <div 
          onClick={() => onSelectView('vouchers')}
          className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 cursor-pointer hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Vouchers</span>
            <Ticket className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{activeVouchers}</span>
            <span className="text-xs text-slate-400">ready to use</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            <span>Printed & digital codes</span>
          </div>
        </div>

        {/* Card 6: Total Customers */}
        <div 
          onClick={() => onSelectView('customers')}
          className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 cursor-pointer hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Customers</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">184</span>
            <span className="text-xs text-slate-400">registered</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            <span>ISP accounts & leases</span>
          </div>
        </div>

        {/* Card 7: Network Throughput */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Live Throughput</span>
            <Wifi className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">142.8</span>
            <span className="text-xs text-slate-400">Mbps aggregate</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
            <span>↓ 98.4 Mbps</span>
            <span>·</span>
            <span>↑ 44.4 Mbps</span>
          </div>
        </div>

        {/* Card 8: Core Latency */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>WireGuard Hub</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">4.2</span>
            <span className="text-xs text-slate-400">ms ping</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400">
            <span>10.88.0.0/16 tunnel active</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Routers Status Table & Payment Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Routers Health Grid (2 Columns) */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RouterIcon className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Managed Routers & Gateways</h2>
            </div>
            <button 
              onClick={() => onSelectView('routers')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              View All →
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {routers.map(router => (
              <div key={router.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${router.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    <span className="font-semibold text-sm text-slate-100">{router.name}</span>
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                      {router.routerId}
                    </span>
                    <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/50">
                      {router.vendor}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span>IP: {router.ipAddress}</span>
                    <span>·</span>
                    <span>VPN: {router.wireguardIp || '10.88.0.x'}</span>
                    <span>·</span>
                    <span className="text-slate-300">{router.siteName}</span>
                  </div>
                </div>

                {/* Telemetry info */}
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <div className="text-slate-300">{router.cpuUsage}% CPU · {router.memoryUsage}% RAM</div>
                    <div className="text-[11px] text-slate-400">{router.activeUsers} active users</div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    router.status === 'ONLINE' 
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}>
                    {router.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Recent Payments (1 Column) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
            </div>
            <button 
              onClick={() => onSelectView('payments')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Ledger →
            </button>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto">
            {payments.slice(0, 5).map(p => (
              <div key={p.id} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-md flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-200">{p.packageName}</span>
                    <span className="text-[10px] font-bold px-1 rounded bg-slate-800 text-slate-300">
                      {p.gateway}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {p.phone} · {p.transactionReference}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-emerald-400">
                    {formatTZS(p.amount)}
                  </div>
                  <span className="text-[10px] text-emerald-500 font-semibold">
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Live Audit Activity Feed */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">System Audit & Network Activity Log</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Live Sync</span>
        </div>
        <div className="space-y-2">
          {auditLogs.map(log => (
            <div key={log.id} className="text-xs text-slate-300 flex items-start sm:items-center justify-between gap-2 py-1.5 border-b border-slate-800/50 last:border-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-cyan-400 font-semibold">{log.action}</span>
                <span className="text-slate-400 hidden sm:inline">·</span>
                <span className="text-slate-200">{log.details}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono flex-shrink-0">
                <span>by {log.userName}</span>
                <span>·</span>
                <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
