import React, { useState } from 'react';
import { 
  Ticket, 
  Plus, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  QrCode,
  Copy,
  Check,
  X
} from 'lucide-react';
import { Voucher, PackagePlan } from '../../types/index.ts';
import { formatTZS, formatBps } from '../../lib/formatters.ts';

interface VouchersViewProps {
  vouchers: Voucher[];
  packages: PackagePlan[];
  onOpenGenerateModal: () => void;
  onRefreshVouchers: () => void;
}

export const VouchersView: React.FC<VouchersViewProps> = ({
  vouchers,
  packages,
  onOpenGenerateModal,
  onRefreshVouchers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<Voucher | null>(null);
  const [showPrintSheet, setShowPrintSheet] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filteredVouchers = vouchers.filter(v => {
    const matchesSearch = v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.packageName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleExportCsv = () => {
    window.location.href = '/api/vouchers/export';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">WiFi Hotspot Vouchers</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Single & bulk generation, printable ticket sheets, and instant RADIUS access codes
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowPrintSheet(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Print Sheet</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenGenerateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white rounded shadow-sm shadow-cyan-600/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Bulk Generate</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-lg">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by voucher code or package..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 pl-9 pr-3 py-2 rounded focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses ({vouchers.length})</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="USED">USED</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Voucher Code</th>
                <th className="px-4 py-3">Package & Speed</th>
                <th className="px-4 py-3">Price (TZS)</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Used By</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredVouchers.map(v => (
                <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm">{v.code}</span>
                      <button
                        onClick={() => handleCopy(v.code)}
                        className="text-slate-400 hover:text-cyan-400"
                        title="Copy code"
                      >
                        {copiedCode === v.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {v.pin && <span className="text-[10px] text-slate-400">PIN: {v.pin}</span>}
                  </td>

                  <td className="px-4 py-3 font-sans">
                    <div className="font-semibold text-slate-200">{v.packageName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      ↓ {formatBps(v.downloadSpeedKbps * 1000)} · ↑ {formatBps(v.uploadSpeedKbps * 1000)}
                    </div>
                  </td>

                  <td className="px-4 py-3 font-bold text-amber-400">
                    {formatTZS(v.price)}
                  </td>

                  <td className="px-4 py-3 text-slate-300">
                    {v.durationMinutes >= 1440
                      ? `${Math.round(v.durationMinutes / 1440)} Days`
                      : `${Math.round(v.durationMinutes / 60)} Hours`}
                  </td>

                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      v.status === 'ACTIVE' 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                        : v.status === 'USED' 
                        ? 'bg-slate-800 text-slate-400 border border-slate-700' 
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      {v.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-[11px] text-slate-400">
                    {v.usedByPhone || v.usedByMac || '—'}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedVoucherForPrint(v)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-sans font-medium transition-colors"
                    >
                      Print Slip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Printable Voucher Slip Modal */}
      {selectedVoucherForPrint && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-lg max-w-sm w-full p-6 space-y-4 shadow-2xl relative font-mono">
            <button
              onClick={() => setSelectedVoucherForPrint(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-black"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h3 className="font-extrabold text-lg tracking-wider">XCLOUD HOTSPOT</h3>
              <p className="text-[11px] text-slate-500 font-sans">High-Speed WiFi Access Voucher</p>
            </div>

            <div className="text-center space-y-2 py-2">
              <div className="text-xs text-slate-500 uppercase tracking-widest">Connect to WiFi SSID</div>
              <div className="text-sm font-bold bg-slate-100 py-1 rounded">XCLOUD-HOTSPOT</div>

              <div className="text-xs text-slate-500 uppercase tracking-widest pt-2">Voucher Login Code</div>
              <div className="text-2xl font-black tracking-widest text-slate-900 bg-amber-100/70 p-2 rounded border border-amber-300">
                {selectedVoucherForPrint.code}
              </div>

              {selectedVoucherForPrint.pin && (
                <div className="text-xs text-slate-600">
                  PIN: <span className="font-bold">{selectedVoucherForPrint.pin}</span>
                </div>
              )}
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Plan:</span>
                <span className="font-bold">{selectedVoucherForPrint.packageName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Price:</span>
                <span className="font-bold">{formatTZS(selectedVoucherForPrint.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <span className="font-bold">{selectedVoucherForPrint.durationMinutes} Minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Speed:</span>
                <span className="font-bold">{formatBps(selectedVoucherForPrint.downloadSpeedKbps * 1000)}</span>
              </div>
            </div>

            <div className="text-[10px] text-center text-slate-500 font-sans leading-tight">
              1. Connect to WiFi network <br/>
              2. Open browser & enter voucher code <br/>
              3. Support Helpline: +255 754 100 200
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2 bg-slate-900 text-white rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-800"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slip</span>
            </button>
          </div>
        </div>
      )}

      {/* Multi-voucher Printable Sheet Modal (6-up layout) */}
      {showPrintSheet && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-4xl w-full p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">Printable Voucher Sheet (Batch Preview)</h3>
              </div>
              <button
                onClick={() => setShowPrintSheet(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid of tickets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vouchers.slice(0, 6).map(v => (
                <div key={v.id} className="bg-white text-slate-950 p-4 rounded-md border-2 border-dashed border-slate-300 font-mono space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-[10px]">
                    <span className="font-black">XCLOUD HOTSPOT</span>
                    <span className="font-bold text-amber-600">{formatTZS(v.price)}</span>
                  </div>
                  <div className="text-center py-1">
                    <div className="text-[10px] text-slate-500 uppercase">Code:</div>
                    <div className="text-base font-black tracking-widest text-slate-900 bg-amber-50 rounded border border-amber-200 py-1">
                      {v.code}
                    </div>
                    {v.pin && <div className="text-[10px] text-slate-600 font-bold mt-0.5">PIN: {v.pin}</div>}
                  </div>
                  <div className="text-[10px] text-slate-600 border-t border-slate-200 pt-1 flex justify-between">
                    <span>{v.packageName}</span>
                    <span className="font-bold">{formatBps(v.downloadSpeedKbps * 1000)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowPrintSheet(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white rounded flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Send to Printer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
