// Display formatting.  Pure functions, no data invention: missing values
// render as an em dash so they are never mistaken for zero.

export const DASH = "—";

export function formatClock(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? DASH : formatClock(date);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return DASH;
  return `${date.toLocaleDateString([], { year: "numeric", month: "short", day: "2-digit" })} ${formatClock(date)}`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return DASH;
  return value.toLocaleString("en-US");
}

export function formatRate(value: number | null | undefined): string {
  if (value === null || value === undefined) return DASH;
  return value.toFixed(value >= 100 ? 0 : 1);
}

export function formatBytes(value: number | null | undefined): string {
  if (value === null || value === undefined) return DASH;
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = value;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : n >= 100 ? 0 : 1)} ${units[i]}`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return DASH;
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m) return `${m}m ${String(sec).padStart(2, "0")}s`;
  return `${sec}s`;
}

const CATEGORY_LABELS: Record<string, string> = {
  "credential.plaintext": "Plaintext credential",
  "threat.port_scan": "Port scan",
  "threat.dns_tunneling": "DNS tunneling",
  "threat.suspicious_port": "Suspicious port",
};

/** "arp.gateway_mac_change" → "Gateway MAC change" */
export function categoryLabel(category: string): string {
  const known = CATEGORY_LABELS[category];
  if (known) return known;
  const tail = category.includes(".") ? category.slice(category.indexOf(".") + 1) : category;
  const words = tail.split("_").map((w) => (["mac", "ip", "ips", "arp", "dns", "ttl", "tls"].includes(w) ? w.toUpperCase() : w));
  const text = words.join(" ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * The part of a DNS / ARP finding that tells consecutive rows apart: the
 * change itself.  The asset column already carries the domain or IP, so
 * the board shows "old → new" instead of repeating it.  Built only from
 * the event's own evidence; returns null when there is nothing better
 * than the summary.
 */
export function findingChange(category: string, evidence: Record<string, unknown>, summary: string): string | null {
  const s = (key: string) => {
    const v = evidence[key];
    return typeof v === "string" && v ? v : null;
  };
  switch (category) {
    case "dns.ip_change":
      return s("old_ip") && s("new_ip") ? `${s("old_ip")} → ${s("new_ip")}` : null;
    case "dns.multiple_ips": {
      const idx = summary.lastIndexOf(": ");
      return idx > 0 ? summary.slice(idx + 2) : s("new_ip");
    }
    case "dns.zero_ttl":
      return s("new_ip") ? `${s("new_ip")} · TTL 0` : null;
    case "dns.unsolicited_response":
      return s("new_ip") ? `${s("new_ip")} from ${s("responder_ip") ?? "unknown resolver"}` : null;
    case "arp.mac_change":
    case "arp.gateway_mac_change":
      return s("src_mac") ? `${s("old_mac") ?? "?"} → ${s("src_mac")}` : null;
    case "arp.gratuitous_arp":
    case "arp.mitm_suspected":
      return s("src_mac") ? `from ${s("src_mac")}` : null;
    default:
      return null;
  }
}

/** Shorten long identifiers in the middle so both the start and the end (the TLD, the last octets) stay readable. */
export function middleEllipsis(value: string, max = 20): string {
  if (value.length <= max) return value;
  const tail = Math.ceil((max - 1) / 2);
  const head = max - 1 - tail;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function serial(seq: number): string {
  return `NST-${String(seq).padStart(4, "0")}`;
}

/** 48 on/off bars derived from the event id — the pass's scan block. */
export function scanBars(id: string): boolean[] {
  const bars: boolean[] = [];
  for (let i = 0; i < 12; i += 1) {
    const nibble = parseInt(id.charAt(i % id.length) || "0", 16) || 0;
    for (let b = 3; b >= 0; b -= 1) bars.push(((nibble >> b) & 1) === 1);
  }
  return bars;
}
