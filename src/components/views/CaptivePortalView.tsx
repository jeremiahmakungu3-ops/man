import React, { useState } from 'react';
import { 
  Wifi, 
  Smartphone, 
  Ticket, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  Phone, 
  Clock, 
  Zap, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { PackagePlan, Site, PaymentGatewayType } from '../../types/index.ts';
import { formatTZS, formatBps } from '../../lib/formatters.ts';
import { safeFetch } from '../../services/api.ts';

interface CaptivePortalViewProps {
  packages: PackagePlan[];
  sites: Site[];
  onRefreshData?: () => void;
}

export const CaptivePortalView: React.FC<CaptivePortalViewProps> = ({
  packages,
  sites,
  onRefreshData,
}) => {
  const [selectedSiteId, setSelectedSiteId] = useState<string>(sites[0]?.id || 'site_dar_01');
  const [activeTab, setActiveTab] = useState<'MOBILE_MONEY' | 'VOUCHER' | 'ACCOUNT'>('MOBILE_MONEY');

  // Mobile Money Flow State
  const [selectedPkgId, setSelectedPkgId] = useState<string>(packages[0]?.id || '');
  const [customerPhone, setCustomerPhone] = useState('0754123456');
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayType>('MPESA');
  const [portalStep, setPortalStep] = useState<'FORM' | 'WAITING_PIN' | 'SUCCESS'>('FORM');
  const [activeTx, setActiveTx] = useState<any>(null);
  const [generatedVoucher, setGeneratedVoucher] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Voucher Login State
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherPin, setVoucherPin] = useState('');
  const [voucherStatusMessage, setVoucherStatusMessage] = useState('');

  const currentSite = sites.find(s => s.id === selectedSiteId) || sites[0];
  const selectedPackage = packages.find(p => p.id === selectedPkgId) || packages[0];

  // 1. Submit Mobile Money Push
  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsProcessing(true);

    const res = await safeFetch<any>('/api/payments/initiate', {
      method: 'POST',
      body: JSON.stringify({
        phone: customerPhone,
        packageId: selectedPackage.id,
        gateway: selectedGateway,
        siteId: currentSite.id,
      }),
    }, null);

    if (res.success && res.data) {
      setActiveTx(res.data.payment);
      setPortalStep('WAITING_PIN');
      if (onRefreshData) onRefreshData();
    } else {
      setErrorMessage(res.message || 'Payment initiation failed');
    }
    setIsProcessing(false);
  };

  // 2. Gateway Webhook Verification simulation (Only trusted server verification can finalize)
  const handleVerifyPayment = async () => {
    if (!activeTx) return;
    setIsProcessing(true);
    const res = await safeFetch<any>(`/api/payments/${activeTx.id}/simulate-verify`, { method: 'POST' }, null);
    if (res.success && res.data) {
      setGeneratedVoucher(res.data.voucher);
      setPortalStep('SUCCESS');
      if (onRefreshData) onRefreshData();
    } else {
      setErrorMessage(res.message || 'Payment verification failed');
    }
    setIsProcessing(false);
  };

  // 3. Redeem Existing Voucher
  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherStatusMessage('');
    setIsProcessing(true);

    const res = await safeFetch<any>('/api/vouchers/redeem', {
      method: 'POST',
      body: JSON.stringify({
        code: voucherCode,
        pin: voucherPin,
        macAddress: 'DC:2C:6E:' + Math.floor(Math.random() * 89 + 10) + ':AA:01',
      }),
    }, null);

    if (res.success && res.data) {
      setGeneratedVoucher(res.data.voucher);
      setPortalStep('SUCCESS');
      if (onRefreshData) onRefreshData();
    } else {
      setVoucherStatusMessage(res.message || 'Invalid or expired voucher code');
    }
    setIsProcessing(false);
  };

  const handleReset = () => {
    setPortalStep('FORM');
    setActiveTx(null);
    setGeneratedVoucher(null);
    setErrorMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Captive Portal & Mobile Money Checkout</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Mobile-first responsive captive login portal with automated Tanzanian Mobile Money activation and FreeRADIUS authentication
          </p>
        </div>

        {/* Site Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Testing Hotspot Site:</span>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Simulator Container */}
      <div className="flex justify-center py-4">
        {/* Mobile Device Mockup Frame */}
        <div className="w-full max-w-sm rounded-[32px] border-4 border-slate-800 bg-slate-950 p-2 shadow-2xl relative overflow-hidden">
          {/* Top Speaker notch */}
          <div className="h-4 w-32 bg-slate-800 rounded-full mx-auto mb-2"></div>

          {/* Screen Content */}
          <div className="bg-slate-900 text-slate-100 rounded-[24px] min-h-[580px] p-5 flex flex-col justify-between border border-slate-800/80">
            {/* Screen Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-cyan-600 flex items-center justify-center font-black text-white text-xs">
                    X
                  </div>
                  <div>
                    <span className="font-extrabold text-sm tracking-tight text-white">XCLOUD</span>
                    <span className="text-[9px] block text-cyan-400 font-mono -mt-1">WiFi Zone</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                  <Wifi className="w-3.5 h-3.5 animate-pulse" />
                  <span>ONLINE</span>
                </div>
              </div>

              {/* Site Banner */}
              <div className="py-2.5 text-center">
                <h2 className="text-sm font-bold text-white">{currentSite.name}</h2>
                <p className="text-[11px] text-slate-400">High-Speed Fiber Wireless Access</p>
              </div>

              {/* Portal Mode Tabs */}
              {portalStep === 'FORM' && (
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-semibold mb-4">
                  <button
                    onClick={() => setActiveTab('MOBILE_MONEY')}
                    className={`py-1.5 rounded transition-colors ${activeTab === 'MOBILE_MONEY' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Mobile Pay
                  </button>
                  <button
                    onClick={() => setActiveTab('VOUCHER')}
                    className={`py-1.5 rounded transition-colors ${activeTab === 'VOUCHER' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Voucher
                  </button>
                  <button
                    onClick={() => setActiveTab('ACCOUNT')}
                    className={`py-1.5 rounded transition-colors ${activeTab === 'ACCOUNT' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Member
                  </button>
                </div>
              )}

              {/* TAB 1: MOBILE MONEY CHECKOUT */}
              {portalStep === 'FORM' && activeTab === 'MOBILE_MONEY' && (
                <form onSubmit={handleInitiatePayment} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">1. Select Internet Plan</label>
                    <div className="grid grid-cols-2 gap-2">
                      {packages.filter(p => p.serviceType === 'HOTSPOT').slice(0, 4).map(p => (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPkgId(p.id)}
                          className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                            selectedPkgId === p.id 
                              ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200' 
                              : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-xs font-bold leading-tight">{p.name}</div>
                          <div className="text-[10px] text-slate-400">{formatBps(p.downloadSpeedKbps * 1000)}</div>
                          <div className="text-xs font-black text-amber-400 mt-1 font-mono">{formatTZS(p.price)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Money Provider */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-semibold text-slate-300">2. Payment Provider</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'MPESA', label: 'M-Pesa', color: 'border-rose-700' },
                        { id: 'AIRTEL', label: 'Airtel', color: 'border-red-700' },
                        { id: 'TIGO', label: 'Tigo', color: 'border-blue-700' },
                        { id: 'SELCOM', label: 'Selcom', color: 'border-amber-700' },
                      ].map(gw => (
                        <button
                          key={gw.id}
                          type="button"
                          onClick={() => setSelectedGateway(gw.id as any)}
                          className={`py-1 text-[11px] font-bold rounded border transition-colors ${
                            selectedGateway === gw.id
                              ? 'bg-slate-100 text-slate-950 font-black'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          {gw.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-semibold text-slate-300">3. Phone Number</label>
                    <div className="relative">
                      <Smartphone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="0754XXXXXX"
                        className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-8 pr-3 py-2 rounded focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="p-2 bg-rose-950/80 border border-rose-800 rounded text-[11px] text-rose-300 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-1.5 transition-colors mt-2"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Pay {formatTZS(selectedPackage.price)}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: WAITING FOR PIN ON MOBILE */}
              {portalStep === 'WAITING_PIN' && (
                <div className="space-y-4 py-4 text-center">
                  <div className="w-12 h-12 bg-amber-950/80 border border-amber-800 rounded-full flex items-center justify-center mx-auto text-amber-400 animate-pulse">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">Check Your Phone</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      A prompt has been sent to <strong className="text-white font-mono">{customerPhone}</strong>
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-left text-xs font-mono space-y-1">
                    <div className="text-slate-400 text-[10px]">Transaction Ref:</div>
                    <div className="text-cyan-400 font-bold">{activeTx?.transactionReference}</div>
                    <div className="text-slate-400 text-[10px] pt-1">Amount:</div>
                    <div className="text-amber-400 font-bold">{formatTZS(activeTx?.amount || 0)}</div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Enter your {selectedGateway} PIN to approve internet access.
                  </p>

                  <div className="pt-2 space-y-2">
                    <button
                      onClick={handleVerifyPayment}
                      disabled={isProcessing}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30"
                    >
                      {isProcessing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Simulate User Entered PIN</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleReset}
                      className="w-full py-1 text-slate-400 hover:text-white text-[11px]"
                    >
                      Cancel & Choose Another Plan
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: SUCCESS & CONNECTED */}
              {portalStep === 'SUCCESS' && (
                <div className="space-y-4 py-4 text-center">
                  <div className="w-12 h-12 bg-emerald-950/80 border border-emerald-800 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">You're Connected!</h3>
                    <p className="text-xs text-slate-400 mt-0.5">High-speed internet access granted.</p>
                  </div>

                  {generatedVoucher && (
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center font-mono space-y-1">
                      <div className="text-[10px] text-slate-400 uppercase tracking-widest">Active Voucher Code</div>
                      <div className="text-lg font-black text-amber-400 tracking-wider">
                        {generatedVoucher.code}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Valid for {generatedVoucher.durationMinutes} minutes
                      </div>
                    </div>
                  )}

                  <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800 text-xs text-slate-300">
                    Authenticated with FreeRADIUS · IP assigned · Bandwidth limit applied.
                  </div>

                  <button
                    onClick={handleReset}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded"
                  >
                    Done
                  </button>
                </div>
              )}

              {/* TAB 2: VOUCHER CODE LOGIN */}
              {portalStep === 'FORM' && activeTab === 'VOUCHER' && (
                <form onSubmit={handleRedeemVoucher} className="space-y-3 py-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">Enter Voucher Code</label>
                    <div className="relative">
                      <Ticket className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. TZ-7492-9102"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-8 pr-3 py-2 rounded focus:outline-none focus:border-cyan-500 font-mono uppercase tracking-wider"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">PIN (if present on slip)</label>
                    <input
                      type="password"
                      placeholder="Optional PIN"
                      value={voucherPin}
                      onChange={(e) => setVoucherPin(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-3 py-2 rounded focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  {voucherStatusMessage && (
                    <div className="p-2 bg-rose-950/80 border border-rose-800 rounded text-[11px] text-rose-300">
                      {voucherStatusMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-1.5 transition-colors mt-4"
                  >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Login to Internet</span>}
                  </button>
                </form>
              )}

              {/* TAB 3: MEMBER LOGIN */}
              {portalStep === 'FORM' && activeTab === 'ACCOUNT' && (
                <div className="space-y-3 py-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">Subscriber Username</label>
                    <input
                      type="text"
                      placeholder="username"
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-3 py-2 rounded focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-3 py-2 rounded focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPortalStep('SUCCESS');
                    }}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded shadow-lg shadow-cyan-600/30 transition-colors mt-4"
                  >
                    Authenticate Member
                  </button>
                </div>
              )}
            </div>

            {/* Portal Footer */}
            <div className="pt-4 border-t border-slate-800/80 text-center text-[10px] text-slate-400 space-y-1">
              <div>Customer Support: <span className="text-slate-300 font-mono">+255 754 100 200</span></div>
              <div className="text-[9px] text-slate-400">Powered by XCLOUD ISP Automation · FreeRADIUS</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
