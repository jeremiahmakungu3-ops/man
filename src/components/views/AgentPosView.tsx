import React, { useState } from 'react';
import { 
  Store, 
  DollarSign, 
  Ticket, 
  Plus, 
  Printer, 
  ArrowUpRight, 
  Smartphone, 
  CheckCircle2, 
  Wallet, 
  Receipt, 
  X,
  CreditCard
} from 'lucide-react';
import { Agent, PackagePlan, Voucher } from '../../types/index.ts';
import { formatTZS, formatBps } from '../../lib/formatters.ts';
import { safeFetch } from '../../services/api.ts';

interface AgentPosViewProps {
  agents: Agent[];
  packages: PackagePlan[];
  onRefreshData: () => void;
}

export const AgentPosView: React.FC<AgentPosViewProps> = ({
  agents,
  packages,
  onRefreshData,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [sellingPkgId, setSellingPkgId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [issuedVoucher, setIssuedVoucher] = useState<Voucher | null>(null);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('50000');

  const currentAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  const handleSellVoucher = async (pkg: PackagePlan) => {
    if (!currentAgent) return;
    if (currentAgent.floatBalance < pkg.price) {
      alert(`Insufficient float balance! Needed: ${formatTZS(pkg.price)}, Available: ${formatTZS(currentAgent.floatBalance)}`);
      return;
    }

    setIsProcessing(true);
    setSellingPkgId(pkg.id);

    const res = await safeFetch<any>(`/api/agents/${currentAgent.id}/sell-voucher`, {
      method: 'POST',
      body: JSON.stringify({
        packageId: pkg.id,
        customerPhone: customerPhone || '+255 700 000 000',
      }),
    }, null);

    if (res.success && res.data) {
      setIssuedVoucher(res.data.voucher);
      setCustomerPhone('');
      onRefreshData();
    } else {
      alert(res.message || 'Sale failed');
    }
    setIsProcessing(false);
    setSellingPkgId(null);
  };

  const handleTopupFloat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAgent) return;

    const res = await safeFetch<any>(`/api/agents/${currentAgent.id}/topup`, {
      method: 'POST',
      body: JSON.stringify({ amount: Number(topupAmount) }),
    }, null);

    if (res.success) {
      setShowTopupModal(false);
      onRefreshData();
    } else {
      alert(res.message || 'Topup failed');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Agent Terminal & POS Point-of-Sale</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Duka & kiosk voucher sales, real-time float balance deduction, and automated commission accounting
          </p>
        </div>

        {/* Agent Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Agent Terminal:</span>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-mono"
          >
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.phone})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Agent Status & Float Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Float Balance */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Available Float Balance</div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">
              {formatTZS(currentAgent?.floatBalance || 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Ready for voucher dispensing</div>
          </div>
          <button
            onClick={() => setShowTopupModal(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Top-up Float</span>
          </button>
        </div>

        {/* Commission Earned */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
          <div className="text-xs text-slate-400 font-medium">Commission Earned (10%)</div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {formatTZS(currentAgent?.totalCommissionEarned || 0)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>Credited directly to agent wallet</span>
          </div>
        </div>

        {/* Total Sales */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
          <div className="text-xs text-slate-400 font-medium">Lifetime Gross Sales</div>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {formatTZS(currentAgent?.totalSales || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Cash collected from customers</div>
        </div>
      </div>

      {/* POS Quick Dispenser */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white">Instant Voucher Dispenser</h2>
            <p className="text-xs text-slate-400">Click a package to instantly issue and deduct from float</p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Customer Phone (Optional for SMS)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-3 py-1.5 rounded focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>

        {/* Rate Plans Quick Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {packages.filter(p => p.serviceType === 'HOTSPOT').map(pkg => (
            <div
              key={pkg.id}
              className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 hover:border-slate-700 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100">{pkg.name}</span>
                  <span className="text-sm font-black text-amber-400 font-mono">{formatTZS(pkg.price)}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Speed: {formatBps(pkg.downloadSpeedKbps * 1000)} · Duration: {pkg.durationMinutes >= 1440 ? `${Math.round(pkg.durationMinutes / 1440)} Days` : `${Math.round(pkg.durationMinutes / 60)} Hours`}
                </div>
              </div>

              <button
                onClick={() => handleSellVoucher(pkg)}
                disabled={isProcessing}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-bold text-xs rounded shadow-sm shadow-cyan-600/30 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Sell Voucher</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Newly Issued Voucher Receipt Modal */}
      {issuedVoucher && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-lg max-w-sm w-full p-6 space-y-4 shadow-2xl relative font-mono">
            <button
              onClick={() => setIssuedVoucher(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-black"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>SALE CONFIRMED</span>
              </div>
              <h3 className="font-extrabold text-lg mt-1 tracking-wider">XCLOUD HOTSPOT</h3>
              <p className="text-[11px] text-slate-500 font-sans">Agent: {currentAgent.name}</p>
            </div>

            <div className="text-center space-y-2 py-2">
              <div className="text-xs text-slate-500 uppercase tracking-widest">Voucher Login Code</div>
              <div className="text-2xl font-black tracking-widest text-slate-900 bg-amber-100 p-2 rounded border border-amber-300">
                {issuedVoucher.code}
              </div>
              {issuedVoucher.pin && (
                <div className="text-xs text-slate-600">
                  PIN: <span className="font-bold">{issuedVoucher.pin}</span>
                </div>
              )}
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Plan:</span>
                <span className="font-bold">{issuedVoucher.packageName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold">{formatTZS(issuedVoucher.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <span className="font-bold">{issuedVoucher.durationMinutes} Minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Agent Commission:</span>
                <span className="font-bold text-emerald-600">+{formatTZS((issuedVoucher.price * currentAgent.commissionRate) / 100)}</span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2 bg-slate-900 text-white rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-800"
            >
              <Printer className="w-4 h-4" />
              <span>Print Thermal Receipt</span>
            </button>
          </div>
        </div>
      )}

      {/* Topup Float Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Top-up Agent Float</h3>
              <button onClick={() => setShowTopupModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTopupFloat} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-medium">Top-up Amount (TZS)</label>
                <input
                  type="number"
                  step="1000"
                  required
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-sm font-bold text-amber-400 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 font-mono mt-1"
                />
              </div>

              <p className="text-[11px] text-slate-400">
                Credits agent float immediately to allow ongoing retail voucher issuance.
              </p>

              <button
                type="submit"
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded transition-colors"
              >
                Confirm Credit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
