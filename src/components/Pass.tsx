// The selected finding, issued as a boarding pass: route (from → to),
// segments for the facts, the full evidence, and a scan block derived
// from the event id.

import { ArrowRight, Copy, SkipForward, X } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, RefObject } from "react";

import type { SecurityEvent } from "../api/types";
import { DASH, categoryLabel, formatDateTime, formatTime, scanBars, serial } from "../format";

const SENSOR_NAMES: Record<string, string> = {
  traffic: "Traffic analyzer",
  arp: "ARP spoofing detector",
  dns: "DNS spoofing detector",
  mac: "MAC flooding detector",
};

interface Route {
  fromLabel: string;
  from: string;
  toLabel: string;
  to: string;
}

function str(value: unknown): string {
  if (value === null || value === undefined || value === "") return DASH;
  if (Array.isArray(value)) return value.length ? value.join(", ") : DASH;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Shrink long route values (IPv6, MACs, domains) instead of breaking them mid-token. */
function routeLength(value: string): "long" | "xlong" | undefined {
  if (value.length > 18) return "xlong";
  if (value.length > 10) return "long";
  return undefined;
}

function routeFor(event: SecurityEvent): Route {
  const e = event.evidence;
  if (event.category.startsWith("arp.")) {
    return { fromLabel: "Previous MAC", from: str(e.old_mac ?? "first seen"), toLabel: "Now answering", to: str(e.src_mac) };
  }
  if (event.category.startsWith("dns.")) {
    return { fromLabel: "Previous IP", from: str(e.old_ip ?? "first answer"), toLabel: "New IP", to: str(e.new_ip) };
  }
  if (event.category.startsWith("mac.")) {
    return { fromLabel: "Trigger MAC", from: str(e.mac), toLabel: "MACs tracked", to: str(e.total_macs) };
  }
  return { fromLabel: "Source", from: str(e.src_ip), toLabel: "Destination", to: str(e.dst_ip) };
}

const HIDDEN_KEYS = new Set(["detected_at"]);

/**
 * Tear-off notches are cut out of the pass with a mask, so whatever is
 * behind the pass shows through.  The mask needs the perforation's y.
 */
export function usePerforation(): [RefObject<HTMLElement>, RefObject<HTMLDivElement>, CSSProperties] {
  const passRef = useRef<HTMLElement>(null);
  const perfRef = useRef<HTMLDivElement>(null);
  const [y, setY] = useState<number | null>(null);
  useLayoutEffect(() => {
    const pass = passRef.current;
    const perf = perfRef.current;
    if (!pass || !perf) return;
    const measure = () => setY(perf.getBoundingClientRect().top - pass.getBoundingClientRect().top);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(pass);
    return () => observer.disconnect();
  });
  return [passRef, perfRef, y === null ? {} : ({ "--perf-y": `${y}px` } as CSSProperties)];
}

export function Pass({
  event,
  unreadCount,
  onNextUnread,
  onClose,
}: {
  event: SecurityEvent;
  unreadCount: number;
  onNextUnread: () => void;
  onClose?: () => void;
}) {
  const route = routeFor(event);
  const [copied, setCopied] = useState(false);
  const bars = scanBars(event.id);
  const evidence = Object.entries(event.evidence).filter(([k]) => !HIDDEN_KEYS.has(k));
  const [passRef, perfRef, perfStyle] = usePerforation();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(event, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article ref={passRef} className="pass notched" style={perfStyle} aria-label={`Finding ${serial(event.seq)}`}>
      <header className="pass-head" data-sev={event.severity}>
        <span className="board-type">{event.severity}</span>
        <span className="board-type">{serial(event.seq)}</span>
        {onClose ? (
          <button type="button" className="btn small ghost pass-close" onClick={onClose} aria-label="Close finding">
            <X size={14} aria-hidden="true" />
          </button>
        ) : null}
      </header>
      <h3 className="pass-title">{event.summary}</h3>
      <div className="pass-route">
        <div className="end">
          <small>{route.fromLabel}</small>
          <b data-len={routeLength(route.from)}>{route.from}</b>
        </div>
        <ArrowRight size={20} aria-hidden="true" />
        <div className="end">
          <small>{route.toLabel}</small>
          <b data-len={routeLength(route.to)}>{route.to}</b>
        </div>
      </div>
      <div ref={perfRef} className="perforation" aria-hidden="true" />
      <div className="pass-segs">
        <div className="pass-seg">
          <small>Finding</small>
          <span>{categoryLabel(event.category)}</span>
        </div>
        <div className="pass-seg">
          <small>Asset</small>
          <span className="mono">{event.asset_ref ?? DASH}</span>
        </div>
        <div className="pass-seg">
          <small>Sensor</small>
          <span>{SENSOR_NAMES[event.sensor] ?? event.sensor}</span>
        </div>
        <div className="pass-seg">
          <small>Filed</small>
          <span className="mono">{formatTime(event.occurred_at)}</span>
        </div>
      </div>
      <div className="pass-evidence">
        <small className="label" style={{ color: "#545b63" }}>
          Evidence · {event.module} · {formatDateTime(event.occurred_at)}
        </small>
        <dl>
          {evidence.map(([key, value]) => (
            <div key={key} style={{ display: "contents" }}>
              <dt>{key}</dt>
              <dd>
                {value === "[redacted]" ? (
                  <span className="redacted" title="Never sent to the browser">
                    redacted
                  </span>
                ) : (
                  str(value)
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="pass-code" aria-hidden="true">
        {bars.map((on, i) => (
          <i key={i} data-off={!on} />
        ))}
      </div>
      <div className="pass-foot">
        <button type="button" className="btn small" onClick={onNextUnread} disabled={unreadCount === 0}>
          <SkipForward size={13} aria-hidden="true" />
          Next new ({unreadCount})
        </button>
        <button type="button" className="btn small secondary" onClick={() => void copy()}>
          <Copy size={13} aria-hidden="true" />
          {copied ? "Copied" : "Copy JSON"}
        </button>
      </div>
    </article>
  );
}
