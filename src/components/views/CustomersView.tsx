import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  MapPin, 
  Wifi, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Customer, PackagePlan, Site } from '../../types/index.ts';
import { formatTZS } from '../../lib/formatters.ts';

interface CustomersViewProps {
  customers: Customer[];
  packages: PackagePlan[];
  sites: Site[];
  onOpenCreateCustomer: () => void;
  onRefreshCustomers: () => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  packages,
  sites,
  onOpenCreateCustomer,
  onRefreshCustomers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('ALL');

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.phone.includes(searchTerm);
    const matchesService = serviceFilter === 'ALL' || c.serviceType === serviceFilter;
    return matchesSearch && matchesService;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">ISP Subscribers & Hotspot Customers</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            PPPoE fiber accounts, static IP bindings, recurring subscriptions, and wallet balances
          </p>
        </div>
        <button
          onClick={onOpenCreateCustomer}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white rounded shadow-sm shadow-cyan-600/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Customer</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-lg">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by customer name, phone number, or PPPoE username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 pl-9 pr-3 py-2 rounded focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Services</option>
            <option value="PPPOE">PPPoE Fiber</option>
            <option value="HOTSPOT">Hotspot Users</option>
            <option value="STATIC_IP">Dedicated Static IP</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">Service & Credentials</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Active Plan</th>
                <th className="px-4 py-3">Site Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Account Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredCustomers.map(c => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-sans">
                    <div className="font-bold text-slate-100">{c.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">ID: {c.id.slice(0, 10)}</div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-sans">
                        {c.serviceType}
                      </span>
                      <span className="text-slate-200 font-bold">{c.username}</span>
                    </div>
                    {c.ipAddress && <div className="text-[10px] text-slate-400 mt-0.5">IP: {c.ipAddress}</div>}
                  </td>

                  <td className="px-4 py-3 font-sans">
                    <div className="text-slate-300 font-mono flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{c.phone}</span>
                    </div>
                    {c.email && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{c.email}</span>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3 font-sans">
                    <div className="font-semibold text-slate-200">{c.packageName}</div>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {c.autoRenew ? 'Auto-renew enabled' : 'Manual renewal'}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-sans text-slate-300">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{c.siteName}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {c.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right font-bold text-amber-400">
                    {formatTZS(c.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
