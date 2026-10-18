// Shapes returned by the NST web API (src/nst/web/app.py).  Keep in sync.

export type Severity = "info" | "low" | "medium" | "high" | "critical";
export const SEVERITIES: Severity[] = ["critical", "high", "medium", "low", "info"];

export type SensorKind = "traffic" | "arp" | "dns" | "mac";
export const SENSOR_KINDS: SensorKind[] = ["traffic", "arp", "dns", "mac"];

export type SensorState = "idle" | "running" | "stopping" | "stopped" | "error";

export interface ApiErrorBody {
  code: string;
  message: string;
}

export interface SecurityEvent {
  id: string;
  seq: number;
  occurred_at: string;
  sensor: SensorKind;
  module: string;
  category: string;
  severity: Severity;
  summary: string;
  asset_ref: string | null;
  evidence: Record<string, unknown>;
  schema_version: number;
}

export interface SensorStatus {
  kind: SensorKind;
  label: string;
  state: SensorState;
  interface: string | null;
  bpf_filter: string | null;
  started_at: string | null;
  stopped_at: string | null;
  error: ApiErrorBody | null;
  packets: number | null;
  events: number | null;
}

export interface TimelinePoint {
  t: number;
  packets: number;
  bytes: number;
}

export interface PacketRow {
  elapsed: number;
  src: string;
  dst: string;
  protocol: string;
  length: number;
  info: string;
}

export interface TrafficDetails {
  elapsed: number;
  total_packets: number;
  total_bytes: number;
  pps: number;
  protocols: Record<string, number>;
  top_sources: { ip: string; packets: number }[];
  top_destinations: { ip: string; packets: number }[];
  top_ports: { port: number; packets: number }[];
  recent: PacketRow[];
  timeline: TimelinePoint[];
}

export interface ArpBinding {
  ip: string;
  mac: string;
  packets: number;
  trusted: boolean;
  first_seen: string;
  last_seen: string;
}

export interface DnsResolution {
  domain: string;
  current_ip: string;
  ips_seen: string[];
  packets: number;
  last_seen: string;
}

export interface MacDetails {
  unique_macs: number;
  table_limit: number | null;
  top_macs: { mac: string; packets: number }[];
}

export interface SensorDetail<T> {
  status: SensorStatus;
  details: T | Record<string, never>;
}

export interface NetworkInterface {
  name: string;
  ip: string | null;
  mac: string | null;
  description: string | null;
  is_default: boolean;
}

export interface Health {
  status: string;
  version: string;
  python: string;
  platform: string;
  running_as_root: boolean;
  instance_id: string;
  last_event_seq: number;
}

export type FeatureStatus = "operational" | "blocked" | "unavailable";

export interface Feature {
  id: string;
  label: string;
  status: FeatureStatus;
  reason: string | null;
  requires: string | null;
}

export interface Capabilities {
  capture: { allowed: boolean; code: string; message: string; interface: string | null };
  features: Feature[];
}

export interface AppConfigView {
  network: { interface: string | null; promiscuous: boolean };
  analyzer: { detect_credentials: boolean; port_scan_threshold: number; alert_on_suspicious: boolean };
  arp_detector: { trusted_ips: string[]; gateway_ip: string | null };
  dns_detector: { trusted_domains: string[]; track_queries: boolean };
  mac_detector: { flood_threshold: number; window_secs: number; table_limit: number };
  logging: { level: string; file: string };
  reports_dir: string;
}

export interface TlsIssue {
  type: string;
  severity: "medium" | "high" | "critical";
  detail: string;
}

export interface TlsResult {
  host: string;
  port: number;
  error: string | null;
  tls_version: string | null;
  cipher_suite: string | null;
  cipher_bits: number | null;
  public_key_type: string | null;
  public_key_bits: number | null;
  subject: string | null;
  issuer: string | null;
  not_before: string | null;
  not_after: string | null;
  days_until_expiry: number | null;
  san: string[];
  issues: TlsIssue[];
}

export interface GeoResult {
  target: string;
  success: boolean;
  is_private: boolean;
  error: string | null;
  country: string | null;
  country_code: string | null;
  region: string | null;
  city: string | null;
  isp: string | null;
  latitude: number | null;
  longitude: number | null;
  location: string;
}

export interface ReportItem {
  name: string;
  size: number;
  created_at: string;
}

export interface ReportCreated {
  report: ReportItem;
  summary: { tls_hosts: number; interfaces: number; critical: number };
}

export type StreamMessage =
  | { type: "hello"; data: { version: string; instance_id: string; last_seq: number; sensors: SensorStatus[] } }
  | { type: "event"; data: SecurityEvent }
  | { type: "sensor"; data: SensorStatus }
  | { type: "sensors"; data: SensorStatus[] }
  | { type: "traffic"; data: TrafficDetails };
