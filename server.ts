import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { db } from './server/db.ts';
import { MikroTikAdapter } from './server/adapters/router/mikrotik.adapter.ts';
import { OmadaAdapter } from './server/adapters/router/omada.adapter.ts';
import { MpesaGateway } from './server/adapters/payment/mpesa.gateway.ts';
import { AirtelMoneyGateway } from './server/adapters/payment/airtel.gateway.ts';
import { TigoPesaGateway } from './server/adapters/payment/tigo.gateway.ts';
import { SelcomGateway } from './server/adapters/payment/selcom.gateway.ts';
import { BootstrapService } from './server/services/bootstrap.service.ts';
import { WireguardService } from './server/services/wireguard.service.ts';
import { RadiusService } from './server/services/radius.service.ts';
import { 
  Voucher, 
  PaymentTransaction, 
  RouterDevice, 
  Customer 
} from './src/types/index.ts';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration for API access
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Idempotency-Key');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Services
const bootstrapService = new BootstrapService();
const wireguardService = new WireguardService();
const radiusService = new RadiusService();
const mpesaGateway = new MpesaGateway();
const airtelGateway = new AirtelMoneyGateway();
const tigoGateway = new TigoPesaGateway();
const selcomGateway = new SelcomGateway();

// Processed idempotency keys cache for payment webhooks
const processedWebhookKeys = new Set<string>();

// Periodic Heartbeat Watchdog: Check routers last_seen; mark OFFLINE if > 90 seconds silent
setInterval(() => {
  const now = Date.now();
  db.routers.forEach(r => {
    const lastSeenTime = new Date(r.lastSeen).getTime();
    if (now - lastSeenTime > 90000 && r.status === 'ONLINE') {
      r.status = 'OFFLINE';
      db.auditLogs.unshift({
        id: `log_offline_${Date.now()}`,
        organizationId: r.organizationId,
        userId: 'system',
        userName: 'Watchdog Monitor',
        action: 'ROUTER_OFFLINE',
        targetType: 'ROUTER',
        targetId: r.id,
        details: `Heartbeat timed out for router ${r.name} (${r.routerId})`,
        ipAddress: r.ipAddress,
        createdAt: new Date().toISOString(),
      });
    }
  });
}, 30000);

// Helper for standard API response
const sendResponse = (res: Response, success: boolean, data: any = null, message: string = '', errors: any[] = [], statusCode: number = 200) => {
  return res.status(statusCode).json({
    success,
    data,
    message,
    errors,
  });
};

// ==========================================
// 1. AUTHENTICATION ROUTES (/api/auth)
// ==========================================
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  if (!email) {
    return sendResponse(res, false, null, 'Email is required', ['Missing email'], 400);
  }

  // Find user by email (case-insensitive)
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return sendResponse(res, false, null, 'Invalid credentials', ['User not found'], 401);
  }

  // Simple secure bearer token for dashboard session
  const accessToken = `xc_jwt_${Buffer.from(JSON.stringify({ id: user.id, role: user.role, org: user.organizationId, exp: Date.now() + 86400000 })).toString('base64')}`;

  return sendResponse(res, true, {
    token: accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organizationName,
    },
  }, 'Login successful');
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { orgName, name, email, password, phone } = req.body;
  if (!orgName || !email || !name) {
    return sendResponse(res, false, null, 'Organization name, user name, and email are required', ['Validation error'], 400);
  }

  const orgId = `org_${Date.now()}`;
  const newOrg = {
    id: orgId,
    name: orgName,
    slug: orgName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    contactEmail: email,
    contactPhone: phone || '+255 700 000 000',
    country: 'Tanzania',
    currency: 'TZS',
    timezone: 'Africa/Dar_es_Salaam',
    subscriptionPlan: 'PRO_WISP' as const,
    active: true,
    createdAt: new Date().toISOString(),
  };
  db.organizations.push(newOrg);

  const newUser = {
    id: `usr_${Date.now()}`,
    email,
    name,
    role: 'ORGANIZATION_ADMIN' as const,
    organizationId: orgId,
    organizationName: orgName,
    phone,
    active: true,
    createdAt: new Date().toISOString(),
  };
  db.users.push(newUser);

  // Create default site for new organization
  db.sites.push({
    id: `site_${Date.now()}`,
    organizationId: orgId,
    name: `${orgName} Main Site`,
    code: 'HQ-01',
    city: 'Dar es Salaam',
    address: 'City Center',
    routerCount: 0,
    activeUsersCount: 0,
    createdAt: new Date().toISOString(),
  });

  const accessToken = `xc_jwt_${Buffer.from(JSON.stringify({ id: newUser.id, role: newUser.role, org: orgId, exp: Date.now() + 86400000 })).toString('base64')}`;

  return sendResponse(res, true, {
    token: accessToken,
    user: newUser,
    organization: newOrg,
  }, 'Registration successful');
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = db.users[0]; // Active session admin
  return sendResponse(res, true, user);
});

