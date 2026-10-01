import React, { useState } from 'react';
import { 
  Boxes, 
  Plus, 
  Zap, 
  Clock, 
  Wifi, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { PackagePlan } from '../../types/index.ts';
import { formatTZS, formatBytes, formatBps } from '../../lib/formatters.ts';

interface PackagesViewProps {
  packages: PackagePlan[];
  onOpenCreatePackage: () => void;
  onRefreshPackages: () => void;
}

export const PackagesView: React.FC<PackagesViewProps> = ({
  packages,
  onOpenCreatePackage,
  onRefreshPackages,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Bandwidth Packages & Rates</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure speed tiers, time duration, device limits, data quotas, and pricing in Tanzanian Shillings (TZS)
          </p>
        </div>
        <button
          onClick={onOpenCreatePackage}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white rounded shadow-sm shadow-cyan-600/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Rate Plan</span>
        </button>
      </div>

      {/* Grid of Packages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map(pkg => (
          <div 
            key={pkg.id} 
            className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-lg p-5 flex flex-col justify-between transition-colors relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/60 font-mono">
                    {pkg.serviceType}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1.5">{pkg.name}</h3>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-amber-400 font-mono">
                    {formatTZS(pkg.price)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">Tax inclusive</div>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                {pkg.description || 'Standard high-speed internet package with QoS rate limits.'}
              </p>

              {/* Speeds & Limits Specs */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/70 rounded-md border border-slate-800/80 font-mono text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <ArrowDownRight className="w-3 h-3 text-emerald-400" />
                    <span>Download</span>
                  </div>
                  <div className="font-bold text-emerald-400 mt-0.5">
                    {formatBps(pkg.downloadSpeedKbps * 1000)}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3 text-cyan-400" />
                    <span>Upload</span>
                  </div>
                  <div className="font-bold text-cyan-400 mt-0.5">
                    {formatBps(pkg.uploadSpeedKbps * 1000)}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Active Time</span>
                  </div>
                  <div className="font-bold text-slate-200 mt-0.5">
                    {pkg.durationMinutes >= 1440 
                      ? `${Math.round(pkg.durationMinutes / 1440)} Days` 
                      : `${Math.round(pkg.durationMinutes / 60)} Hours`}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-slate-400" />
                    <span>Devices</span>
                  </div>
                  <div className="font-bold text-slate-200 mt-0.5">
                    {pkg.deviceLimit} simultaneous
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom info */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">
                Data Quota: <strong className="text-slate-200">{pkg.dataLimitMb > 0 ? `${pkg.dataLimitMb} MB` : 'Unlimited'}</strong>
              </span>
              <span className="text-[11px] font-bold text-emerald-400">
                ACTIVE
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
