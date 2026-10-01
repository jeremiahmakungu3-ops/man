import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { DashboardView } from './components/views/DashboardView.tsx';
import { RoutersView } from './components/views/RoutersView.tsx';
import { RouterInstallView } from './components/views/RouterInstallView.tsx';
import { HotspotsView } from './components/views/HotspotsView.tsx';
import { PackagesView } from './components/views/PackagesView.tsx';
import { VouchersView } from './components/views/VouchersView.tsx';
import { CustomersView } from './components/views/CustomersView.tsx';
import { SessionsView } from './components/views/SessionsView.tsx';
import { PaymentsView } from './components/views/PaymentsView.tsx';
import { CaptivePortalView } from './components/views/CaptivePortalView.tsx';
import { AgentPosView } from './components/views/AgentPosView.tsx';
import { OmadaView } from './components/views/OmadaView.tsx';
import { RadiusView } from './components/views/RadiusView.tsx';
import { WireguardView } from './components/views/WireguardView.tsx';
import { MonitoringView } from './components/views/MonitoringView.tsx';
import { ReportsView } from './components/views/ReportsView.tsx';
import { SettingsView } from './components/views/SettingsView.tsx';

import { GenerateVouchersModal } from './components/modals/GenerateVouchersModal.tsx';
import { AddRouterModal } from './components/modals/AddRouterModal.tsx';
import { CreatePackageModal } from './components/modals/CreatePackageModal.tsx';
import { CreateCustomerModal } from './components/modals/CreateCustomerModal.tsx';
import { InitiateStkModal } from './components/modals/InitiateStkModal.tsx';

import {
  Organization,
  User,
  Site,
  RouterDevice,
  PackagePlan,
  Voucher,
  Customer,
  RadiusSession,
  PaymentTransaction,
  Agent,
  OmadaAccessPoint,
  OmadaClient,
  AuditLog,
} from './types/index.ts';