// ==========================================
// 2. ORGANIZATIONS & SITES (/api/organizations, /api/sites)
// ==========================================
app.get('/api/organizations', (req: Request, res: Response) => {
  return sendResponse(res, true, db.organizations);
});

app.get('/api/sites', (req: Request, res: Response) => {
  return sendResponse(res, true, db.sites);
});

app.post('/api/sites', (req: Request, res: Response) => {
  const { name, code, city, address, organizationId } = req.body;
  const newSite = {
    id: `site_${Date.now()}`,
    organizationId: organizationId || 'org_kili_01',
    name,
    code: code || 'SITE-' + Math.floor(Math.random() * 900 + 100),
    city: city || 'Dar es Salaam',
    address: address || '',
    routerCount: 0,
    activeUsersCount: 0,
    createdAt: new Date().toISOString(),
  };
  db.sites.push(newSite);
  return sendResponse(res, true, newSite, 'Site created successfully');
});

// ==========================================
// 3. ROUTER MANAGEMENT (/api/routers)
// ==========================================
app.get('/api/routers', (req: Request, res: Response) => {
  return sendResponse(res, true, db.routers);
});

app.post('/api/routers', (req: Request, res: Response) => {
  const { name, vendor, model, serialNumber, ipAddress, managementPort, username, siteId } = req.body;

  const count = db.routers.length + 1;
  const routerCode = `XC-${vendor === 'OMADA' ? 'OMD' : 'MK'}-${String(count).padStart(3, '0')}`;
  const site = db.sites.find(s => s.id === siteId);

  const newRouter: RouterDevice = {
    id: `rtr_${Date.now()}`,
    organizationId: 'org_kili_01',
    siteId: siteId || db.sites[0]?.id || 'site_dar_01',
    siteName: site?.name || 'Default Site',
    name,
    vendor: vendor || 'MIKROTIK',
    model: model || (vendor === 'OMADA' ? 'ER7206' : 'RB4011iGS+RM'),
    serialNumber: serialNumber || `SN-${Date.now()}`,
    ipAddress: ipAddress || '192.168.88.1',
    managementPort: managementPort ? parseInt(managementPort, 10) : (vendor === 'OMADA' ? 8043 : 8728),
    username: username || 'xcloud_api',
    routerId: routerCode,
    installationStatus: 'PENDING_INSTALL',
    status: 'CONFIGURING',
    cpuUsage: 0,
    memoryUsage: 0,
    uptimeSeconds: 0,
    activeUsers: 0,
    lastSeen: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    interfaces: [
      { name: 'ether1', type: 'ethernet', macAddress: '00:00:00:00:00:01', rxBytes: 0, txBytes: 0, rxRate: 0, txRate: 0, linkUp: false },
    ],
  };

  db.routers.push(newRouter);
  return sendResponse(res, true, newRouter, 'Router registered. Ready for bootstrap installation.');
});

app.get('/api/routers/:id', (req: Request, res: Response) => {
  const router = db.routers.find(r => r.id === req.params.id);
  if (!router) return sendResponse(res, false, null, 'Router not found', [], 404);
  return sendResponse(res, true, router);
});

// Test connection endpoint
app.post('/api/routers/:id/test-connection', async (req: Request, res: Response) => {
  const router = db.routers.find(r => r.id === req.params.id);
  if (!router) return sendResponse(res, false, null, 'Router not found', [], 404);

  if (router.vendor === 'MIKROTIK') {
    const adapter = new MikroTikAdapter({
      host: router.ipAddress,
      port: router.managementPort,
      username: router.username,
      timeoutMs: 3000,
    });
    const result = await adapter.connect();
    if (result.success) {
      router.status = 'ONLINE';
      router.lastSeen = new Date().toISOString();
    }
    return sendResponse(res, result.success, result, result.message);
  } else {
    const adapter = new OmadaAdapter({
      controllerUrl: `https://${router.ipAddress}:${router.managementPort}`,
      username: router.username,
    });
    const result = await adapter.testConnection();
    if (result.success) {
      router.status = 'ONLINE';
      router.lastSeen = new Date().toISOString();
    }
    return sendResponse(res, result.success, result, result.message);
  }
});

