import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Terminal, 
  Copy, 
  Check, 
  Download, 
  ShieldCheck, 
  Clock, 
  Wifi, 
  AlertCircle,
  RefreshCw,
  Server,
  Key
} from 'lucide-react';
import { RouterDevice } from '../../types/index.ts';
import { safeFetch } from '../../services/api.ts';

interface RouterInstallViewProps {
  router: RouterDevice;
  onBack: () => void;
  onRouterUpdated: () => void;
}

export const RouterInstallView: React.FC<RouterInstallViewProps> = ({
  router,
  onBack,
  onRouterUpdated,
}) => {
  const [tokenData, setTokenData] = useState<{
    token: string;
    terminalCommand: string;
    expiresAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentRouterStatus, setCurrentRouterStatus] = useState<string>(router.status);
  const [lastHeartbeat, setLastHeartbeat] = useState<string>(router.lastSeen);

  const fetchInstallationToken = async () => {
    setLoading(true);
    const res = await safeFetch<any>(`/api/routers/${router.id}/install`, { method: 'POST' }, null);
    if (res.success && res.data) {
      setTokenData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInstallationToken();

    // Poll router status every 4 seconds to detect when bootstrap executes
    const interval = setInterval(async () => {
      const res = await safeFetch<any>(`/api/routers/${router.id}`, {}, null);
      if (res.success && res.data) {
        setCurrentRouterStatus(res.data.status);
        setLastHeartbeat(res.data.lastSeen);
        if (res.data.status === 'ONLINE') {
          onRouterUpdated();
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [router.id]);

  const copyCommand = () => {
    if (!tokenData) return;
    navigator.clipboard.writeText(tokenData.terminalCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Routers</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Status:</span>
          <span className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono ${
            currentRouterStatus === 'ONLINE'
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              : 'bg-amber-950 text-amber-400 border border-amber-800'
          }`}>
            {currentRouterStatus}
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Terminal className="w-4 h-4" />
            <span>Automatic Provisioning Pipeline</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            Install MikroTik: {router.name} ({router.routerId})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Generate and execute a single one-line RouterOS command to automatically configure Hotspot, FreeRADIUS, WireGuard VPN, and scheduled telemetry.
          </p>
        </div>

        {/* Token Credentials Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
          <div>
            <div className="text-[11px] text-slate-400">Router ID</div>
            <div className="text-sm font-bold text-cyan-400 mt-0.5">{router.routerId}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">One-Time Token</div>
            <div className="text-sm font-bold text-slate-200 mt-0.5 truncate">
              {tokenData?.token || 'Generating token...'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Token Expiry</div>
            <div className="text-sm font-bold text-amber-400 mt-0.5">
              {tokenData?.expiresAt ? new Date(tokenData.expiresAt).toLocaleTimeString() : '30 minutes'}
            </div>
          </div>
        </div>

        {/* Copyable RouterOS Terminal Command Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">RouterOS Terminal Command:</span>
            <span className="text-[11px] text-slate-400">Run via WinBox Terminal or SSH</span>
          </div>

          <div className="relative group">
            <pre className="p-4 bg-black/80 rounded-lg border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap break-all selection:bg-emerald-900 selection:text-white">
              {tokenData?.terminalCommand || '# Generating secure bootstrap payload...'}
            </pre>

            <button
              onClick={copyCommand}
              disabled={!tokenData}
              className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 border border-slate-700 shadow-md transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                  <span>Copy Command</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step-by-Step Flow Explanation */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Automated Provisioning Flow
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-md space-y-1">
              <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-[10px]">1</span>
                <span>One-Time Token Validation</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                MikroTik fetches the configuration over HTTPS. XCLOUD verifies the one-time token and immediately burns it to prevent reuse.
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-md space-y-1">
              <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-[10px]">2</span>
                <span>FreeRADIUS & Hotspot Binding</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Configures RADIUS client (1812/1813), enables interim updates (2m), and links the hotspot user profiles.
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-md space-y-1">
              <div className="font-semibold text-indigo-400 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center text-[10px]">3</span>
                <span>WireGuard Encrypted Tunnel</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Creates wg-xcloud interface with router-specific private key and links to XCLOUD gateway at 10.88.0.1/16.
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-md space-y-1">
              <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-amber-950 border border-amber-800 flex items-center justify-center text-[10px]">4</span>
                <span>Scheduler & Live Heartbeat</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Schedules a 60s background heartbeat script reporting CPU, memory, and active users to switch router to ONLINE.
              </p>
            </div>
          </div>
        </div>

        {/* Live Status Watcher */}
        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
            <div>
              <div className="text-xs font-semibold text-white">Listening for Router Heartbeat...</div>
              <div className="text-[11px] text-slate-400">
                Last signal: {lastHeartbeat ? new Date(lastHeartbeat).toLocaleTimeString() : 'Never'}
              </div>
            </div>
          </div>

          {currentRouterStatus === 'ONLINE' ? (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded border border-emerald-800">
              <Check className="w-4 h-4" />
              <span>ROUTER IS ONLINE!</span>
            </div>
          ) : (
            <div className="text-xs text-amber-400 font-mono">
              Awaiting script execution...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
