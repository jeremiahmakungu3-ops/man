import crypto from 'crypto';

export interface WireguardPeerConfig {
  peerAddress: string; // e.g. 10.88.0.5/32
  serverEndpoint: string;
  serverPort: number;
  serverPublicKey: string;
  clientPrivateKey: string;
  clientPublicKey: string;
  routerOsScript: string;
}

export class WireguardService {
  private serverEndpoint: string;
  private serverPort: number;
  private serverPublicKey: string;
  private subnetBase: string; // 10.88.0.0/16

  constructor() {
    this.serverEndpoint = process.env.WG_SERVER_ENDPOINT || 'vpn.xcloud.tz';
    this.serverPort = parseInt(process.env.WG_SERVER_PORT || '51820', 10);
    this.serverPublicKey = process.env.WG_SERVER_PUBLIC_KEY || 'XCLOUDServerPublicKeyBase64Placeholder=';
    this.subnetBase = '10.88';
  }

  // Generates Curve25519-compatible 32-byte Base64 keypair
  generateKeyPair(): { privateKey: string; publicKey: string } {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('x25519', {
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    });

    // Extract raw 32-byte keys from standard DER envelopes
    const rawPrivate = privateKey.subarray(privateKey.length - 32);
    const rawPublic = publicKey.subarray(publicKey.length - 32);

    return {
      privateKey: rawPrivate.toString('base64'),
      publicKey: rawPublic.toString('base64'),
    };
  }

  generateRouterPeer(routerIdNumber: number): WireguardPeerConfig {
    const keys = this.generateKeyPair();
    // Deterministic or allocated IP in 10.88.X.Y
    const thirdOctet = Math.floor(routerIdNumber / 254);
    const fourthOctet = (routerIdNumber % 254) + 2;
    const clientTunnelIp = `${this.subnetBase}.${thirdOctet}.${fourthOctet}`;

    // Generate RouterOS v7 CLI commands
    const routerOsScript = [
      '# === XCLOUD WireGuard Secure Management Tunnel ===',
      '/interface wireguard add name=wg-xcloud listen-port=13231 private-key="' + keys.privateKey + '" comment="XCLOUD-MGMT"',
      `/ip address add address=${clientTunnelIp}/16 interface=wg-xcloud comment="XCLOUD-Tunnel-IP"`,
      `/interface wireguard peers add interface=wg-xcloud public-key="${this.serverPublicKey}" endpoint-address="${this.serverEndpoint}" endpoint-port=${this.serverPort} allowed-address=10.88.0.0/16 persistent-keepalive=25s comment="XCLOUD-Hub"`,
      '/ip firewall filter add chain=input action=accept in-interface=wg-xcloud comment="Allow XCLOUD Controller"',
    ].join('\n');

    return {
      peerAddress: `${clientTunnelIp}/32`,
      serverEndpoint: this.serverEndpoint,
      serverPort: this.serverPort,
      serverPublicKey: this.serverPublicKey,
      clientPrivateKey: keys.privateKey,
      clientPublicKey: keys.publicKey,
      routerOsScript,
    };
  }

  generateServerWgConf(peers: Array<{ publicKey: string; allowedIps: string; routerId: string }>): string {
    return [
      '[Interface]',
      'Address = 10.88.0.1/16',
      `ListenPort = ${this.serverPort}`,
      'PrivateKey = ' + (process.env.WG_SERVER_PRIVATE_KEY || 'SERVER_PRIVATE_KEY_HERE'),
      'SaveConfig = false',
      '',
      '# --- Connected Routers ---',
      ...peers.map(p => [
        `# Router: ${p.routerId}`,
        '[Peer]',
        `PublicKey = ${p.publicKey}`,
        `AllowedIPs = ${p.allowedIps}`,
        '',
      ].join('\n')),
    ].join('\n');
  }
}