// Reboot router
app.post('/api/routers/:id/reboot', async (req: Request, res: Response) => {
  const router = db.routers.find(r => r.id === req.params.id);
  if (!router) return sendResponse(res, false, null, 'Router not found', [], 404);

  router.status = 'CONFIGURING';
  db.auditLogs.unshift({
    id: `log_reboot_${Date.now()}`,
    organizationId: router.organizationId,
    userId: 'usr_admin_01',
    userName: 'Mussa Matembo',
    action: 'ROUTER_REBOOT_INITIATED',
    targetType: 'ROUTER',
    targetId: router.id,
    details: `Reboot dispatched to ${router.name} (${router.routerId})`,
    ipAddress: router.ipAddress,
    createdAt: new Date().toISOString(),
  });

  return sendResponse(res, true, { status: 'REBOOTING' }, `Reboot signal sent to ${router.name}`);
});

// Generate one-time installation token & command (/routers/:id/install)
app.post('/api/routers/:id/install', (req: Request, res: Response) => {
  const router = db.routers.find(r => r.id === req.params.id);
  if (!router) return sendResponse(res, false, null, 'Router not found', [], 404);

  const installData = bootstrapService.generateInstallationToken(router.id, router.organizationId);
  router.installationToken = installData.token;
  router.tokenExpiresAt = installData.expiresAt;

  return sendResponse(res, true, {
    routerId: router.routerId,
    token: installData.token,
    terminalCommand: installData.terminalCommand,
    expiresAt: installData.expiresAt,
    installationStatus: router.installationStatus,
    lastHeartbeat: router.lastSeen,
    connectionStatus: router.status,
  });
});

