# ==============================================================================
# XCLOUD MIKROTIK BOOTSTRAP PROVISIONING TEMPLATE
# For RouterOS v7.12+ (Hotspot, RADIUS, WireGuard, Dynamic DNS & Telemetry)
# ==============================================================================

:log info "XCLOUD: Commencing router provision script..."

# 1. System Identity
/system identity set name="XC-ROUTER-DEFAULT"

# 2. FreeRADIUS Configuration
/radius remove [find comment="XCLOUD-RADIUS"]
/radius add address=10.88.0.1 secret="xcloudRadiusSecretKey2026" service=hotspot,ppp \
    authentication-port=1812 accounting-port=1813 timeout=3000ms comment="XCLOUD-RADIUS"
/radius incoming set accept=yes port=3799

# 3. Configure Hotspot Profile for Cloud RADIUS Authentication
/ip hotspot profile set [find default=yes] \
    use-radius=yes \
    radius-accounting=yes \
    radius-interim-update=2m \
    login-by=http-chap,http-pap,mac-cookie \
    html-directory="hotspot"

# 4. WireGuard Remote Management Interface
/interface wireguard add name=wg-xcloud listen-port=13231 comment="XCLOUD-MGMT"
/ip address add address=10.88.0.2/16 interface=wg-xcloud comment="XCLOUD-Tunnel-IP"
/interface wireguard peers add \
    interface=wg-xcloud \
    public-key="SERVER_PUBLIC_KEY_PLACEHOLDER" \
    endpoint-address="vpn.xcloud.tz" \
    endpoint-port=51820 \
    allowed-address=10.88.0.0/16 \
    persistent-keepalive=25s \
    comment="XCLOUD-Hub"

# 5. Heartbeat & Telemetry Script
/system script remove [find name="xcloud-heartbeat"]
/system script add name="xcloud-heartbeat" source="
    :local cpu [/system resource get cpu-load];
    :local memFree [/system resource get free-memory];
    :local memTotal [/system resource get total-memory];
    :local memPct ((($memTotal - $memFree) * 100) / $memTotal);
    :local uptime [/system resource get uptime];
    :local users [/ip hotspot active print count-only];
    :local url \"https://api.xcloud.tz/api/routers/HEARTBEAT_ROUTER_ID/heartbeat\";
    /tool fetch http-method=post http-header-field=\"Content-Type: application/json\" \
        http-data=\"{\\\"cpuUsage\\\":$cpu,\\\"memoryUsage\\\":$memPct,\\\"activeUsers\\\":$users,\\\"uptime\\\":\\\"$uptime\\\"}\" \
        url=$url keep-result=no;
"

/system scheduler remove [find name="xcloud-heartbeat-timer"]
/system scheduler add name="xcloud-heartbeat-timer" interval=60s on-event="xcloud-heartbeat"

:log info "XCLOUD: Bootstrap complete. Router linked to cloud platform."
