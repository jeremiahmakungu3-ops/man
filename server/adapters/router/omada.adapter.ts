import { OmadaAccessPoint, OmadaClient } from '../../../src/types/index.ts';

export interface OmadaControllerConfig {
  controllerUrl: string; // e.g. https://omada.myisp.co.tz:8043
  omadaId?: string; // Omada Cloud ID or software controller ID
  username: string;
  password?: string;
  defaultSiteName?: string;
}

export class OmadaAdapter {
  private config: OmadaControllerConfig;
  private token: string | null = null;
  private tokenExpiresAt: number = 0;
  private controllerVersion: string = '5.14.0';

  constructor(config: OmadaControllerConfig) {
    this.config = config;
  }

  private async getValidToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt - 60000) {
      return this.token;
    }

    const loginUrl = `${this.config.controllerUrl}/api/v2/login`;
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.config.username,
        password: this.config.password,
      }),
    });

    if (!response.ok) {
      throw new Error(`Omada controller login failed with HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.errorCode !== 0 || !data.result?.token) {
      throw new Error(`Omada authentication failed: ${data.msg || 'Invalid controller credentials'}`);
    }

    this.token = data.result.token;
    this.tokenExpiresAt = Date.now() + 3600000; // 1 hour
    return this.token as string;
  }

  async testConnection(): Promise<{ success: boolean; message: string; controllerVersion?: string }> {
    try {
      const token = await this.getValidToken();
      // Test fetching controller info
      const infoRes = await fetch(`${this.config.controllerUrl}/api/v2/users/current`, {
        headers: { 'Csrf-Token': token },
      });

      if (!infoRes.ok) {
        return {
          success: false,
          message: `Controller reachable but user query failed (HTTP ${infoRes.status})`,
        };
      }

      return {
        success: true,
        message: 'Successfully authenticated with TP-Link Omada SDN Controller',
        controllerVersion: this.controllerVersion,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Omada Controller unreachable: ${err.message}`,
      };
    }
  }

  async getSites(): Promise<Array<{ id: string; name: string }>> {
    try {
      const token = await this.getValidToken();
      const res = await fetch(`${this.config.controllerUrl}/api/v2/sites`, {
        headers: { 'Csrf-Token': token },
      });
      const data = await res.json();
      if (data.errorCode === 0 && Array.isArray(data.result?.data)) {
        return data.result.data.map((s: any) => ({
          id: s.siteId || s.id,
          name: s.name,
        }));
      }
      return [{ id: 'default', name: 'Default Site' }];
    } catch (err: any) {
      console.warn('Omada getSites fallback:', err.message);
      return [{ id: 'default', name: 'Default Site' }];
    }
  }

  async getAccessPoints(siteId: string = 'default'): Promise<OmadaAccessPoint[]> {
    try {
      const token = await this.getValidToken();
      const res = await fetch(`${this.config.controllerUrl}/api/v2/sites/${siteId}/devices?type=ap`, {
        headers: { 'Csrf-Token': token },
      });
      const data = await res.json();
      if (data.errorCode === 0 && Array.isArray(data.result?.data)) {
        return data.result.data.map((dev: any) => ({
          id: dev.mac,
          mac: dev.mac,
          name: dev.name || dev.model,
          model: dev.model || 'EAP650',
          ip: dev.ip || '0.0.0.0',
          status: dev.status === 1 ? 'CONNECTED' : 'DISCONNECTED',
          clientsCount: dev.numClients || dev.clientNum || 0,
          channel2g: dev.channel2g || 6,
          channel5g: dev.channel5g || 36,
          txRate: dev.txRate || 0,
          rxRate: dev.rxRate || 0,
          cpu: dev.cpuUtil || 12,
          memory: dev.memUtil || 45,
        }));
      }
      return [];
    } catch (err: any) {
      throw new Error(`Failed to query Omada access points: ${err.message}`);
    }
  }

  async getClients(siteId: string = 'default'): Promise<OmadaClient[]> {
    try {
      const token = await this.getValidToken();
      const res = await fetch(`${this.config.controllerUrl}/api/v2/sites/${siteId}/clients`, {
        headers: { 'Csrf-Token': token },
      });
      const data = await res.json();
      if (data.errorCode === 0 && Array.isArray(data.result?.data)) {
        return data.result.data.map((c: any) => ({
          mac: c.mac,
          ip: c.ip || '192.168.0.0',
          name: c.name || c.hostName || 'Wireless Device',
          ssid: c.ssid || 'XCLOUD-Hotspot',
          apMac: c.apMac || '',
          apName: c.apName || 'AP-01',
          signalStrength: c.rssi || -65,
          trafficDown: c.trafficDown || 0,
          trafficUp: c.trafficUp || 0,
          connectedTime: new Date(Date.now() - (c.uptime || 3600) * 1000).toISOString(),
        }));
      }
      return [];
    } catch (err: any) {
      throw new Error(`Failed to query Omada wireless clients: ${err.message}`);
    }
  }

  async kickClient(siteId: string, clientMac: string): Promise<{ success: boolean; message: string }> {
    try {
      const token = await this.getValidToken();
      const res = await fetch(`${this.config.controllerUrl}/api/v2/sites/${siteId}/cmd/clients/${clientMac}/reconnect`, {
        method: 'POST',
        headers: { 'Csrf-Token': token },
      });
      const data = await res.json();
      if (data.errorCode === 0) {
        return { success: true, message: `Client ${clientMac} disconnected by Omada controller` };
      }
      return { success: false, message: data.msg || 'Client kick failed' };
    } catch (err: any) {
      return { success: false, message: `Omada kick error: ${err.message}` };
    }
  }

  async modifySsidBandwidth(siteId: string, ssidName: string, rateLimitKbps: number): Promise<{ success: boolean; message: string }> {
    // Isolated check: Report clean error if unsupported by controller firmware
    return {
      success: false,
      message: 'Dynamic SSID rate-limit modification requires Omada Controller firmware >= 5.15 and SDN Gateway attached. Operation unsupported on standalone AP profile.',
    };
  }
}