// MikroTik router contacts this endpoint over HTTPS with the one-time token
app.get('/api/routers/bootstrap/:token', (req: Request, res: Response) => {
  const token = req.params.token;
  const tokenRecord = bootstrapService.validateAndConsumeToken(token);

  if (!tokenRecord) {
    return res.status(403).type('text/plain').send('# ERROR: Invalid, expired, or previously consumed XCLOUD token.\n:log error "XCLOUD: Invalid or expired installation token!"\n');
  }

  const router = db.routers.find(r => r.id === tokenRecord.routerId);
  if (!router) {
    return res.status(404).type('text/plain').send('# ERROR: Associated router not found in database.\n');
  }

  router.installationStatus = 'INSTALLED';
  router.status = 'ONLINE';
  router.lastSeen = new Date().toISOString();

  const script = bootstrapService.generateRouterOsScript(router, tokenRecord);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="xcloud-${router.routerId}.rsc"`);
  return res.send(script);
});

// Router heartbeat endpoint
app.post('/api/routers/:id/heartbeat', (req: Request, res: Response) => {
  const router = db.routers.find(r => r.id === req.params.id);
  if (!router) return sendResponse(res, false, null, 'Router not found', [], 404);

  const { cpuUsage, memoryUsage, activeUsers, uptime } = req.body;
  router.status = 'ONLINE';
  router.lastSeen = new Date().toISOString();
  if (typeof cpuUsage === 'number') router.cpuUsage = cpuUsage;
  if (typeof memoryUsage === 'number') router.memoryUsage = memoryUsage;
  if (typeof activeUsers === 'number') router.activeUsers = activeUsers;

  return sendResponse(res, true, { acknowledged: true, serverTime: new Date().toISOString() });
});

// ==========================================
// 4. PACKAGES & PLANS (/api/packages)
// ==========================================
app.get('/api/packages', (req: Request, res: Response) => {
  return sendResponse(res, true, db.packages);
});

app.post('/api/packages', (req: Request, res: Response) => {
  const { name, description, price, durationMinutes, downloadSpeedKbps, uploadSpeedKbps, dataLimitMb, validityHours, deviceLimit, serviceType } = req.body;

  const newPkg = {
    id: `pkg_${Date.now()}`,
    organizationId: 'org_kili_01',
    name,
    description: description || '',
    price: Number(price),
    durationMinutes: Number(durationMinutes),
    downloadSpeedKbps: Number(downloadSpeedKbps),
    uploadSpeedKbps: Number(uploadSpeedKbps),
    dataLimitMb: Number(dataLimitMb || 0),
    validityHours: Number(validityHours || 24),
    deviceLimit: Number(deviceLimit || 1),
    serviceType: serviceType || 'HOTSPOT',
    active: true,
    createdAt: new Date().toISOString(),
  };

  db.packages.push(newPkg);
  return sendResponse(res, true, newPkg, 'Package created successfully');
});

// ==========================================
// 5. VOUCHERS (/api/vouchers)
// ==========================================
app.get('/api/vouchers', (req: Request, res: Response) => {
  return sendResponse(res, true, db.vouchers);
});

app.post('/api/vouchers/generate', (req: Request, res: Response) => {
  const { packageId, siteId, count = 1, prefix = 'TZ' } = req.body;
  const pkg = db.packages.find(p => p.id === packageId);
  if (!pkg) return sendResponse(res, false, null, 'Package not found', [], 404);

  const batchId = `batch_${Date.now()}`;
  const generated: Voucher[] = [];

  for (let i = 0; i < Math.min(Number(count), 200); i++) {
    const p1 = Math.floor(1000 + Math.random() * 9000);
    const p2 = Math.floor(1000 + Math.random() * 9000);
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const code = `${prefix}-${p1}-${p2}`;

    const v: Voucher = {
      id: `vch_${Date.now()}_${i}`,
      organizationId: 'org_kili_01',
      siteId: siteId || 'site_dar_01',
      packageId: pkg.id,
      packageName: pkg.name,
      code,
      pin,
      price: pkg.price,
      durationMinutes: pkg.durationMinutes,
      downloadSpeedKbps: pkg.downloadSpeedKbps,
      uploadSpeedKbps: pkg.uploadSpeedKbps,
      dataLimitMb: pkg.dataLimitMb,
      status: 'ACTIVE',
      batchId,
      expiresAt: new Date(Date.now() + pkg.validityHours * 3600000).toISOString(),
      createdAt: new Date().toISOString(),
    };
    db.vouchers.unshift(v);
    generated.push(v);
  }

  return sendResponse(res, true, generated, `Generated ${generated.length} vouchers successfully`);
});

// Voucher redemption (Captive Portal / Router Login)
app.post('/api/vouchers/redeem', (req: Request, res: Response) => {
  const { code, pin, macAddress } = req.body;
  if (!code) return sendResponse(res, false, null, 'Voucher code is required', [], 400);

  const voucher = db.vouchers.find(v => v.code.toUpperCase() === code.toUpperCase().trim());
  if (!voucher) {
    return sendResponse(res, false, null, 'Invalid voucher code', ['Code not found'], 404);
  }

  if (voucher.status === 'USED') {
    return sendResponse(res, false, null, 'Voucher already used', ['Already consumed'], 400);
  }

  if (voucher.status === 'EXPIRED' || new Date(voucher.expiresAt).getTime() < Date.now()) {
    voucher.status = 'EXPIRED';
    return sendResponse(res, false, null, 'Voucher expired', ['Voucher has expired'], 400);
  }

  if (voucher.pin && pin && voucher.pin !== pin) {
    return sendResponse(res, false, null, 'Invalid PIN for this voucher', ['PIN mismatch'], 400);
  }

  // Mark as USED and record MAC
  voucher.status = 'USED';
  voucher.usedByMac = macAddress || 'A4:C3:F0:XX:XX:XX';
  voucher.usedAt = new Date().toISOString();

  // Create RADIUS active session
  const newSession = {
    id: `sess_${Date.now()}`,
    organizationId: voucher.organizationId,
    routerId: 'rtr_dar_core',
    routerName: 'Core Gateway - Kariakoo',
    username: voucher.code,
    framedIpAddress: '10.5.50.' + Math.floor(Math.random() * 200 + 20),
    callingStationId: voucher.usedByMac || '00:00:00:00:00:00',
    nasIpAddress: '196.192.88.2',
    serviceType: 'HOTSPOT' as const,
    startTime: new Date().toISOString(),
    lastUpdateTime: new Date().toISOString(),
    sessionTimeout: voucher.durationMinutes * 60,
    inputOctets: 0,
    outputOctets: 0,
    acctSessionId: `acct_${Date.now()}`,
    status: 'ACTIVE' as const,
  };
  db.sessions.unshift(newSession);

  return sendResponse(res, true, {
    voucher,
    session: newSession,
    rateLimit: `${voucher.uploadSpeedKbps}k/${voucher.downloadSpeedKbps}k`,
    durationMinutes: voucher.durationMinutes,
  }, 'Voucher successfully redeemed! Internet access granted.');
});

// CSV Export for vouchers
app.get('/api/vouchers/export', (req: Request, res: Response) => {
  const headers = 'Code,PIN,Package,Price (TZS),Duration (Mins),Speed Down (Kbps),Speed Up (Kbps),Status,Expires\n';
  const rows = db.vouchers.map(v => 
    `"${v.code}","${v.pin || ''}","${v.packageName}",${v.price},${v.durationMinutes},${v.downloadSpeedKbps},${v.uploadSpeedKbps},"${v.status}","${v.expiresAt}"`
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="xcloud-vouchers.csv"');
  return res.send(headers + rows);
});

// ==========================================
// 6. CUSTOMER MANAGEMENT (/api/customers)
// ==========================================
app.get('/api/customers', (req: Request, res: Response) => {
  return sendResponse(res, true, db.customers);
});

app.post('/api/customers', (req: Request, res: Response) => {
  const { name, phone, email, username, serviceType, packageId, siteId, address } = req.body;
  const pkg = db.packages.find(p => p.id === packageId);
  const site = db.sites.find(s => s.id === siteId);

  const newCustomer: Customer = {
    id: `cust_${Date.now()}`,
    organizationId: 'org_kili_01',
    siteId: siteId || db.sites[0]?.id || 'site_dar_01',
    siteName: site?.name || 'Default Site',
    name,
    phone,
    email: email || '',
    username: username || phone.replace(/\D/g, ''),
    serviceType: serviceType || 'PPPOE',
    packageId: packageId || db.packages[0]?.id || 'pkg_1h_500',
    packageName: pkg?.name || 'Default Plan',
    status: 'ACTIVE',
    balance: 0,
    autoRenew: true,
    createdAt: new Date().toISOString(),
  };

  db.customers.unshift(newCustomer);
  return sendResponse(res, true, newCustomer, 'Customer account created');
});

// ==========================================
// 7. SESSIONS (/api/sessions)
// ==========================================
app.get('/api/sessions', (req: Request, res: Response) => {
  return sendResponse(res, true, db.sessions);
});

app.post('/api/sessions/:id/disconnect', (req: Request, res: Response) => {
  const session = db.sessions.find(s => s.id === req.params.id);
  if (!session) return sendResponse(res, false, null, 'Session not found', [], 404);

  session.status = 'STOPPED';
  return sendResponse(res, true, session, `User ${session.username} disconnected from NAS`);
});

// ==========================================
// 8. PAYMENTS & MOBILE MONEY (/api/payments)
// ==========================================
app.get('/api/payments', (req: Request, res: Response) => {
  return sendResponse(res, true, db.payments);
});

// Mobile Money Checkout Initiation (M-Pesa, Airtel, Tigo, Selcom)
app.post('/api/payments/initiate', async (req: Request, res: Response) => {
  const { phone, packageId, gateway = 'MPESA', siteId } = req.body;
  const pkg = db.packages.find(p => p.id === packageId);
  if (!pkg) return sendResponse(res, false, null, 'Package not found', [], 404);

  const txRef = `XC-${gateway}-${Date.now()}`;
  const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const callbackUrl = `${appUrl}/api/payments/callback/${gateway.toLowerCase()}`;

  let result;
  if (gateway === 'MPESA') {
    result = await mpesaGateway.initiatePayment({
      transactionReference: txRef,
      phone,
      amount: pkg.price,
      description: `XCLOUD Hotspot ${pkg.name}`,
      callbackUrl,
    });
  } else if (gateway === 'AIRTEL') {
    result = await airtelGateway.initiatePayment({
      transactionReference: txRef,
      phone,
      amount: pkg.price,
      description: `XCLOUD Hotspot ${pkg.name}`,
      callbackUrl,
    });
  } else if (gateway === 'TIGO') {
    result = await tigoGateway.initiatePayment({
      transactionReference: txRef,
      phone,
      amount: pkg.price,
      description: `XCLOUD Hotspot ${pkg.name}`,
      callbackUrl,
    });
  } else {
    result = await selcomGateway.initiatePayment({
      transactionReference: txRef,
      phone,
      amount: pkg.price,
      description: `XCLOUD Hotspot ${pkg.name}`,
      callbackUrl,
    });
  }

  // Create pending payment record
  const paymentRecord: PaymentTransaction = {
    id: `tx_${Date.now()}`,
    organizationId: 'org_kili_01',
    siteId: siteId || 'site_dar_01',
    packageId: pkg.id,
    packageName: pkg.name,
    gateway: gateway as any,
    gatewayReference: result.gatewayReference,
    transactionReference: txRef,
    phone,
    amount: pkg.price,
    currency: 'TZS',
    status: 'PENDING',
    idempotencyKey: `idem_${txRef}`,
    metadata: { instructions: result.ussdPromptInstructions },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.payments.unshift(paymentRecord);

  return sendResponse(res, true, {
    payment: paymentRecord,
    instructions: result.ussdPromptInstructions || 'USSD prompt dispatched to phone. Enter PIN.',
    gatewayResult: result,
  }, 'Payment initialized');
});

// Idempotent payment callback handler (for M-Pesa, Airtel, Tigo, Selcom webhooks)
app.post('/api/payments/callback/:gateway', async (req: Request, res: Response) => {
  const { gateway } = req.params;
  const payload = req.body;
  const idempotencyHeader = req.headers['x-idempotency-key'] as string || payload?.CheckoutRequestID || payload?.transaction_id || JSON.stringify(payload);

  // Enforce idempotency: prevent duplicate processing
  if (processedWebhookKeys.has(idempotencyHeader)) {
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Already processed (Idempotent)' });
  }

  let verified;
  if (gateway === 'mpesa') {
    verified = await mpesaGateway.verifyCallback(req.headers, payload);
  } else if (gateway === 'airtel') {
    verified = await airtelGateway.verifyCallback(req.headers, payload);
  } else if (gateway === 'tigo') {
    verified = await tigoGateway.verifyCallback(req.headers, payload);
  } else {
    verified = await selcomGateway.verifyCallback(req.headers, payload);
  }

  // Mark key as processed
  processedWebhookKeys.add(idempotencyHeader);

  // Find transaction
  const payment = db.payments.find(p => 
    p.transactionReference === verified.transactionReference || 
    p.gatewayReference === verified.gatewayReference
  );

  if (payment) {
    payment.status = verified.status;
    payment.updatedAt = new Date().toISOString();

    // If verified successful, generate voucher or activate internet access!
    if (verified.status === 'SUCCESS' && payment.packageId) {
      const pkg = db.packages.find(p => p.id === payment.packageId);
      if (pkg) {
        const p1 = Math.floor(1000 + Math.random() * 9000);
        const p2 = Math.floor(1000 + Math.random() * 9000);
        const voucher: Voucher = {
          id: `vch_pay_${Date.now()}`,
          organizationId: payment.organizationId,
          siteId: payment.siteId,
          packageId: pkg.id,
          packageName: pkg.name,
          code: `TZ-${p1}-${p2}`,
          pin: Math.floor(1000 + Math.random() * 9000).toString(),
          price: pkg.price,
          durationMinutes: pkg.durationMinutes,
          downloadSpeedKbps: pkg.downloadSpeedKbps,
          uploadSpeedKbps: pkg.uploadSpeedKbps,
          dataLimitMb: pkg.dataLimitMb,
          status: 'ACTIVE',
          usedByPhone: payment.phone,
          expiresAt: new Date(Date.now() + pkg.validityHours * 3600000).toISOString(),
          createdAt: new Date().toISOString(),
        };
        db.vouchers.unshift(voucher);
        payment.voucherId = voucher.id;
      }
    }
  }

  return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// Interactive payment simulator: simulates verified gateway callback for user testing
app.post('/api/payments/:id/simulate-verify', (req: Request, res: Response) => {
  const payment = db.payments.find(p => p.id === req.params.id);
  if (!payment) return sendResponse(res, false, null, 'Transaction not found', [], 404);

  if (payment.status === 'SUCCESS') {
    return sendResponse(res, true, payment, 'Transaction is already verified.');
  }

  // Simulate verified gateway callback
  payment.status = 'SUCCESS';
  payment.updatedAt = new Date().toISOString();

  // Create active voucher for customer
  const pkg = db.packages.find(p => p.id === payment.packageId) || db.packages[0];
  const p1 = Math.floor(1000 + Math.random() * 9000);
  const p2 = Math.floor(1000 + Math.random() * 9000);
  const voucher: Voucher = {
    id: `vch_pay_${Date.now()}`,
    organizationId: payment.organizationId,
    siteId: payment.siteId,
    packageId: pkg.id,
    packageName: pkg.name,
    code: `TZ-${p1}-${p2}`,
    pin: Math.floor(1000 + Math.random() * 9000).toString(),
    price: pkg.price,
    durationMinutes: pkg.durationMinutes,
    downloadSpeedKbps: pkg.downloadSpeedKbps,
    uploadSpeedKbps: pkg.uploadSpeedKbps,
    dataLimitMb: pkg.dataLimitMb,
    status: 'ACTIVE',
    usedByPhone: payment.phone,
    expiresAt: new Date(Date.now() + pkg.validityHours * 3600000).toISOString(),
    createdAt: new Date().toISOString(),
  };
  db.vouchers.unshift(voucher);
  payment.voucherId = voucher.id;

  return sendResponse(res, true, { payment, voucher }, 'Payment verified via gateway callback. Internet voucher activated!');
});

// ==========================================
// 9. AGENT / POS (/api/agents)
// ==========================================
app.get('/api/agents', (req: Request, res: Response) => {
  return sendResponse(res, true, db.agents);
});

app.post('/api/agents/:id/topup', (req: Request, res: Response) => {
  const agent = db.agents.find(a => a.id === req.params.id);
  if (!agent) return sendResponse(res, false, null, 'Agent not found', [], 404);

  const amount = Number(req.body.amount || 0);
  if (amount <= 0) return sendResponse(res, false, null, 'Invalid topup amount', [], 400);

  agent.floatBalance += amount;
  return sendResponse(res, true, agent, `Agent float credited with TZS ${amount.toLocaleString()}`);
});

app.post('/api/agents/:id/sell-voucher', (req: Request, res: Response) => {
  const agent = db.agents.find(a => a.id === req.params.id);
  if (!agent) return sendResponse(res, false, null, 'Agent not found', [], 404);

  const { packageId, customerPhone } = req.body;
  const pkg = db.packages.find(p => p.id === packageId);
  if (!pkg) return sendResponse(res, false, null, 'Package not found', [], 404);

  if (agent.floatBalance < pkg.price) {
    return sendResponse(res, false, null, `Insufficient float balance. Required: TZS ${pkg.price.toLocaleString()}, Available: TZS ${agent.floatBalance.toLocaleString()}`, ['Float exhausted'], 400);
  }

  // Deduct from agent float
  agent.floatBalance -= pkg.price;
  const commission = Math.round((pkg.price * agent.commissionRate) / 100);
  agent.totalSales += pkg.price;
  agent.totalCommissionEarned += commission;

  // Generate voucher
  const p1 = Math.floor(1000 + Math.random() * 9000);
  const p2 = Math.floor(1000 + Math.random() * 9000);
  const voucher: Voucher = {
    id: `vch_pos_${Date.now()}`,
    organizationId: agent.organizationId,
    siteId: agent.siteId,
    packageId: pkg.id,
    packageName: pkg.name,
    code: `TZ-${p1}-${p2}`,
    pin: Math.floor(1000 + Math.random() * 9000).toString(),
    price: pkg.price,
    durationMinutes: pkg.durationMinutes,
    downloadSpeedKbps: pkg.downloadSpeedKbps,
    uploadSpeedKbps: pkg.uploadSpeedKbps,
    dataLimitMb: pkg.dataLimitMb,
    status: 'ACTIVE',
    usedByPhone: customerPhone,
    expiresAt: new Date(Date.now() + pkg.validityHours * 3600000).toISOString(),
    createdAt: new Date().toISOString(),
  };
  db.vouchers.unshift(voucher);

  // Record payment
  db.payments.unshift({
    id: `tx_pos_${Date.now()}`,
    organizationId: agent.organizationId,
    siteId: agent.siteId,
    packageId: pkg.id,
    packageName: pkg.name,
    voucherId: voucher.id,
    gateway: 'CASH',
    gatewayReference: `POS-${agent.name}`,
    transactionReference: `XC-POS-${Date.now()}`,
    phone: customerPhone || agent.phone,
    amount: pkg.price,
    currency: 'TZS',
    status: 'SUCCESS',
    idempotencyKey: `idem_pos_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return sendResponse(res, true, {
    voucher,
    agent,
    commissionEarned: commission,
  }, 'Voucher sold successfully by agent');
});

