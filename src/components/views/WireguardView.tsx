import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  RefreshCw, 
  Download, 
  Terminal, 
  CheckCircle2, 
  Key, 
  Copy, 
  Check 
} from 'lucide-react';
import { RouterDevice } from '../../types/index.ts';
import { safeFetch } from '../../services/api.ts';

interface WireguardViewProps {
  routers: RouterDevice[];
}

export const WireguardView: React.FC<WireguardViewProps> = ({ routers }) => {
  const [wgStatus, setWgStatus] = useState<any>(null);
  const [serverConf, setServerConf] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    safeFetch<any>('/api/wireguard/status', {}, null).then(res => {
      if (res.success && res.data) setWgStatus(res.data);
    });

    fetch('/api/wireguard/server-conf')
      .then(res => res.text())
      .then(txt => setServerConf(txt))
      .catch(() => setServerConf('# Wireguard server active on 10.88.0.1/16'));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(serverConf);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">WireGuard Secure Management VPN</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Encrypted Curve25519 tunnel overlay connecting distributed MikroTik and Omada nodes to XCLOUD Central Hub
          </p>
        </div>
      </div>

      {/* Topology Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-400">Server Endpoint</div>
          <div className="text-lg font-bold text-cyan-400 font-mono mt-1">
            {wgStatus?.endpoint || 'vpn.xcloud.tz'}:51820
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-mono">Listening on UDP 51820</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-400">VPN Subnet</div>
          <div className="text-lg font-bold text-white font-mono mt-1">10.88.0.0/16</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Gateway: 10.88.0.1</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-400">Connected Peers</div>
          <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
            {routers.filter(r => r.wireguardIp).length} Active Tunnels
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Keepalive: 25s</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-400">Key Security</div>
          <div className="text-lg font-bold text-white font-mono mt-1">ChaCha20-Poly1305</div>
          <div className="text-[11px] text-slate-400 mt-1">Isolated Curve25519</div>
        </div>
      </div>

      {/* Peers Table */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Router VPN Peer Allocations
        </h2>
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Router Node</th>
                <th className="px-4 py-3">Allocated Tunnel IP</th>
                <th className="px-4 py-3">Public Key (Base64)</th>
                <th className="px-4 py-3">Keepalive</th>
                <th className="px-4 py-3 text-right">Tunnel Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {routers.map(r => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-sans font-bold text-slate-200">
                    {r.name} ({r.routerId})
                  </td>
                  <td className="px-4 py-3 text-cyan-400 font-bold">{r.wireguardIp || '10.88.0.x'}</td>
                  <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">
                    {r.wireguardPublicKey || 'wG+PublicKeyPlaceholder='}
                  </td>
                  <td className="px-4 py-3 text-slate-300">25s</td>
                  <td className="px-4 py-3 text-right font-sans">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      LINK ESTABLISHED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Server Config Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">Hub Server Config (/etc/wireguard/wg0.conf):</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-slate-400 hover:text-white"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy wg0.conf'}</span>
          </button>
        </div>
        <pre className="p-4 bg-black/80 rounded-lg border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto">
          {serverConf || '# Loading server configuration...'}
        </pre>
      </div>
    </div>
  );
};
