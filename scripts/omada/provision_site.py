#!/usr/bin/env python3
"""
TP-Link Omada SDN Site & Hotspot Provisioner
Configures external FreeRADIUS server and Captive Portal redirect on Omada SDN Controller.
"""

import sys
import os
import requests
import json

def provision_omada_site(controller_url, username, password, site_name, radius_ip, radius_secret, portal_url):
    print(f"[*] Connecting to TP-Link Omada Controller at {controller_url}...")
    session = requests.Session()
    session.verify = False

    # 1. Login
    login_res = session.post(f"{controller_url}/api/v2/login", json={
        "username": username,
        "password": password
    })
    
    if login_res.status_code != 200:
        print(f"[!] Login failed with status {login_res.status_code}")
        return False

    data = login_res.json()
    if data.get("errorCode") != 0:
        print(f"[!] Controller rejected authentication: {data.get('msg')}")
        return False

    token = data["result"]["token"]
    headers = {"Csrf-Token": token}
    print("[+] Successfully authenticated with Omada SDN Controller.")

    # 2. Get Site ID
    sites_res = session.get(f"{controller_url}/api/v2/sites", headers=headers)
    sites = sites_res.json().get("result", {}).get("data", [])
    target_site = next((s for s in sites if s.get("name") == site_name), None)

    if not target_site:
        print(f"[*] Site '{site_name}' not found. Creating new site...")
        create_res = session.post(f"{controller_url}/api/v2/sites", headers=headers, json={"name": site_name})
        site_id = create_res.json().get("result", {}).get("siteId", "default")
    else:
        site_id = target_site.get("siteId", "default")

    print(f"[+] Active Site ID: {site_id}")

    # 3. Configure External RADIUS Profile
    radius_payload = {
        "name": "XCLOUD-RADIUS",
        "authServerIp": radius_ip,
        "authServerPort": 1812,
        "authServerSecret": radius_secret,
        "acctServerIp": radius_ip,
        "acctServerPort": 1813,
        "acctServerSecret": radius_secret,
        "interimUpdateInterval": 120
    }
    session.post(f"{controller_url}/api/v2/sites/{site_id}/setting/radius", headers=headers, json=radius_payload)
    print(f"[+] FreeRADIUS configuration synchronized ({radius_ip}:1812/1813).")

    # 4. Configure Hotspot Captive Portal Redirect
    portal_payload = {
        "portalEnable": True,
        "authType": 3, # External RADIUS Server
        "portalUrl": portal_url,
        "landingPageType": 1,
        "authTimeout": 1440
    }
    session.post(f"{controller_url}/api/v2/sites/{site_id}/setting/portal", headers=headers, json=portal_payload)
    print(f"[+] Captive Portal redirect enabled: {portal_url}")
    print("[✔] Omada site provisioning finished successfully.")
    return True

if __name__ == "__main__":
    c_url = os.getenv("OMADA_URL", "https://102.68.10.50:8043")
    u_name = os.getenv("OMADA_USER", "admin")
    p_word = os.getenv("OMADA_PASS", "OmadaSecurePass2026")
    provision_omada_site(c_url, u_name, p_word, "XCLOUD-Hotspot", "10.88.0.1", "xcloudRadiusSecretKey2026", "https://portal.xcloud.tz")
