import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  DollarSign, 
  Ticket, 
  Users, 
  Store, 
  Activity 
} from 'lucide-react';
import { PaymentTransaction, Voucher, Agent } from '../../types/index.ts';
import { formatTZS } from '../../lib/formatters.ts';

interface ReportsViewProps {
  payments: PaymentTransaction[];
  vouchers: Voucher[];
  agents: Agent[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  payments,
  vouchers,
  agents,
}) => {
  const [dateFilter, setDateFilter] = useState('TODAY');

  const totalRevenue = payments
    .filter(p => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0);

  const mpesaVolume = payments
    .filter(p => p.status === 'SUCCESS' && p.gateway === 'MPESA')
    .reduce((sum, p) => sum + p.amount, 0);

  const airtelVolume = payments
    .filter(p => p.status === 'SUCCESS' && p.gateway === 'AIRTEL')
    .reduce((sum, p) => sum + p.amount, 0);

  const tigoVolume = payments
    .filter(p => p.status === 'SUCCESS' && p.gateway === 'TIGO')
    .reduce((sum, p) => sum + p.amount, 0);

  const handleExportCsv = (reportType: string) => {
    alert(`Exporting ${reportType} CSV with current filter: ${dateFilter}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Business Reports & Financial Analytics</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Revenue breakdown, voucher consumption, agent commissions, and exportable financial audits
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="TODAY">Today (01 Oct 2026)</option>
            <option value="YESTERDAY">Yesterday</option>
            <option value="7DAYS">Last 7 Days</option>
            <option value="30DAYS">Last 30 Days</option>
            <option value="ALL">All Time</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Total Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {formatTZS(totalRevenue)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">Tanzanian Mobile Money + Cash</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Vouchers Issued</span>
            <Ticket className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
            {vouchers.length} Codes
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{vouchers.filter(v => v.status === 'USED').length} redeemed</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Agent Commissions</span>
            <Store className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">
            {formatTZS(agents.reduce((sum, a) => sum + a.totalCommissionEarned, 0))}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">10% fixed dealer margin</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Active Radii Leases</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400 font-mono mt-1">
            3 Subscribers
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Active PPPoE + Hotspot</div>
        </div>
      </div>

      {/* Revenue Breakdown by Payment Provider */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Payment Method Distribution</h2>
          <button
            onClick={() => handleExportCsv('revenue-breakdown')}
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Revenue CSV</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-950/80 rounded border border-slate-800 space-y-1">
            <span className="text-xs font-bold text-rose-400">Vodacom M-Pesa</span>
            <div className="text-lg font-black text-white font-mono">{formatTZS(mpesaVolume)}</div>
            <div className="text-[10px] text-slate-400">Lipa Na M-Pesa Online</div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded border border-slate-800 space-y-1">
            <span className="text-xs font-bold text-red-400">Airtel Money</span>
            <div className="text-lg font-black text-white font-mono">{formatTZS(airtelVolume)}</div>
            <div className="text-[10px] text-slate-400">Airtel Push Gateway</div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded border border-slate-800 space-y-1">
            <span className="text-xs font-bold text-blue-400">Tigo Pesa</span>
            <div className="text-lg font-black text-white font-mono">{formatTZS(tigoVolume)}</div>
            <div className="text-[10px] text-slate-400">Tigo USSD Merchant</div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded border border-slate-800 space-y-1">
            <span className="text-xs font-bold text-amber-400">Selcom Pay</span>
            <div className="text-lg font-black text-white font-mono">{formatTZS(45000)}</div>
            <div className="text-[10px] text-slate-400">Mastercard / QR / Bank</div>
          </div>
        </div>
      </div>
    </div>
  );
};
