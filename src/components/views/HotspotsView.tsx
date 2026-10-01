import React, { useState } from 'react';
import { 
  Wifi, 
  ShieldCheck, 
  Globe, 
  Layers, 
  Users, 
  Lock, 
  ExternalLink,
  Plus
} from 'lucide-react';
import { Site, RouterDevice } from '../../types/index.ts';

interface HotspotsViewProps {
  sites: Site[];
  routers: RouterDevice[];
}

export const HotspotsView: React.FC<HotspotsViewProps> = ({
  sites,
  routers,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Hotspot Servers & PPPoE Concentrators</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            MikroTik Hotspot server profiles, IP address pools, NAT rules, Walled Garden entries, and PPPoE server bindings
          </p>
        </div>
      </div>

      {/* Hotspot Server Instances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {routers.map(router => (
          <div key={router.id} className="p-5 bg-slate-900/90 border border-slate-800 rounded-lg space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 font-mono">
                  {router.vendor} HOTSPOT SERVER
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">{router.name}</h3>
                <p className="text-xs text-slate-400 font-mono">Site: {router.siteName} · Gateway: {router.ipAddress}</p>
              </div>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                router.status === 'ONLINE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}>
                {router.status}
              </span>
            </div>

            {/* Server Settings */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/80 rounded border border-slate-800 font-mono text-xs">
              <div>
                <div className="text-[10px] text-slate-400">Hotspot Subnet Pool</div>
                <div className="font-bold text-slate-200 mt-0.5">10.5.50.0/24</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">DNS Name</div>
                <div className="font-bold text-cyan-400 mt-0.5">login.xcloud.tz</div>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <div className="text-[10px] text-slate-400">Auth Method</div>
                <div className="font-bold text-slate-200 mt-0.5">HTTP-CHAP / PAP</div>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <div className="text-[10px] text-slate-400">RADIUS Interim</div>
                <div className="font-bold text-emerald-400 mt-0.5">120 seconds</div>
              </div>
            </div>

            {/* Walled Garden Destinations */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Walled Garden (Free Access Prior to Login)</span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs font-mono">
                {['api.safaricom.co.ke', 'openapi.airtel.africa', 'api.tigopesa.co.tz', 'api.selcom.net', 'portal.xcloud.tz'].map(domain => (
                  <span key={domain} className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[11px]">
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
