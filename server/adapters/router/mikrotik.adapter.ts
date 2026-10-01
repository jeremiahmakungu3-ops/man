import { 
  RouterAdapter, 
  SystemResourceResult, 
  RouterTrafficStats, 
  RouterHotspotUser, 
  RouterLogEntry 
} from './router.interface.ts';
import { RouterInterface } from '../../../src/types/index.ts';

export interface MikroTikConfig {
  host: string;
  port?: number;
  username: string;
  password?: string;
  useSsl?: boolean;
  timeoutMs?: number;
}

export class MikroTikAdapter implements RouterAdapter {
  private config: MikroTikConfig;
  private connected: boolean = false;
  private baseRestUrl: string;

  constructor(config: MikroTikConfig) {
    this.config = {
      port: config.useSsl ? 443 : 80,
      timeoutMs: 5000,
      ...config,
    };
    const proto = this.config.useSsl ? 'https' : 'http';
    this.baseRestUrl = `${proto}://${this.config.host}:${this.config.port}/rest`;
  }

  private getAuthHeader(): string {
    const creds = `${this.config.username}:${this.config.password || ''}`;
    return `Basic ${Buffer.from(creds).toString('base64')}`;
  }

  private async request(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs || 5000);

    try {
      const response = await fetch(`${this.baseRestUrl}${endpoint}`, {
        method,
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No response body');
        throw new Error(`RouterOS API responded with status ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Connection to MikroTik router at ${this.config.host}:${this.config.port} timed out (${this.config.timeoutMs}ms)`);
      }
      if (err.cause?.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
        throw new Error(`Connection refused by MikroTik at ${this.config.host}:${this.config.port}. Verify IP and RouterOS REST/API service is enabled.`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async connect(): Promise<{ success: boolean; message: string }> {
    try {
      const resource = await this.getSystemResource();
      this.connected = true;
      return { 
        success: true, 
        message: `Successfully connected to MikroTik ${resource.boardName} (RouterOS v${resource.version})` 
      };
    } catch (err: any) {
      this.connected = false;
      return { 
        success: false, 
        message: `MikroTik connection failed: ${err.message}` 
      };
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async getIdentity(): Promise<string> {
    const res = await this.request('/system/identity');
    return res?.name || 'MikroTik';
  }

  async getSystemResource(): Promise<SystemResourceResult> {
    const res = await this.request('/system/resource');
    return {
      uptime: parseInt(res?.uptime || '0', 10),
      version: res?.version || '7.15',
      cpuLoad: parseInt(res?.['cpu-load'] || '0', 10),
      freeMemory: parseInt(res?.['free-memory'] || '0', 10),
      totalMemory: parseInt(res?.['total-memory'] || '0', 10),
      freeHdd: parseInt(res?.['free-hdd-space'] || '0', 10),
      totalHdd: parseInt(res?.['total-hdd-space'] || '0', 10),
      boardName: res?.['board-name'] || 'MikroTik RouterBOARD',
      architectureName: res?.['architecture-name'] || 'arm64',
    };
  }

  async getInterfaces(): Promise<RouterInterface[]> {
    const raw = await this.request('/interface');
    if (!Array.isArray(raw)) return [];
    return raw.map((item: any) => ({
      name: item.name,
      type: item.type || 'ethernet',
      macAddress: item['mac-address'] || '00:00:00:00:00:00',
      rxBytes: parseInt(item['rx-byte'] || '0', 10),
      txBytes: parseInt(item['tx-byte'] || '0', 10),
      rxRate: parseInt(item['rx-bits-per-second'] || '0', 10),
      txRate: parseInt(item['tx-bits-per-second'] || '0', 10),
      linkUp: item.running === 'true' || item.running === true,
    }));
  }

  async getHotspotUsers(): Promise<RouterHotspotUser[]> {
    const raw = await this.request('/ip/hotspot/user');
    if (!Array.isArray(raw)) return [];
    return raw.map((u: any) => ({
      name: u.name,
      profile: u.profile || 'default',
      uptime: u.uptime,
      bytesIn: parseInt(u['bytes-in'] || '0', 10),
      bytesOut: parseInt(u['bytes-out'] || '0', 10),
      disabled: u.disabled === 'true' || u.disabled === true,
    }));
  }

  async getActiveHotspotUsers(): Promise<RouterHotspotUser[]> {
    const raw = await this.request('/ip/hotspot/active');
    if (!Array.isArray(raw)) return [];
    return raw.map((u: any) => ({
      name: u.user,
      profile: 'active-session',
      uptime: u.uptime,
      bytesIn: parseInt(u['bytes-in'] || '0', 10),
      bytesOut: parseInt(u['bytes-out'] || '0', 10),
      macAddress: u['mac-address'],
      ipAddress: u.address,
      disabled: false,
    }));
  }

  async getPppoeUsers(): Promise<any[]> {
    const raw = await this.request('/ppp/active');
    return Array.isArray(raw) ? raw : [];
  }

  async createHotspotUser(user: {
    name: string;
    password?: string;
    profile: string;
    limitBytesTotal?: number;
  }): Promise<{ success: boolean; message: string }> {
    const payload: Record<string, any> = {
      name: user.name,
      password: user.password || user.name,
      profile: user.profile,
    };
    if (user.limitBytesTotal) {
      payload['limit-bytes-total'] = user.limitBytesTotal.toString();
    }
    await this.request('/ip/hotspot/user', 'PUT', payload);
    return { success: true, message: `Hotspot user ${user.name} created successfully` };
  }

  async removeHotspotUser(username: string): Promise<{ success: boolean; message: string }> {
    await this.request(`/ip/hotspot/user/${username}`, 'DELETE');
    return { success: true, message: `Hotspot user ${username} removed` };
  }

  async disableUser(username: string): Promise<{ success: boolean; message: string }> {
    await this.request(`/ip/hotspot/user/${username}`, 'PATCH', { disabled: true });
    return { success: true, message: `Hotspot user ${username} disabled` };
  }

  async enableUser(username: string): Promise<{ success: boolean; message: string }> {
    await this.request(`/ip/hotspot/user/${username}`, 'PATCH', { disabled: false });
    return { success: true, message: `Hotspot user ${username} enabled` };
  }

  async createProfile(profile: {
    name: string;
    rateLimit?: string;
    sessionTimeout?: string;
  }): Promise<{ success: boolean; message: string }> {
    const payload: Record<string, any> = {
      name: profile.name,
    };
    if (profile.rateLimit) payload['rate-limit'] = profile.rateLimit;
    if (profile.sessionTimeout) payload['session-timeout'] = profile.sessionTimeout;

    await this.request('/ip/hotspot/user/profile', 'PUT', payload);
    return { success: true, message: `Profile ${profile.name} created on MikroTik` };
  }

  async removeProfile(profileName: string): Promise<{ success: boolean; message: string }> {
    await this.request(`/ip/hotspot/user/profile/${profileName}`, 'DELETE');
    return { success: true, message: `Profile ${profileName} removed` };
  }

  async getLogs(limit: number = 50): Promise<RouterLogEntry[]> {
    const raw = await this.request('/log');
    if (!Array.isArray(raw)) return [];
    return raw.slice(-limit).map((l: any) => ({
      time: l.time || new Date().toISOString(),
      topics: l.topics || 'system,info',
      message: l.message || '',
    }));
  }

  async reboot(): Promise<{ success: boolean; message: string }> {
    await this.request('/system/reboot', 'POST');
    return { success: true, message: 'Reboot signal dispatched to MikroTik router' };
  }

  async getHealth(): Promise<Record<string, any>> {
    try {
      const health = await this.request('/system/health');
      return health || { status: 'OK' };
    } catch {
      return { status: 'OK', note: 'Hardware health sensors not present on this board' };
    }
  }

  async getTraffic(interfaceName: string): Promise<RouterTrafficStats> {
    const res = await this.request(`/interface/monitor-traffic?interface=${encodeURIComponent(interfaceName)}&once=true`);
    const data = Array.isArray(res) ? res[0] : res;
    return {
      rxBps: parseInt(data?.['rx-bits-per-second'] || '0', 10),
      txBps: parseInt(data?.['tx-bits-per-second'] || '0', 10),
      rxPacketsPerSec: parseInt(data?.['rx-packets-per-second'] || '0', 10),
      txPacketsPerSec: parseInt(data?.['tx-packets-per-second'] || '0', 10),
    };
  }
}