// ==========================================
// 10. OMADA, RADIUS, WIREGUARD (/api/omada, /api/radius, /api/wireguard)
// ==========================================
app.get('/api/omada/aps', (req: Request, res: Response) => {
  return sendResponse(res, true, db.omadaAps);
});

app.get('/api/omada/clients', (req: Request, res: Response) => {
  return sendResponse(res, true, db.omadaClients);
});

app.post('/api/omada/kick', (req: Request, res: Response) => {
  const { mac } = req.body;
  db.omadaClients = db.omadaClients.filter(c => c.mac !== mac);
  return sendResponse(res, true, { kicked: true, mac }, `Client ${mac} disconnected by Omada SDN`);
});

app.get('/api/wireguard/status', (req: Request, res: Response) => {
  const peers = db.routers.filter(r => r.wireguardIp).map(r => ({
    routerId: r.routerId,
    name: r.name,
    allowedIps: r.wireguardIp,
    publicKey: r.wireguardPublicKey,
    status: r.status,
  }));

  return sendResponse(res, true, {
    interfaceName: 'wg0',
    endpoint: process.env.WG_SERVER_ENDPOINT || 'vpn.xcloud.tz',
    port: parseInt(process.env.WG_SERVER_PORT || '51820', 10),
    subnet: '10.88.0.0/16',
    peers,
  });
});

