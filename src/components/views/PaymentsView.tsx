import React, { useState } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Search, 
  Filter, 
  DollarSign, 
  Plus, 
  Send,
  ShieldCheck
} from 'lucide-react';
import { PaymentTransaction, PackagePlan, PaymentGatewayType } from '../../types/index.ts';
import { formatTZS } from '../../lib/formatters.ts';
import { safeFetch } from '../../services/api.ts';

interface PaymentsViewProps {
  payments: PaymentTransaction[];
  packages: PackagePlan[];
  onRefreshPayments: () => void;
  onOpenInitiateModal: () => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  packages,
  onRefreshPayments,
  onOpenInitiateModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('ALL');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.phone.includes(searchTerm) ||
                          p.transactionReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.gatewayReference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGateway = gatewayFilter === 'ALL' || p.gateway === gatewayFilter;
    return matchesSearch && matchesGateway;
  });

  const totalVolume = payments
    .filter(p => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0);

  const handleSimulateVerify = async (payment: PaymentTransaction) => {
    setVerifyingId(payment.id);
    const res = await safeFetch<any>(`/api/payments/${payment.id}/simulate-verify`, { method: 'POST' }, null);
    if (res.success) {
      alert(`Payment verified by gateway callback! Voucher created: ${res.data?.voucher?.code || 'OK'}`);
      onRefreshPayments();
    } else {
      alert(res.message || 'Verification failed');
    }
    setVerifyingId(null);
  };

  const getGatewayColor = (gw: PaymentGatewayType) => {
    switch (gw) {
      case 'MPESA': return 'bg-rose-950 text-rose-300 border-rose-800'; // Vodacom red
      case 'AIRTEL': return 'bg-red-950 text-red-300 border-red-800';   // Airtel red
      case 'TIGO': return 'bg-blue-950 text-blue-300 border-blue-800';   // Tigo blue
      case 'SELCOM': return 'bg-amber-950 text-amber-300 border-amber-800'; // Selcom orange
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Payments & Mobile Money Ledger</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Idempotent gateway webhooks for Vodacom M-Pesa (Daraja), Airtel Money, Tigo Pesa, and Selcom Pay
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefreshPayments}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Refresh Ledger</span>
          </button>
          <button
            onClick={onOpenInitiateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white rounded shadow-sm shadow-cyan-600/30 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Initiate STK Push</span>
          </button>
        </div>
      </div>

      {/* Gateway Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400">Vodacom M-Pesa</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="mt-1 text-xs text-slate-300 font-mono">Daraja OpenAPI</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Shortcode: 174379</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-400">Airtel Money</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="mt-1 text-xs text-slate-300 font-mono">Merchant Push</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Region: TZ (TZS)</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400">Tigo Pesa</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="mt-1 text-xs text-slate-300 font-mono">USSD Push Gateway</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Instant Webhook</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400">Selcom Pay</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="mt-1 text-xs text-slate-300 font-mono">QR & Card & USSD</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Vendor Switch</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-lg">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by MSISDN phone, reference, or Checkout ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 pl-9 pr-3 py-2 rounded focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={gatewayFilter}
            onChange={(e) => setGatewayFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Gateways</option>
            <option value="MPESA">Vodacom M-Pesa</option>
            <option value="AIRTEL">Airtel Money</option>
            <option value="TIGO">Tigo Pesa</option>
            <option value="SELCOM">Selcom Pay</option>
            <option value="CASH">Cash POS</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Internal Reference</th>
                <th className="px-4 py-3">Gateway</th>
                <th className="px-4 py-3">MSISDN / Phone</th>
                <th className="px-4 py-3">Package</th>
                <th className="px-4 py-3">Amount (TZS)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredPayments.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-200">{p.transactionReference}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                      {p.gatewayReference || 'Awaiting gateway'}
                    </div>
                  </td>

                  <td className="px-4 py-3 font-sans">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getGatewayColor(p.gateway)}`}>
                      {p.gateway}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-slate-300 font-bold">
                    {p.phone}
                  </td>

                  <td className="px-4 py-3 font-sans">
                    <div className="font-medium text-slate-200">{p.packageName}</div>
                    {p.voucherId && (
                      <span className="text-[10px] text-cyan-400 font-mono">Voucher linked</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-sm font-bold text-amber-400">
                    {formatTZS(p.amount)}
                  </td>

                  <td className="px-4 py-3 font-sans">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.status === 'SUCCESS' 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                        : p.status === 'PENDING' 
                        ? 'bg-amber-950 text-amber-400 border border-amber-800' 
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      {p.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-[11px] text-slate-400">
                    {new Date(p.createdAt).toLocaleTimeString()}
                  </td>

                  <td className="px-4 py-3 text-right">
                    {p.status === 'PENDING' ? (
                      <button
                        onClick={() => handleSimulateVerify(p)}
                        disabled={verifyingId === p.id}
                        className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded text-[11px] font-sans font-semibold transition-colors flex items-center gap-1 ml-auto"
                        title="Simulate incoming server-side webhook verification callback"
                      >
                        <ShieldCheck className="w-3 h-3 text-cyan-400" />
                        <span>{verifyingId === p.id ? 'Verifying...' : 'Verify Callback'}</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] text-emerald-400 justify-end">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="font-sans">Confirmed</span>
                      </div>
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