import { safeFetch } from './services/api.ts';
import {
  initialOrganizations,
  initialUser,
  initialSites,
  initialRouters,
  initialPackages,
  initialVouchers,
  initialCustomers,
  initialSessions,
  initialPayments,
  initialAgents,
  initialOmadaAps,
  initialOmadaClients,
  initialAuditLogs,
} from './services/seedData.ts';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [installingRouter, setInstallingRouter] = useState<RouterDevice | null>(null);

  // Core Data State (Pre-populated with rich network data so UI never crashes or flashes blank)
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser);
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations);
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('ALL');

  const [routers, setRouters] = useState<RouterDevice[]>(initialRouters);
  const [packages, setPackages] = useState<PackagePlan[]>(initialPackages);
  const [vouchers, setVouchers] = useState<Voucher[]>(initialVouchers);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [sessions, setSessions] = useState<RadiusSession[]>(initialSessions);
  const [payments, setPayments] = useState<PaymentTransaction[]>(initialPayments);
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [omadaAps, setOmadaAps] = useState<OmadaAccessPoint[]>(initialOmadaAps);
  const [omadaClients, setOmadaClients] = useState<OmadaClient[]>(initialOmadaClients);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);

  // Modals State
  const [showGenerateVoucherModal, setShowGenerateVoucherModal] = useState(false);
  const [showAddRouterModal, setShowAddRouterModal] = useState(false);
  const [showCreatePackageModal, setShowCreatePackageModal] = useState(false);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [showInitiateStkModal, setShowInitiateStkModal] = useState(false);

  // Safe background live synchronization
  const fetchData = async () => {
    try {
      const [
        userRes,
        orgsRes,
        sitesRes,
        routersRes,
        packagesRes,
        vouchersRes,
        customersRes,
        sessionsRes,
        paymentsRes,
        agentsRes,
        apsRes,
        clientsRes,
        statsRes,
      ] = await Promise.all([
        safeFetch<User | null>('/api/auth/me', {}, null),
        safeFetch<Organization[]>('/api/organizations', {}, []),
        safeFetch<Site[]>('/api/sites', {}, []),
        safeFetch<RouterDevice[]>('/api/routers', {}, []),
        safeFetch<PackagePlan[]>('/api/packages', {}, []),
        safeFetch<Voucher[]>('/api/vouchers', {}, []),
        safeFetch<Customer[]>('/api/customers', {}, []),
        safeFetch<RadiusSession[]>('/api/sessions', {}, []),
        safeFetch<PaymentTransaction[]>('/api/payments', {}, []),
        safeFetch<Agent[]>('/api/agents', {}, []),
        safeFetch<OmadaAccessPoint[]>('/api/omada/aps', {}, []),
        safeFetch<OmadaClient[]>('/api/omada/clients', {}, []),
        safeFetch<any>('/api/monitoring/stats', {}, {}),
      ]);

      if (userRes.success && userRes.data) setCurrentUser(userRes.data);
      if (orgsRes.success && Array.isArray(orgsRes.data) && orgsRes.data.length > 0) setOrganizations(orgsRes.data);
      if (sitesRes.success && Array.isArray(sitesRes.data) && sitesRes.data.length > 0) setSites(sitesRes.data);
      if (routersRes.success && Array.isArray(routersRes.data) && routersRes.data.length > 0) setRouters(routersRes.data);
      if (packagesRes.success && Array.isArray(packagesRes.data) && packagesRes.data.length > 0) setPackages(packagesRes.data);
      if (vouchersRes.success && Array.isArray(vouchersRes.data) && vouchersRes.data.length > 0) setVouchers(vouchersRes.data);
      if (customersRes.success && Array.isArray(customersRes.data) && customersRes.data.length > 0) setCustomers(customersRes.data);
      if (sessionsRes.success && Array.isArray(sessionsRes.data) && sessionsRes.data.length > 0) setSessions(sessionsRes.data);
      if (paymentsRes.success && Array.isArray(paymentsRes.data) && paymentsRes.data.length > 0) setPayments(paymentsRes.data);
      if (agentsRes.success && Array.isArray(agentsRes.data) && agentsRes.data.length > 0) setAgents(agentsRes.data);
      if (apsRes.success && Array.isArray(apsRes.data) && apsRes.data.length > 0) setOmadaAps(apsRes.data);
      if (clientsRes.success && Array.isArray(clientsRes.data) && clientsRes.data.length > 0) setOmadaClients(clientsRes.data);
      if (statsRes.success && statsRes.data?.auditLogs && Array.isArray(statsRes.data.auditLogs)) {
        setAuditLogs(statsRes.data.auditLogs);
      }
    } catch {
      // Quietly retain active memory state without logging fatal console errors
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenInstaller = (router: RouterDevice) => {
    setInstallingRouter(router);
    setCurrentView('router-install');
  };

  const currentOrg = organizations[0] || null;

  // Filter items by active site if selected
  const displayedRouters = selectedSiteId === 'ALL'
    ? routers
    : routers.filter(r => r.siteId === selectedSiteId);

  const displayedVouchers = selectedSiteId === 'ALL'
    ? vouchers
    : vouchers.filter(v => !v.siteId || v.siteId === selectedSiteId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentOrg={currentOrg}
        sites={sites}
        selectedSiteId={selectedSiteId}
        onSelectSite={setSelectedSiteId}
        currentUser={currentUser}
        onOpenQuickVoucher={() => setShowGenerateVoucherModal(true)}
        onOpenAddRouter={() => setShowAddRouterModal(true)}
        onOpenPortalModal={() => setCurrentView('portal')}
        onSwitchView={setCurrentView}
      />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={(v) => {
            if (v !== 'router-install') setInstallingRouter(null);
            setCurrentView(v);
          }}
          onlineRoutersCount={routers.filter(r => r.status === 'ONLINE').length}
          totalRoutersCount={routers.length}
          activeSessionsCount={sessions.filter(s => s.status === 'ACTIVE').length}
        />

        {/* Center Content View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950/50">
          {currentView === 'dashboard' && (
            <DashboardView
              routers={displayedRouters}
              payments={payments}
              vouchers={displayedVouchers}
              sessions={sessions}
              auditLogs={auditLogs}
              onSelectView={setCurrentView}
              onOpenQuickVoucher={() => setShowGenerateVoucherModal(true)}
              onOpenAddRouter={() => setShowAddRouterModal(true)}
            />
          )}

          {currentView === 'routers' && (
            <RoutersView
              routers={displayedRouters}
              sites={sites}
              onOpenAddRouter={() => setShowAddRouterModal(true)}
              onOpenInstaller={handleOpenInstaller}
              onRefreshRouters={fetchData}
            />
          )}

          {currentView === 'router-install' && (
            <RouterInstallView
              router={installingRouter || routers[0]}
              onBack={() => setCurrentView('routers')}
              onRouterUpdated={fetchData}
            />
          )}

          {currentView === 'hotspots' && (
            <HotspotsView
              sites={sites}
              routers={displayedRouters}
            />
          )}

          {currentView === 'packages' && (
            <PackagesView
              packages={packages}
              onOpenCreatePackage={() => setShowCreatePackageModal(true)}
              onRefreshPackages={fetchData}
            />
          )}

          {currentView === 'vouchers' && (
            <VouchersView
              vouchers={displayedVouchers}
              packages={packages}
              onOpenGenerateModal={() => setShowGenerateVoucherModal(true)}
              onRefreshVouchers={fetchData}
            />
          )}

          {currentView === 'customers' && (
            <CustomersView
              customers={customers}
              packages={packages}
              sites={sites}
              onOpenCreateCustomer={() => setShowCreateCustomerModal(true)}
              onRefreshCustomers={fetchData}
            />
          )}

          {currentView === 'sessions' && (
            <SessionsView
              sessions={sessions}
              onRefreshSessions={fetchData}
            />
          )}

          {currentView === 'payments' && (
            <PaymentsView
              payments={payments}
              packages={packages}
              onRefreshPayments={fetchData}
              onOpenInitiateModal={() => setShowInitiateStkModal(true)}
            />
          )}

          {currentView === 'portal' && (
            <CaptivePortalView
              packages={packages}
              sites={sites}
              onRefreshData={fetchData}
            />
          )}

          {currentView === 'agent-pos' && (
            <AgentPosView
              agents={agents}
              packages={packages}
              onRefreshData={fetchData}
            />
          )}

          {currentView === 'omada' && (
            <OmadaView
              accessPoints={omadaAps}
              clients={omadaClients}
              onRefreshData={fetchData}
            />
          )}

          {currentView === 'radius' && (
            <RadiusView
              routers={displayedRouters}
            />
          )}

          {currentView === 'wireguard' && (
            <WireguardView
              routers={displayedRouters}
            />
          )}

          {currentView === 'monitoring' && (
            <MonitoringView
              routers={displayedRouters}
              auditLogs={auditLogs}
              onRefreshData={fetchData}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView
              payments={payments}
              vouchers={displayedVouchers}
              agents={agents}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              organization={currentOrg}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <GenerateVouchersModal
        isOpen={showGenerateVoucherModal}
        onClose={() => setShowGenerateVoucherModal(false)}
        packages={packages}
        sites={sites}
        onGenerated={fetchData}
      />

      <AddRouterModal
        isOpen={showAddRouterModal}
        onClose={() => setShowAddRouterModal(false)}
        sites={sites}
        onRouterAdded={fetchData}
      />

      <CreatePackageModal
        isOpen={showCreatePackageModal}
        onClose={() => setShowCreatePackageModal(false)}
        onPackageCreated={fetchData}
      />

      <CreateCustomerModal
        isOpen={showCreateCustomerModal}
        onClose={() => setShowCreateCustomerModal(false)}
        packages={packages}
        sites={sites}
        onCustomerCreated={fetchData}
      />

      <InitiateStkModal
        isOpen={showInitiateStkModal}
        onClose={() => setShowInitiateStkModal(false)}
        packages={packages}
        sites={sites}
        onPaymentInitiated={fetchData}
      />
    </div>
  );
}
