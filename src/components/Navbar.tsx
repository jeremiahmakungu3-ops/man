import React from 'react';
import { 
  Radio, 
  ShieldCheck, 
  Cpu, 
  MapPin, 
  Plus, 
  Zap, 
  DollarSign, 
  Ticket, 
  Wifi,
  ExternalLink
} from 'lucide-react';
import { Site, Organization, User } from '../types/index.ts';

interface NavbarProps {
  currentOrg: Organization | null;
  sites: Site[];
  selectedSiteId: string;
  onSelectSite: (id: string) => void;
  currentUser: User | null;
  onOpenQuickVoucher: () => void;
  onOpenAddRouter: () => void;
  onOpenPortalModal: () => void;
  onSwitchView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentOrg,
  sites,
  selectedSiteId,
  onSelectSite,
  currentUser,
  onOpenQuickVoucher,
  onOpenAddRouter,
  onOpenPortalModal,
  onSwitchView,
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20 sticky top-0">
      {/* Brand & Organization */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div 
          onClick={() => onSwitchView('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="h-9 w-9 rounded-lg bg-cyan-600 flex items-center justify-center font-black text-white text-lg tracking-wider shadow-lg shadow-cyan-600/30 group-hover:bg-cyan-500 transition-colors">
            X
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight">XCLOUD</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60">
                ISP CORE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Hotspot Billing · MikroTik & Omada · Mobile Money
            </p>
          </div>
        </div>

        {/* Site Switcher */}
        <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Site:</span>
          <select 
            value={selectedSiteId}
            onChange={(e) => onSelectSite(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded px-2.5 py-1 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          >
            <option value="ALL">All Network Sites</option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>
                {s.city} — {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Network Health Indicators & Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Core Services Live Telemetry Indicator */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400 bg-slate-900/90 border border-slate-800/80 px-3 py-1.5 rounded-md">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-mono text-[11px]">FreeRADIUS</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-500"></span>
            <span className="text-slate-300 font-mono text-[11px]">WireGuard 10.88.0.1</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300 font-mono text-[11px]">M-Pesa Live</span>
          </div>
        </div>

        {/* Captive Portal Test Preview */}
        <button
          onClick={onOpenPortalModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium rounded transition-colors"
          title="Open Mobile Captive Portal Simulator"
        >
          <Wifi className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Captive Portal</span>
        </button>

        {/* Quick Issue Voucher Button */}
        <button
          onClick={onOpenQuickVoucher}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded shadow-sm shadow-cyan-600/30 transition-colors"
        >
          <Ticket className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Generate Vouchers</span>
        </button>

        {/* User Role */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-200">
            {currentUser?.name?.slice(0, 1) || 'A'}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-medium text-slate-200 leading-none">{currentUser?.name || 'Administrator'}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-none">{currentUser?.role || 'SUPER_ADMIN'}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
