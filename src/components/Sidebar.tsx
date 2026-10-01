import React from 'react';
import { 
  LayoutDashboard, 
  Router as RouterIcon, 
  Wifi, 
  Boxes, 
  Ticket, 
  Users, 
  Activity, 
  CreditCard, 
  Store, 
  Radio, 
  Server, 
  ShieldAlert, 
  LineChart, 
  FileText, 
  Settings,
  Flame
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  onlineRoutersCount: number;
  totalRoutersCount: number;
  activeSessionsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  onlineRoutersCount,
  totalRoutersCount,
  activeSessionsCount,
}) => {
  const navSections = [
    {
      title: 'OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { 
          id: 'routers', 
          label: 'Routers', 
          icon: RouterIcon, 
          badge: `${onlineRoutersCount}/${totalRoutersCount}` 
        },
        { id: 'hotspots', label: 'Hotspots & PPPoE', icon: Wifi },
        { id: 'packages', label: 'Packages & Rates', icon: Boxes },
        { id: 'vouchers', label: 'Vouchers', icon: Ticket },
        { id: 'customers', label: 'Customers', icon: Users },
        { 
          id: 'sessions', 
          label: 'Active Sessions', 
          icon: Activity, 
          badge: activeSessionsCount > 0 ? `${activeSessionsCount}` : undefined 
        },
      ],
    },
    {
      title: 'BILLING & COMMERCE',
      items: [
        { id: 'payments', label: 'Payments & M-Pesa', icon: CreditCard },
        { id: 'agent-pos', label: 'Agent / POS', icon: Store },
        { id: 'portal', label: 'Captive Portal', icon: Flame },
      ],
    },
    {
      title: 'NETWORK INFRASTRUCTURE',
      items: [
        { id: 'omada', label: 'TP-Link Omada', icon: Radio },
        { id: 'radius', label: 'FreeRADIUS Server', icon: Server },
        { id: 'wireguard', label: 'WireGuard VPN', icon: ShieldAlert },
        { id: 'monitoring', label: 'Monitoring & Logs', icon: LineChart },
      ],
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { id: 'reports', label: 'Reports & Export', icon: FileText },
        { id: 'settings', label: 'System Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col flex-shrink-0 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="p-3 space-y-6">
        {navSections.map(section => (
          <div key={section.title}>
            <div className="px-3 mb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              {section.title}
            </div>
            <nav className="space-y-0.5">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectView(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                        isActive
                          ? 'bg-cyan-800/80 text-cyan-100'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-auto p-4 border-t border-slate-900 bg-slate-950/90 text-[11px] text-slate-400">
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span>XCLOUD v3.2-PRO</span>
          <span className="text-emerald-400">CORE SYNCED</span>
        </div>
        <div className="mt-1 text-[10px] text-slate-400">
          Dar es Salaam · Arusha · Mwanza
        </div>
      </div>
    </aside>
  );
};
