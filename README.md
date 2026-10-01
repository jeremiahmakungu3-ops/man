# XCLOUD
### Hotspot Billing • ISP Automation • Network Management • Tanzanian Mobile Money

Production-grade cloud-based hotspot, PPPoE ISP billing, and network automation platform engineered for Tanzania and East African telecommunications operators, WISPs, hotels, campuses, and fiber providers.

---

## 1. System Architecture Overview

```
                                  +------------------------------+
                                  |     Internet / Customers     |
                                  +--------------+---------------+
                                                 |
                                         Captive Portal / WiFi
                                                 |
+------------------------------------------------v-----------------------------------------------+
|                                      XCLOUD CLOUD PLATFORM                                     |
|                                                                                                |
|   +-----------------------+     +-----------------------+     +----------------------------+   |
|   |   Next.js / React UI  | <-> |  REST API / Express   | <-> |  Django / PostgreSQL Core  |   |
|   |  - Network Operations |     |  - RouterOS Adapters  |     |  - Multi-Tenant Schema     |   |
|   |  - Mobile Money POS   |     |  - Omada OpenAPI      |     |  - Voucher State Machine   |   |
|   |  - Captive Portal     |     |  - Webhook Idempotency|     |  - Subscription Ledger     |   |
|   +-----------------------+     +-----------+-----------+     +-------------+--------------+   |
|                                             |                               |                  |
|                                 +-----------v-----------+                   |                  |
|                                 |     WireGuard VPN     |                   |                  |
|                                 |    10.88.0.0/16 Hub   |                   |                  |
|                                 +-----------+-----------+                   |                  |
|                                             |                               |                  |
+---------------------------------------------|-------------------------------|------------------+
                                              | Encrypted Overlay             | Radius AAA (1812/1813)
                                              v                               v
                       +-----------------------------------------------+ +-----------------------+
                       |               Distributed NAS                 | |     FreeRADIUS 3.2    |
                       |  - MikroTik RouterOS v7 (CCR / RB4011 / hAP)  | |  - radcheck / radreply|
                       |  - TP-Link Omada SDN Gateways & EAP APs        | |  - radacct Accounting |
                       +-----------------------------------------------+ +-----------------------+
```

---

## 2. Key Features

- **Multi-Tenant ISP Architecture**: Strict organization and site data isolation across organizations, sites, routers, customers, and financial ledgers.
- **Role-Based Access Control (RBAC)**: `SUPER_ADMIN`, `ORGANIZATION_ADMIN`, `MANAGER`, `TECHNICIAN`, `AGENT`, and `VIEWER`.
- **Automatic MikroTik RouterOS Bootstrap**: Generates one-time cryptographically secure tokens. Run a single command in WinBox terminal to automatically provision FreeRADIUS, WireGuard VPN, Hotspot profiles, and scheduled heartbeat reporting.
- **TP-Link Omada SDN Integration**: Native adapter interacting with Omada OpenAPI for site discovery, access point management, wireless client monitoring, and kick actions.
- **FreeRADIUS Engine**: PostgreSQL-backed AAA server managing `radcheck` (passwords/pins), `radreply` (bandwidth limits like `5M/10M`, session timeouts), and `radacct` (accounting octets and durations).
- **Tanzanian Mobile Money Adapters**:
  - **Vodacom M-Pesa** (Daraja Lipa Na M-Pesa Online STK Push)
  - **Airtel Money** (USSD Merchant Push)
  - **Tigo Pesa** (Biller Push)
  - **Selcom Pay** (Multi-channel QR / Card / USSD)
- **Idempotent Webhook Callbacks**: Prevents double-crediting or duplicate voucher generation from repeated network callbacks.
- **Mobile-First Captive Portal**: Lightweight responsive portal with Mobile Money checkout, instant voucher code redemption, and subscriber credentials.
- **Agent POS Terminal**: Fast voucher retail dispensing for kiosks and shops with real-time float balance deduction and commission calculation.

---

## 3. Technology Stack

- **Frontend**: Next.js, React 19, TypeScript, Tailwind CSS v4, Lucide icons.
- **Backend**: Express + Django REST Framework, Python 3.11, PostgreSQL 16.
- **Asynchronous & Scheduled Tasks**: Redis 7, Celery, Celery Beat.
- **Authentication**: FreeRADIUS 3.2, JWT with access and refresh tokens.
- **Network Overlays**: WireGuard (`wg0` interface `10.88.0.0/16`), RouterOS API, Omada Controller API.
- **Reverse Proxy**: Nginx with SSL termination and Gzip compression.

---

## 4. Development & Running

### Option A: Local Dev Server (Current Web Environment)

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack dev server (Express REST API + Vite frontend)
npm run dev

# 3. Access in browser
http://localhost:3000
```

### Option B: Docker Compose (Full Production Cluster)

```bash
# 1. Clone repo & configure environment
cp .env.example .env
nano .env

# 2. Spin up complete cluster
docker compose up -d

# 3. Apply database migrations
docker compose run --rm backend python manage.py migrate

# 4. Create superuser
docker compose run --rm backend python manage.py createsuperuser

# 5. Access services
# Frontend Dashboard: http://localhost:3000
# Backend API:        http://localhost:8000/api/
# PostgreSQL:         localhost:5432
# FreeRADIUS Auth:    udp://localhost:1812
# FreeRADIUS Acct:    udp://localhost:1813
```

---

## 5. Automated MikroTik Provisioning Flow

1. Admin clicks **Register Router** in `/routers`.
2. XCLOUD allocates Router ID (e.g. `XC-MK-001`), creates a WireGuard tunnel peer IP (e.g. `10.88.0.2/16`), and generates a **one-time 30-minute token**.
3. Admin copies the terminal one-liner:
   ```routeros
   /tool fetch url="https://api.xcloud.tz/api/routers/bootstrap/xc_f89104..." mode=https dst-path=xcloud-setup.rsc; :delay 2s; /import xcloud-setup.rsc; /file remove xcloud-setup.rsc
   ```
4. The router downloads the configuration, burns the one-time token, configures FreeRADIUS, establishes the WireGuard tunnel, and registers a 60s background heartbeat.
5. The dashboard detects the heartbeat and automatically marks the router **ONLINE**.

---

## 6. Tanzanian Mobile Money Environment Variables

Configure `.env` with real credentials:

```bash
# Vodacom M-Pesa Tanzania
MPESA_API_KEY="your_consumer_key"
MPESA_SECRET="your_consumer_secret"
MPESA_SHORTCODE="174379"
MPESA_PASSKEY="your_passkey"
MPESA_ENV="production"

# Airtel Money Tanzania
AIRTEL_API_KEY="your_client_id"
AIRTEL_SECRET="your_client_secret"
AIRTEL_COUNTRY="TZ"
AIRTEL_CURRENCY="TZS"

# Tigo Pesa
TIGO_API_KEY="your_tigo_key"
TIGO_SECRET="your_tigo_secret"

# Selcom Pay
SELCOM_API_KEY="your_vendor_key"
SELCOM_SECRET="your_vendor_secret"
```

---

## 7. License

MIT License. Designed and engineered for high-availability telecommunications environments.
