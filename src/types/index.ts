export type Role = 
  | 'SUPER_ADMIN' 
  | 'ORGANIZATION_ADMIN' 
  | 'MANAGER' 
  | 'TECHNICIAN' 
  | 'AGENT' 
  | 'VIEWER';

export type RouterVendor = 'MIKROTIK' | 'OMADA';

export type RouterStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'CONFIGURING';

export type VoucherStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'DISABLED';

export type PaymentGatewayType = 'MPESA' | 'AIRTEL' | 'TIGO' | 'SELCOM' | 'CASH';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export type CustomerStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'PENDING';

export type ServiceType = 'HOTSPOT' | 'PPPOE' | 'STATIC_IP';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  organizationName?: string;
  siteId?: string;
  phone?: string;
  active: boolean;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
  contactPhone: string;
  country: string;
  currency: string;
  timezone: string;
  subscriptionPlan: 'COMMUNITY' | 'PRO_WISP' | 'ENTERPRISE_ISP';
  active: boolean;
  createdAt: string;
}

export interface Site {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  city: string;
  address: string;
  routerCount?: number;
  activeUsersCount?: number;
  createdAt: string;
}

export interface RouterInterface {
  name: string;
  type: 'ethernet' | 'wireless' | 'vlan' | 'bridge' | 'wireguard' | 'pppoe';
  macAddress: string;
  ipAddress?: string;
  rxBytes: number;
  txBytes: number;
  rxRate: number; // in bps
  txRate: number; // in bps
  linkUp: boolean;
}

export interface RouterDevice {
  id: string;
  organizationId: string;
  siteId: string;
  siteName?: string;
  name: string;
  vendor: RouterVendor;
  model: string;
  serialNumber: string;
  ipAddress: string;
  managementPort: number;
  username: string;
  routerId: string; // Unique XCLOUD identifier (e.g. XC-DAR-001)
  installationToken?: string;
  installationStatus: 'PENDING_INSTALL' | 'INSTALLED' | 'REBOOTING';
  tokenExpiresAt?: string;
  status: RouterStatus;
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  uptimeSeconds: number;
  activeUsers: number;
  wireguardIp?: string;
  wireguardPublicKey?: string;
  version?: string;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
  interfaces?: RouterInterface[];
}

export interface PackagePlan {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  price: number; // in TZS
  durationMinutes: number;
  downloadSpeedKbps: number;
  uploadSpeedKbps: number;
  dataLimitMb: number; // 0 = unlimited
  validityHours: number;
  deviceLimit: number;
  serviceType: ServiceType;
  active: boolean;
  createdAt: string;
}

export interface Voucher {
  id: string;
  organizationId: string;
  siteId?: string;
  packageId: string;
  packageName?: string;
  code: string;
  pin?: string;
  price: number;
  durationMinutes: number;
  downloadSpeedKbps: number;
  uploadSpeedKbps: number;
  dataLimitMb: number;
  status: VoucherStatus;
  batchId?: string;
  usedByMac?: string;
  usedByPhone?: string;
  usedAt?: string;
  expiresAt: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  organizationId: string;
  siteId: string;
  siteName?: string;
  name: string;
  phone: string;
  email: string;
  username: string;
  serviceType: ServiceType;
  packageId: string;
  packageName?: string;
  ipAddress?: string;
  macAddress?: string;
  status: CustomerStatus;
  balance: number;
  autoRenew: boolean;
  createdAt: string;
}

export interface RadiusSession {
  id: string;
  organizationId: string;
  routerId: string;
  routerName?: string;
  username: string;
  framedIpAddress: string;
  callingStationId: string; // MAC address
  nasIpAddress: string;
  serviceType: ServiceType;
  startTime: string;
  lastUpdateTime: string;
  sessionTimeout: number;
  inputOctets: number; // Download bytes
  outputOctets: number; // Upload bytes
  acctSessionId: string;
  status: 'ACTIVE' | 'STOPPED';
}

export interface PaymentTransaction {
  id: string;
  organizationId: string;
  siteId?: string;
  customerId?: string;
  customerName?: string;
  voucherId?: string;
  packageId?: string;
  packageName?: string;
  gateway: PaymentGatewayType;
  gatewayReference?: string;
  transactionReference: string; // Internal unique reference
  phone: string;
  amount: number; // TZS
  currency: string;
  status: PaymentStatus;
  idempotencyKey: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  organizationId: string;
  siteId?: string;
  name: string;
  phone: string;
  email: string;
  floatBalance: number; // TZS
  commissionRate: number; // percentage (e.g. 10%)
  totalSales: number;
  totalCommissionEarned: number;
  active: boolean;
  createdAt: string;
}

export interface OmadaAccessPoint {
  id: string;
  mac: string;
  name: string;
  model: string;
  ip: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ISOLATED';
  clientsCount: number;
  channel2g: number;
  channel5g: number;
  txRate: number;
  rxRate: number;
  cpu: number;
  memory: number;
}

export interface OmadaClient {
  mac: string;
  ip: string;
  name?: string;
  ssid: string;
  apMac: string;
  apName: string;
  signalStrength: number; // dBm
  trafficDown: number; // Bytes
  trafficUp: number; // Bytes
  connectedTime: string;
}

export interface MonitoringStats {
  totalRouters: number;
  onlineRouters: number;
  offlineRouters: number;
  activeSessions: number;
  todayRevenue: number;
  monthlyRevenue: number;
  activeVouchers: number;
  totalCustomers: number;
  bandwidthUsageMbps: {
    download: number;
    upload: number;
  };
}

export interface WireguardTunnel {
  interfaceName: string;
  serverEndpoint: string;
  serverPort: number;
  serverPublicKey: string;
  subnet: string;
  peersCount: number;
  activeTunnels: number;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}
