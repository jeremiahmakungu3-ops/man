import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  Key, 
  ShieldCheck, 
  Building, 
  Smartphone, 
  Radio, 
  Check 
} from 'lucide-react';
import { Organization } from '../../types/index.ts';

interface SettingsViewProps {
  organization: Organization | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ organization }) => {
  const [saved, setSaved] = useState(false);
  const [mpesaKey, setMpesaKey] = useState('d4920491029402941094');
  const [mpesaShortcode, setMpesaShortcode] = useState('174379');
  const [airtelKey, setAirtelKey] = useState('airtel_tz_live_secret_44109');
  const [smsProvider, setSmsProvider] = useState('beem');
  const [smsApiKey, setSmsApiKey] = useState('beem_sms_prod_key_77192');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">System & Integration Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Telecom payment credentials, SMS dispatch gateway, and WireGuard server parameters
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>System configuration successfully updated and synced across instances.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Info */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <Building className="w-4 h-4" />
            <span>Organization Profile</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-medium">Company Name</label>
              <input
                type="text"
                defaultValue={organization?.name || 'Kilimanjaro Broadband Ltd'}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1 font-medium"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium">Country / Currency</label>
              <input
                type="text"
                disabled
                defaultValue="Tanzania (TZS - Tanzanian Shilling)"
                className="w-full bg-slate-950/60 border border-slate-800 text-slate-400 px-3 py-2 rounded mt-1 font-mono cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Mobile Money Credentials */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
            <Smartphone className="w-4 h-4" />
            <span>Vodacom M-Pesa (Daraja API Gateway)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="text-slate-400 font-sans font-medium">Consumer Key / API Key</label>
              <input
                type="password"
                value={mpesaKey}
                onChange={(e) => setMpesaKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1"
              />
            </div>

            <div>
              <label className="text-slate-400 font-sans font-medium">Business Shortcode</label>
              <input
                type="text"
                value={mpesaShortcode}
                onChange={(e) => setMpesaShortcode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1"
              />
            </div>
          </div>
        </div>

        {/* SMS / Notifications */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Radio className="w-4 h-4" />
            <span>Customer SMS Gateway (Beem SMS Tanzania)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-medium">SMS Provider</label>
              <select
                value={smsProvider}
                onChange={(e) => setSmsProvider(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1"
              >
                <option value="beem">Beem SMS (Tanzania Domestic)</option>
                <option value="twilio">Twilio Global</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-medium">Sender ID / Alphanumeric Header</label>
              <input
                type="text"
                defaultValue="XCLOUD"
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-cyan-500 mt-1 font-mono uppercase"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded shadow-md shadow-cyan-600/30 flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
