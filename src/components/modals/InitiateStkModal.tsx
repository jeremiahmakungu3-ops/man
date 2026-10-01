import React, { useState } from 'react';
import { Smartphone, X, RefreshCw, Send, CheckCircle2 } from 'lucide-react';
import { PackagePlan, PaymentGatewayType, Site } from '../../types/index.ts';
import { formatTZS } from '../../lib/formatters.ts';
import { safeFetch } from '../../services/api.ts';

interface InitiateStkModalProps {
  isOpen: boolean;
  onClose: () => void;
  packages: PackagePlan[];
  sites: Site[];
  onPaymentInitiated: () => void;
}

export const InitiateStkModal: React.FC<InitiateStkModalProps> = ({
  isOpen,
  onClose,
  packages,
  sites,
  onPaymentInitiated,
}) => {
  if (!isOpen) return null;

  const [phone, setPhone] = useState('0754123456');
  const [packageId, setPackageId] = useState(packages[0]?.id || '');
  const [gateway, setGateway] = useState<PaymentGatewayType>('MPESA');
  const [siteId, setSiteId] = useState(sites[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const res = await safeFetch<any>('/api/payments/initiate', {
      method: 'POST',
      body: JSON.stringify({
        phone,
        packageId,
        gateway,
        siteId,
      }),
    }, null);

    if (res.success && res.data) {
      setResult(res.data);
      onPaymentInitiated();
    } else {
      alert(res.message || 'Payment initiation failed');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-white text-base">Initiate Mobile Money USSD Push</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {result ? (
          <div className="space-y-4 py-2 font-mono text-xs">
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-md text-emerald-300">
              <div className="font-bold flex items-center gap-1.5 font-sans">
                <CheckCircle2 className="w-4 h-4" />
                <span>USSD Request Dispatched</span>
              </div>
              <p className="mt-1 text-[11px] font-mono text-emerald-200">
                {result.instructions || 'Prompt sent to user mobile device.'}
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
              <div>Ref: <strong className="text-white">{result.payment?.transactionReference}</strong></div>
              <div>Gateway ID: <strong className="text-cyan-400">{result.payment?.gatewayReference}</strong></div>
              <div>Amount: <strong className="text-amber-400">{formatTZS(result.payment?.amount || 0)}</strong></div>
            </div>

            <button
              onClick={() => {
                setResult(null);
                onClose();
              }}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-sans font-semibold rounded text-xs"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-medium">Customer MSISDN (Phone)</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0754XXXXXX"
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1 font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium">Telecom Provider</label>
              <select
                value={gateway}
                onChange={(e) => setGateway(e.target.value as PaymentGatewayType)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1"
              >
                <option value="MPESA">Vodacom M-Pesa</option>
                <option value="AIRTEL">Airtel Money</option>
                <option value="TIGO">Tigo Pesa</option>
                <option value="SELCOM">Selcom Pay</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium">Package</label>
              <select
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1"
              >
                {packages.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {formatTZS(p.price)}</option>
                ))}
              </select>
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
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Dispatch STK Push</span>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