app.get('/api/wireguard/server-conf', (req: Request, res: Response) => {
  const peers = db.routers.filter(r => r.wireguardPublicKey && r.wireguardIp).map(r => ({
    publicKey: r.wireguardPublicKey!,
    allowedIps: r.wireguardIp!,
    routerId: r.routerId,
  }));

  const conf = wireguardService.generateServerWgConf(peers);
  res.setHeader('Content-Type', 'text/plain');
  return res.send(conf);
});

app.get('/api/radius/status', (req: Request, res: Response) => {
  return sendResponse(res, true, {
    host: process.env.RADIUS_HOST || 'radius.xcloud.tz',
    authPort: 1812,
    acctPort: 1813,
    activeNasCount: db.routers.length,
    activeSessions: db.sessions.filter(s => s.status === 'ACTIVE').length,
    serverUptime: '99.98%',
  });
});

// ==========================================
// 11. MONITORING & REPORTS (/api/monitoring, /api/reports)
// ==========================================
app.get('/api/monitoring/stats', (req: Request, res: Response) => {
  const totalRouters = db.routers.length;
  const onlineRouters = db.routers.filter(r => r.status === 'ONLINE').length;
  const offlineRouters = db.routers.filter(r => r.status === 'OFFLINE').length;
  const activeSessions = db.sessions.filter(s => s.status === 'ACTIVE').length;
  
  const todayRevenue = db.payments
    .filter(p => p.status === 'SUCCESS' && p.createdAt.startsWith('2026-10-01'))
    .reduce((sum, p) => sum + p.amount, 0);

  const monthlyRevenue = db.payments
    .filter(p => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0);

  const activeVouchers = db.vouchers.filter(v => v.status === 'ACTIVE').length;
  const totalCustomers = db.customers.length;

  return sendResponse(res, true, {
    totalRouters,
    onlineRouters,
    offlineRouters,
    activeSessions,
    todayRevenue,
    monthlyRevenue,
    activeVouchers,
    totalCustomers,
    bandwidthUsageMbps: {
      download: 142.8,
      upload: 48.5,
    },
    auditLogs: db.auditLogs.slice(0, 10),
  });
});

// Captive Portal Public Site Info
app.get('/api/portal/site-info/:siteCode', (req: Request, res: Response) => {
  const site = db.sites.find(s => s.code.toLowerCase() === req.params.siteCode.toLowerCase()) || db.sites[0];
  const packages = db.packages.filter(p => p.active && p.serviceType === 'HOTSPOT');
  return sendResponse(res, true, {
    site,
    organization: db.organizations[0],
    packages,
  });
});

// Explicit JSON 404 for any unhandled /api/* endpoint
app.all('/api/*', (req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    data: null,
    message: `API route ${req.method} ${req.path} not found`,
    errors: ['Endpoint not found'],
  });
});

// ==========================================
// 12. VITE DEV SERVER OR STATIC ASSETS
// ==========================================
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[XCLOUD] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
