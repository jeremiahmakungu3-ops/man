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
} from '../src/types/index.ts';

class DatabaseStore {
  organizations: Organization[] = [];
  users: User[] = [];
  sites: Site[] = [];
  routers: RouterDevice[] = [];
  packages: PackagePlan[] = [];
  vouchers: Voucher[] = [];
  customers: Customer[] = [];
  sessions: RadiusSession[] = [];
  payments: PaymentTransaction[] = [];
  agents: Agent[] = [];
  omadaAps: OmadaAccessPoint[] = [];
  omadaClients: OmadaClient[] = [];
  auditLogs: AuditLog[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    // 1. Primary Organization
    this.organizations = [
      {
        id: 'org_kili_01',
        name: 'Kilimanjaro Broadband Ltd',
        slug: 'kilimanjaro-isp',
        contactEmail: 'noc@kilimanjarobroadband.co.tz',
        contactPhone: '+255 754 100 200',
        country: 'Tanzania',
        currency: 'TZS',
        timezone: 'Africa/Dar_es_Salaam',
        subscriptionPlan: 'ENTERPRISE_ISP',
        active: true,
        createdAt: '2026-01-10T08:00:00Z',
      },
      {
        id: 'org_zanzibar_02',
        name: 'Zanzibar Hotspot & Fiber',
        slug: 'zanzibar-wifi',
        contactEmail: 'admin@zanzibarwifi.co.tz',
        contactPhone: '+255 777 500 600',
        country: 'Tanzania',
        currency: 'TZS',
        timezone: 'Africa/Dar_es_Salaam',
        subscriptionPlan: 'PRO_WISP',
        active: true,
        createdAt: '2026-02-01T10:00:00Z',
      },
    ];

    // 2. Admin & Staff Users
    this.users = [
      {
        id: 'usr_admin_01',
        email: 'admin@xcloud.tz',
        name: 'Mussa Matembo',
        role: 'SUPER_ADMIN',
        organizationId: 'org_kili_01',
        organizationName: 'Kilimanjaro Broadband Ltd',
        phone: '+255 754 112 233',
        active: true,
        createdAt: '2026-01-10T08:00:00Z',
      },
      {
        id: 'usr_noc_02',
        email: 'noc@kilimanjarobroadband.co.tz',
        name: 'Baraka Juma (Lead NOC)',
        role: 'TECHNICIAN',
        organizationId: 'org_kili_01',
        organizationName: 'Kilimanjaro Broadband Ltd',
        phone: '+255 784 990 011',
        active: true,
        createdAt: '2026-01-15T09:00:00Z',
      },
      {
        id: 'usr_agent_03',
        email: 'pos.kariakoo@xcloud.tz',
        name: 'Fatma Bakari (Kariakoo POS)',
        role: 'AGENT',
        organizationId: 'org_kili_01',
        organizationName: 'Kilimanjaro Broadband Ltd',
        phone: '+255 713 445 566',
        active: true,
        createdAt: '2026-02-10T11:00:00Z',
      },
    ];

    // 3. Sites across Tanzania
    this.sites = [
      {
        id: 'site_dar_01',
        organizationId: 'org_kili_01',
        name: 'Dar es Salaam - Kariakoo Commercial Hub',
        code: 'DAR-KRK',
        city: 'Dar es Salaam',
        address: 'Msimbazi St, Kariakoo',
        routerCount: 2,
        activeUsersCount: 142,
        createdAt: '2026-01-12T09:00:00Z',
      },
      {
        id: 'site_arusha_02',
        organizationId: 'org_kili_01',
        name: 'Arusha - Clock Tower Plaza',
        code: 'ARU-CTP',
        city: 'Arusha',
        address: 'Boma Rd, Clock Tower',
        routerCount: 1,
        activeUsersCount: 68,
        createdAt: '2026-01-20T10:30:00Z',
      },
      {
        id: 'site_mwanza_03',
        organizationId: 'org_kili_01',
        name: 'Mwanza - Rock City Mall',
        code: 'MWZ-RCM',
        city: 'Mwanza',
        address: 'Airport Rd, Ilemela',
        routerCount: 1,
        activeUsersCount: 54,
        createdAt: '2026-02-05T14:00:00Z',
      },
    ];

    // 4. Routers (MikroTik and Omada)
    this.routers = [
      {
        id: 'rtr_dar_core',
        organizationId: 'org_kili_01',
        siteId: 'site_dar_01',
        siteName: 'Dar es Salaam - Kariakoo Commercial Hub',
        name: 'Core Gateway - Kariakoo',
        vendor: 'MIKROTIK',
        model: 'CCR2004-16G-2S+',
        serialNumber: 'HE708W7D891',
        ipAddress: '196.192.88.2',
        managementPort: 8728,
        username: 'xcloud_api',
        routerId: 'XC-DAR-001',
        installationStatus: 'INSTALLED',
        status: 'ONLINE',
        cpuUsage: 18,
        memoryUsage: 32,
        uptimeSeconds: 1245000,
        activeUsers: 84,
        wireguardIp: '10.88.0.2/16',
        wireguardPublicKey: 'wG+KariakooCorePublicServerKey789123456789=',
        version: 'RouterOS v7.15.2',
        lastSeen: new Date().toISOString(),
        createdAt: '2026-01-12T10:00:00Z',
        updatedAt: new Date().toISOString(),
        interfaces: [
          { name: 'ether1-WAN-Fiber', type: 'ethernet', macAddress: 'DC:2C:6E:11:A4:01', ipAddress: '196.192.88.2/29', rxBytes: 9482103940, txBytes: 38472910480, rxRate: 42100000, txRate: 85200000, linkUp: true },
          { name: 'bridge-Hotspot', type: 'bridge', macAddress: 'DC:2C:6E:11:A4:02', ipAddress: '10.5.50.1/24', rxBytes: 38472910480, txBytes: 9482103940, rxRate: 85200000, txRate: 42100000, linkUp: true },
          { name: 'wg-xcloud', type: 'wireguard', macAddress: '00:00:00:00:00:00', ipAddress: '10.88.0.2/16', rxBytes: 8504000, txBytes: 12400000, rxRate: 128000, txRate: 245000, linkUp: true },
        ],
      },
      {
        id: 'rtr_arusha_node',
        organizationId: 'org_kili_01',
        siteId: 'site_arusha_02',
        siteName: 'Arusha - Clock Tower Plaza',
        name: 'Arusha Hub Router',
        vendor: 'MIKROTIK',
        model: 'RB4011iGS+RM',
        serialNumber: 'RB4011-ARU-992',
        ipAddress: '41.222.180.14',
        managementPort: 8728,
        username: 'xcloud_api',
        routerId: 'XC-ARU-002',
        installationStatus: 'INSTALLED',
        status: 'ONLINE',
        cpuUsage: 24,
        memoryUsage: 41,
        uptimeSeconds: 689000,
        activeUsers: 48,
        wireguardIp: '10.88.0.3/16',
        wireguardPublicKey: 'wG+ArushaClockTowerPubPeerKey1234567890=',
        version: 'RouterOS v7.14.3',
        lastSeen: new Date().toISOString(),
        createdAt: '2026-01-20T11:00:00Z',
        updatedAt: new Date().toISOString(),
        interfaces: [
          { name: 'ether1-Uplink', type: 'ethernet', macAddress: '48:8F:5A:22:B8:10', ipAddress: '41.222.180.14/30', rxBytes: 4200192000, txBytes: 18492019000, rxRate: 18500000, txRate: 42100000, linkUp: true },
          { name: 'bridge-Hotspot', type: 'bridge', macAddress: '48:8F:5A:22:B8:11', ipAddress: '10.10.10.1/24', rxBytes: 18492019000, txBytes: 4200192000, rxRate: 42100000, txRate: 18500000, linkUp: true },
        ],
      },
      {
        id: 'rtr_mwanza_omada',
        organizationId: 'org_kili_01',
        siteId: 'site_mwanza_03',
        siteName: 'Mwanza - Rock City Mall',
        name: 'Omada Gateway - Rock City',
        vendor: 'OMADA',
        model: 'ER7206 Omada Multi-WAN VPN',
        serialNumber: 'OMADA-ER7206-MWZ-881',
        ipAddress: '102.68.10.50',
        managementPort: 8043,
        username: 'omada_admin',
        routerId: 'XC-MWZ-003',
        installationStatus: 'INSTALLED',
        status: 'ONLINE',
        cpuUsage: 14,
        memoryUsage: 35,
        uptimeSeconds: 432000,
        activeUsers: 54,
        wireguardIp: '10.88.0.5/16',
        wireguardPublicKey: 'wG+OmadaMwanzaMallPubKey987654321012345=',
        version: 'Omada SDN v5.14.26',
        lastSeen: new Date().toISOString(),
        createdAt: '2026-02-05T15:00:00Z',
        updatedAt: new Date().toISOString(),
        interfaces: [
          { name: 'WAN1-Fiber', type: 'ethernet', macAddress: 'B0:95:75:33:C1:A0', ipAddress: '102.68.10.50/29', rxBytes: 6109200000, txBytes: 25192000000, rxRate: 22000000, txRate: 54000000, linkUp: true },
          { name: 'LAN-Omada-Trunk', type: 'ethernet', macAddress: 'B0:95:75:33:C1:A1', ipAddress: '192.168.100.1/24', rxBytes: 25192000000, txBytes: 6109200000, rxRate: 54000000, txRate: 22000000, linkUp: true },
        ],
      },
    ];

    // 5. Packages (Tanzanian Shillings pricing & realistic speeds)
    this.packages = [
      {
        id: 'pkg_1h_500',
        organizationId: 'org_kili_01',
        name: '1 Hour FastPass',
        description: 'Instant ultra-fast WiFi for 60 minutes. Best for quick browsing and social media.',
        price: 500, // TZS
        durationMinutes: 60,
        downloadSpeedKbps: 5120, // 5 Mbps
        uploadSpeedKbps: 2048,   // 2 Mbps
        dataLimitMb: 0, // unlimited
        validityHours: 24,
        deviceLimit: 1,
        serviceType: 'HOTSPOT',
        active: true,
        createdAt: '2026-01-12T00:00:00Z',
      },
      {
        id: 'pkg_3h_1000',
        organizationId: 'org_kili_01',
        name: '3 Hours Express',
        description: '3 hours continuous high-speed streaming & downloads.',
        price: 1000, // TZS
        durationMinutes: 180,
        downloadSpeedKbps: 7168, // 7 Mbps
        uploadSpeedKbps: 3072,   // 3 Mbps
        dataLimitMb: 0,
        validityHours: 24,
        deviceLimit: 1,
        serviceType: 'HOTSPOT',
        active: true,
        createdAt: '2026-01-12T00:00:00Z',
      },
      {
        id: 'pkg_12h_2500',
        organizationId: 'org_kili_01',
        name: '12 Hours DayPass',
        description: 'Full day internet access at 10 Mbps for work, study, and gaming.',
        price: 2500, // TZS
        durationMinutes: 720,
        downloadSpeedKbps: 10240, // 10 Mbps
        uploadSpeedKbps: 5120,    // 5 Mbps
        dataLimitMb: 0,
        validityHours: 48,
        deviceLimit: 2,
        serviceType: 'HOTSPOT',
        active: true,
        createdAt: '2026-01-12T00:00:00Z',
      },
      {
        id: 'pkg_24h_3500',
        organizationId: 'org_kili_01',
        name: '24 Hours Unlimited',
        description: 'Non-stop 24 hours high-speed internet up to 15 Mbps.',
        price: 3500, // TZS
        durationMinutes: 1440,
        downloadSpeedKbps: 15360, // 15 Mbps
        uploadSpeedKbps: 7168,    // 7 Mbps
        dataLimitMb: 0,
        validityHours: 72,
        deviceLimit: 2,
        serviceType: 'HOTSPOT',
        active: true,
        createdAt: '2026-01-12T00:00:00Z',
      },
      {
        id: 'pkg_7d_15000',
        organizationId: 'org_kili_01',
        name: '7 Days Weekly Ultra',
        description: '7-day unlimited high priority WiFi for power users and small offices.',
        price: 15000, // TZS
        durationMinutes: 10080,
        downloadSpeedKbps: 20480, // 20 Mbps
        uploadSpeedKbps: 10240,   // 10 Mbps
        dataLimitMb: 0,
        validityHours: 168,
        deviceLimit: 3,
        serviceType: 'HOTSPOT',
        active: true,
        createdAt: '2026-01-12T00:00:00Z',
      },
      {
        id: 'pkg_30d_45000',
        organizationId: 'org_kili_01',
        name: '30 Days Home Fiber / PPPoE',
        description: 'Monthly dedicated fiber connection for residences and offices.',
        price: 45000, // TZS
        durationMinutes: 43200,
        downloadSpeedKbps: 30720, // 30 Mbps
        uploadSpeedKbps: 15360,   // 15 Mbps
        dataLimitMb: 0,
        validityHours: 720,
        deviceLimit: 5,
        serviceType: 'PPPOE',
        active: true,
        createdAt: '2026-01-12T00:00:00Z',
      },
    ];

    // 6. Vouchers
    this.vouchers = [
      {
        id: 'vch_001',
        organizationId: 'org_kili_01',
        siteId: 'site_dar_01',
        packageId: 'pkg_3h_1000',
        packageName: '3 Hours Express',
        code: 'TZ-7492-9102',
        pin: '4920',
        price: 1000,
        durationMinutes: 180,
        downloadSpeedKbps: 7168,
        uploadSpeedKbps: 3072,
        dataLimitMb: 0,
        status: 'ACTIVE',
        expiresAt: '2026-10-30T23:59:59Z',
        createdAt: '2026-10-01T08:00:00Z',
      },
      {
        id: 'vch_002',
        organizationId: 'org_kili_01',
        siteId: 'site_dar_01',
        packageId: 'pkg_24h_3500',
        packageName: '24 Hours Unlimited',
        code: 'TZ-8841-3310',
        pin: '3310',
        price: 3500,
        durationMinutes: 1440,
        downloadSpeedKbps: 15360,
        uploadSpeedKbps: 7168,
        dataLimitMb: 0,
        status: 'ACTIVE',
        expiresAt: '2026-10-31T23:59:59Z',
        createdAt: '2026-10-01T09:15:00Z',
      },
      {
        id: 'vch_003',
        organizationId: 'org_kili_01',
        siteId: 'site_arusha_02',
        packageId: 'pkg_1h_500',
        packageName: '1 Hour FastPass',
        code: 'TZ-1049-5561',
        pin: '5561',
        price: 500,
        durationMinutes: 60,
        downloadSpeedKbps: 5120,
        uploadSpeedKbps: 2048,
        dataLimitMb: 0,
        status: 'USED',
        usedByMac: 'A4:C3:F0:12:34:56',
        usedByPhone: '+255 754 881 992',
        usedAt: '2026-10-01T11:20:00Z',
        expiresAt: '2026-10-01T12:20:00Z',
        createdAt: '2026-10-01T10:00:00Z',
      },
      {
        id: 'vch_004',
        organizationId: 'org_kili_01',
        siteId: 'site_mwanza_03',
        packageId: 'pkg_7d_15000',
        packageName: '7 Days Weekly Ultra',
        code: 'TZ-6629-1094',
        pin: '1094',
        price: 15000,
        durationMinutes: 10080,
        downloadSpeedKbps: 20480,
        uploadSpeedKbps: 10240,
        dataLimitMb: 0,
        status: 'ACTIVE',
        expiresAt: '2026-11-05T23:59:59Z',
        createdAt: '2026-10-01T10:30:00Z',
      },
    ];

    // 7. Customers (PPPoE & Hotspot accounts)
    this.customers = [
      {
        id: 'cust_001',
        organizationId: 'org_kili_01',
        siteId: 'site_dar_01',
        siteName: 'Dar es Salaam - Kariakoo Commercial Hub',
        name: 'Rashid Khalfan',
        phone: '+255 754 991 223',
        email: 'rkhalfan@gmail.com',
        username: 'rashid.khalfan',
        serviceType: 'PPPOE',
        packageId: 'pkg_30d_45000',
        packageName: '30 Days Home Fiber / PPPoE',
        ipAddress: '10.5.50.45',
        macAddress: 'DC:2C:6E:99:11:A4',
        status: 'ACTIVE',
        balance: 45000,
        autoRenew: true,
        createdAt: '2026-02-14T09:00:00Z',
      },
      {
        id: 'cust_002',
        organizationId: 'org_kili_01',
        siteId: 'site_arusha_02',
        siteName: 'Arusha - Clock Tower Plaza',
        name: 'Amina Mwangi',
        phone: '+255 784 330 119',
        email: 'amina.mwangi@techsafari.co.tz',
        username: 'amina.mwangi',
        serviceType: 'PPPOE',
        packageId: 'pkg_30d_45000',
        packageName: '30 Days Home Fiber / PPPoE',
        ipAddress: '10.10.10.82',
        macAddress: '3C:52:82:11:BB:02',
        status: 'ACTIVE',
        balance: 45000,
        autoRenew: true,
        createdAt: '2026-02-20T11:00:00Z',
      },
      {
        id: 'cust_003',
        organizationId: 'org_kili_01',
        siteId: 'site_dar_01',
        siteName: 'Dar es Salaam - Kariakoo Commercial Hub',
        name: 'Kelvin Shayo',
        phone: '+255 713 884 102',
        email: 'kelvin.shayo@yahoo.com',
        username: 'kelvin.shayo',
        serviceType: 'HOTSPOT',
        packageId: 'pkg_24h_3500',
        packageName: '24 Hours Unlimited',
        ipAddress: '10.5.50.198',
        macAddress: '84:B8:02:DF:3E:99',
        status: 'ACTIVE',
        balance: 0,
        autoRenew: false,
        createdAt: '2026-03-01T14:30:00Z',
      },
    ];

    // 8. Active RADIUS Sessions
    this.sessions = [
      {
        id: 'sess_001',
        organizationId: 'org_kili_01',
        routerId: 'rtr_dar_core',
        routerName: 'Core Gateway - Kariakoo',
        username: 'TZ-1049-5561',
        framedIpAddress: '10.5.50.114',
        callingStationId: 'A4:C3:F0:12:34:56',
        nasIpAddress: '196.192.88.2',
        serviceType: 'HOTSPOT',
        startTime: '2026-10-01T11:20:00Z',
        lastUpdateTime: new Date().toISOString(),
        sessionTimeout: 3600,
        inputOctets: 489201900,  // 489 MB download
        outputOctets: 58291000,  // 58 MB upload
        acctSessionId: '820491-dar-01',
        status: 'ACTIVE',
      },
      {
        id: 'sess_002',
        organizationId: 'org_kili_01',
        routerId: 'rtr_dar_core',
        routerName: 'Core Gateway - Kariakoo',
        username: 'rashid.khalfan',
        framedIpAddress: '10.5.50.45',
        callingStationId: 'DC:2C:6E:99:11:A4',
        nasIpAddress: '196.192.88.2',
        serviceType: 'PPPOE',
        startTime: '2026-10-01T06:00:00Z',
        lastUpdateTime: new Date().toISOString(),
        sessionTimeout: 86400,
        inputOctets: 4290192000, // 4.29 GB
        outputOctets: 890192000, // 890 MB
        acctSessionId: 'ppp-89102-dar',
        status: 'ACTIVE',
      },
      {
        id: 'sess_003',
        organizationId: 'org_kili_01',
        routerId: 'rtr_arusha_node',
        routerName: 'Arusha Hub Router',
        username: 'amina.mwangi',
        framedIpAddress: '10.10.10.82',
        callingStationId: '3C:52:82:11:BB:02',
        nasIpAddress: '41.222.180.14',
        serviceType: 'PPPOE',
        startTime: '2026-10-01T07:15:00Z',
        lastUpdateTime: new Date().toISOString(),
        sessionTimeout: 86400,
        inputOctets: 1849201000,
        outputOctets: 320910000,
        acctSessionId: 'ppp-44109-aru',
        status: 'ACTIVE',
      },
    ];

    // 9. Payment Transactions (Tanzania Mobile Money)
    this.payments = [
      {
        id: 'tx_mpesa_001',
        organizationId: 'org_kili_01',
        siteId: 'site_dar_01',
        packageName: '24 Hours Unlimited',
        gateway: 'MPESA',
        gatewayReference: 'ws_CO_01102026091428391',
        transactionReference: 'XC-MPESA-99214',
        phone: '255754881992',
        amount: 3500,
        currency: 'TZS',
        status: 'SUCCESS',
        idempotencyKey: 'idem_mpesa_99214',
        createdAt: '2026-10-01T09:14:00Z',
        updatedAt: '2026-10-01T09:14:28Z',
      },
      {
        id: 'tx_airtel_002',
        organizationId: 'org_kili_01',
        siteId: 'site_arusha_02',
        packageName: '3 Hours Express',
        gateway: 'AIRTEL',
        gatewayReference: 'AIRTEL_TZ_481920',
        transactionReference: 'XC-AIRTEL-48192',
        phone: '255784330119',
        amount: 1000,
        currency: 'TZS',
        status: 'SUCCESS',
        idempotencyKey: 'idem_airtel_48192',
        createdAt: '2026-10-01T10:02:00Z',
        updatedAt: '2026-10-01T10:02:18Z',
      },
      {
        id: 'tx_tigo_003',
        organizationId: 'org_kili_01',
        siteId: 'site_mwanza_03',
        packageName: '7 Days Weekly Ultra',
        gateway: 'TIGO',
        gatewayReference: 'TIGO_TXN_774910',
        transactionReference: 'XC-TIGO-77491',
        phone: '255713445566',
        amount: 15000,
        currency: 'TZS',
        status: 'SUCCESS',
        idempotencyKey: 'idem_tigo_77491',
        createdAt: '2026-10-01T10:45:00Z',
        updatedAt: '2026-10-01T10:45:30Z',
      },
      {
        id: 'tx_selcom_004',
        organizationId: 'org_kili_01',
        siteId: 'site_dar_01',
        customerName: 'Rashid Khalfan',
        packageName: '30 Days Home Fiber / PPPoE',
        gateway: 'SELCOM',
        gatewayReference: 'SELCOM_ORD_10492',
        transactionReference: 'XC-SELCOM-10492',
        phone: '255754991223',
        amount: 45000,
        currency: 'TZS',
        status: 'SUCCESS',
        idempotencyKey: 'idem_selcom_10492',
        createdAt: '2026-10-01T11:00:00Z',
        updatedAt: '2026-10-01T11:01:10Z',
      },
    ];

    // 10. Agents / POS Terminals
    this.agents = [
      {
        id: 'agent_krk_01',
        organizationId: 'org_kili_01',
        siteId: 'site_dar_01',
        name: 'Kariakoo Market Duka POS',
        phone: '+255 713 445 566',
        email: 'pos.kariakoo@xcloud.tz',
        floatBalance: 185000, // TZS
        commissionRate: 10,   // 10%
        totalSales: 890000,
        totalCommissionEarned: 89000,
        active: true,
        createdAt: '2026-02-10T00:00:00Z',
      },
      {
        id: 'agent_aru_02',
        organizationId: 'org_kili_01',
        siteId: 'site_arusha_02',
        name: 'Arusha Safari Internet Cafe POS',
        phone: '+255 784 990 011',
        email: 'pos.arusha@xcloud.tz',
        floatBalance: 94000,
        commissionRate: 10,
        totalSales: 420000,
        totalCommissionEarned: 42000,
        active: true,
        createdAt: '2026-02-15T00:00:00Z',
      },
    ];

    // 11. Omada APs and Clients
    this.omadaAps = [
      {
        id: 'ap_mwanza_01',
        mac: '50:D4:F7:11:22:33',
        name: 'AP-Mall-FoodCourt-EAP650',
        model: 'EAP650 AX3000 Ceiling Mount',
        ip: '192.168.100.12',
        status: 'CONNECTED',
        clientsCount: 32,
        channel2g: 1,
        channel5g: 36,
        txRate: 45000000,
        rxRate: 28000000,
        cpu: 18,
        memory: 42,
      },
      {
        id: 'ap_mwanza_02',
        mac: '50:D4:F7:44:55:66',
        name: 'AP-Mall-Cinema-EAP610',
        model: 'EAP610 AX1800 Ceiling Mount',
        ip: '192.168.100.14',
        status: 'CONNECTED',
        clientsCount: 22,
        channel2g: 6,
        channel5g: 48,
        txRate: 31000000,
        rxRate: 19000000,
        cpu: 14,
        memory: 38,
      },
    ];

    this.omadaClients = [
      {
        mac: 'F4:F5:DB:12:88:99',
        ip: '192.168.100.104',
        name: 'Samsung Galaxy S24 Ultra',
        ssid: 'XCLOUD-RockCity-WiFi',
        apMac: '50:D4:F7:11:22:33',
        apName: 'AP-Mall-FoodCourt-EAP650',
        signalStrength: -58,
        trafficDown: 849201900,
        trafficUp: 49201000,
        connectedTime: '2026-10-01T10:14:00Z',
      },
      {
        mac: '3C:22:FB:44:11:22',
        ip: '192.168.100.112',
        name: 'Apple MacBook Pro M3',
        ssid: 'XCLOUD-RockCity-WiFi',
        apMac: '50:D4:F7:11:22:33',
        apName: 'AP-Mall-FoodCourt-EAP650',
        signalStrength: -52,
        trafficDown: 2490192000,
        trafficUp: 349102000,
        connectedTime: '2026-10-01T09:30:00Z',
      },
    ];

    // 12. Audit Logs
    this.auditLogs = [
      {
        id: 'log_001',
        organizationId: 'org_kili_01',
        userId: 'usr_admin_01',
        userName: 'Mussa Matembo',
        action: 'ROUTER_PROVISIONED',
        targetType: 'ROUTER',
        targetId: 'rtr_dar_core',
        details: 'MikroTik CCR2004 configured with WireGuard tunnel 10.88.0.2/16',
        ipAddress: '196.192.88.2',
        createdAt: '2026-10-01T08:30:00Z',
      },
      {
        id: 'log_002',
        organizationId: 'org_kili_01',
        userId: 'usr_admin_01',
        userName: 'Mussa Matembo',
        action: 'VOUCHERS_GENERATED',
        targetType: 'VOUCHER',
        targetId: 'batch_20261001_01',
        details: 'Generated 50 vouchers for package 24 Hours Unlimited',
        ipAddress: '196.192.88.2',
        createdAt: '2026-10-01T09:15:00Z',
      },
    ];
  }
}

export const db = new DatabaseStore();
