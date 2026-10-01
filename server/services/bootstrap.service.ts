import crypto from 'crypto';
import { RouterDevice } from '../../src/types/index.ts';
import { WireguardService } from './wireguard.service.ts';

export interface BootstrapTokenRecord {
  token: string;
  routerId: string;
  organizationId: string;
  expiresAt: number;
  consumed: boolean;
}

export class BootstrapService {
  private tokens: Map<string, BootstrapTokenRecord> = new Map();
  private wireguardService: WireguardService;

  constructor() {
    this.wireguardService = new WireguardService();
  }

  generateInstallationToken(routerId: string, organizationId: string): {
    token: string;
    expiresAt: string;
    terminalCommand: string;
  } {
    const token = `xc_${crypto.randomBytes(18).toString('hex')}`;
    const expiresAtMs = Date.now() + 30 * 60 * 1000; // 30 minutes validity

    this.tokens.set(token, {
      token,
      routerId,
      organizationId,
      expiresAt: expiresAtMs,
      consumed: false,
    });

    const appUrl = (process.env.APP_URL || 'https://xcloud.tz').replace(/\/$/, '');
    const fetchUrl = `${appUrl}/api/routers/bootstrap/${token}`;

    // Standard MikroTik RouterOS v6 & v7 one-liner bootstrap execution
    const terminalCommand = `/tool fetch url="${fetchUrl}" mode=https dst-path=xcloud-setup.rsc; :delay 2s; /import xcloud-setup.rsc; /file remove xcloud-setup.rsc`;

    return {
      token,
      expiresAt: new Date(expiresAtMs).toISOString(),
      terminalCommand,
    };
  }

  validateAndConsumeToken(token: string): BootstrapTokenRecord | null {
    const record = this.tokens.get(token);
    if (!record) return null;
    if (record.consumed) return null;
    if (Date.now() > record.expiresAt) {
      this.tokens.delete(token);
      return null;
    }

    // Mark as consumed immediately (one-time use)
    record.consumed = true;
    return record;
  }

  generateRouterOsScript(router: RouterDevice, tokenRecord: BootstrapTokenRecord): string {
    const appUrl = (process.env.APP_URL || 'https://xcloud.tz').replace(/\/$/, '');
    const radiusHost = process.env.RADIUS_HOST || 'radius.xcloud.tz';
    const radiusSecret = process.env.RADIUS_SECRET || 'xcloudRadiusSecretKey2026';
    const numId = parseInt(router.id.replace(/\D/g, '').slice(-4) || '1', 10);
    
    // Wireguard peer configuration
    const wg = this.wireguardService.generateRouterPeer(numId);

    const script = [
      '############################################################',
      `# XCLOUD AUTOMATED MIKROTIK PROVISIONING`,
      `# Router ID: ${router.routerId} (${router.name})`,
      `# Generated: ${new Date().toISOString()}`,
      '############################################################',
      '',
      ':log info "XCLOUD: Starting automated bootstrap..."',
      '',
      '# --- 1. Set System Identity ---',
      `/system identity set name="${router.routerId}-${router.name.replace(/[^a-zA-Z0-9_-]/g, '')}"`,
      '',
      '# --- 2. FreeRADIUS Configuration ---',
      '/radius remove [find comment="XCLOUD-RADIUS"]',
      `/radius add address=${radiusHost} secret="${radiusSecret}" service=hotspot,ppp authentication-port=1812 accounting-port=1813 timeout=3000ms comment="XCLOUD-RADIUS"`,
      '/radius incoming set accept=yes port=3799',
      '',
      '# --- 3. WireGuard VPN Interface & Peer ---',
      wg.routerOsScript,
      '',
      '# --- 4. Hotspot FreeRADIUS Authentication Link ---',
      '/ip hotspot profile set [find default=yes] use-radius=yes radius-accounting=yes radius-interim-update=2m',
      '',
      '# --- 5. Scheduled Real-time Heartbeat Script ---',
      '/system script remove [find name="xcloud-heartbeat"]',
      `/system script add name="xcloud-heartbeat" source="\\
        :local cpu [/system resource get cpu-load];\\
        :local memFree [/system resource get free-memory];\\
        :local memTotal [/system resource get total-memory];\\
        :local memPct (((\\$memTotal - \\$memFree) * 100) / \\$memTotal);\\
        :local uptime [/system resource get uptime];\\
        :local users [/ip hotspot active print count-only];\\
        :local url \\"${appUrl}/api/routers/${router.id}/heartbeat\\";\\
        /tool fetch http-method=post http-header-field=\\"Content-Type: application/json\\" http-data=\\"{\\\\\\"cpuUsage\\\\\\":\\$cpu,\\\\\\"memoryUsage\\\\\\":\\$memPct,\\\\\\"activeUsers\\\\\\":\\$users,\\\\\\"uptime\\\\\\":\\\\\\"$uptime\\\\\\"}\\" url=\\$url keep-result=no;\\
      "`,
      '',
      '/system scheduler remove [find name="xcloud-heartbeat-timer"]',
      '/system scheduler add name="xcloud-heartbeat-timer" interval=60s on-event="xcloud-heartbeat"',
      '',
      '# --- 6. Initial Immediate Heartbeat Trigger ---',
      ':execute script="xcloud-heartbeat"',
      ':log info "XCLOUD: Router successfully provisioned and linked to cloud."',
      '############################################################',
    ].join('\n');

    return script;
  }
}
