import { RouterInterface } from '../../../src/types/index.ts';

export interface SystemResourceResult {
  uptime: number; // in seconds
  version: string;
  cpuLoad: number; // percentage
  freeMemory: number; // in bytes
  totalMemory: number; // in bytes
  freeHdd: number; // in bytes
  totalHdd: number; // in bytes
  boardName: string;
  architectureName: string;
}

export interface RouterTrafficStats {
  rxBps: number;
  txBps: number;
  rxPacketsPerSec: number;
  txPacketsPerSec: number;
}

export interface RouterHotspotUser {
  name: string;
  profile: string;
  uptime?: string;
  bytesIn?: number;
  bytesOut?: number;
  macAddress?: string;
  ipAddress?: string;
  disabled: boolean;
}

export interface RouterLogEntry {
  time: string;
  topics: string;
  message: string;
}

export interface RouterAdapter {
  connect(): Promise<{ success: boolean; message: string }>;
  disconnect(): Promise<void>;
  getIdentity(): Promise<string>;
  getSystemResource(): Promise<SystemResourceResult>;
  getInterfaces(): Promise<RouterInterface[]>;
  getHotspotUsers(): Promise<RouterHotspotUser[]>;
  getActiveHotspotUsers(): Promise<RouterHotspotUser[]>;
  getPppoeUsers(): Promise<any[]>;
  createHotspotUser(user: {
    name: string;
    password?: string;
    profile: string;
    limitBytesTotal?: number;
  }): Promise<{ success: boolean; message: string }>;
  removeHotspotUser(username: string): Promise<{ success: boolean; message: string }>;
  disableUser(username: string): Promise<{ success: boolean; message: string }>;
  enableUser(username: string): Promise<{ success: boolean; message: string }>;
  createProfile(profile: {
    name: string;
    rateLimit?: string;
    sessionTimeout?: string;
  }): Promise<{ success: boolean; message: string }>;
  removeProfile(profileName: string): Promise<{ success: boolean; message: string }>;
  getLogs(limit?: number): Promise<RouterLogEntry[]>;
  reboot(): Promise<{ success: boolean; message: string }>;
  getHealth(): Promise<Record<string, any>>;
  getTraffic(interfaceName: string): Promise<RouterTrafficStats>;
}
