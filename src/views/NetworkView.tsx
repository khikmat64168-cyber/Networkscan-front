import { useState } from "react";

import type { ArpBinding, DnsResolution, MacDetails, SensorDetail, SensorKind } from "../api/types";
import { Empty, ErrorNotice, SkeletonRows, StatusWord } from "../components/common";
import { formatNumber, formatTime } from "../format";
import { useApiGet } from "../hooks";
import { useApp } from "../state/AppState";

type Tab = "arp" | "dns" | "mac";

const TABS: { id: Tab; label: string }[] = [
  { id: "arp", label: "ARP bindings" },
  { id: "dns", label: "DNS resolutions" },
  { id: "mac", label: "MAC addresses" },
];

export function NetworkView({ onGoToBoard, defaultInterface }: { onGoToBoard: () => void; defaultInterface: string | null }) {
  const [tab, setTab] = useState<Tab>("arp");
  const { state } = useApp();
  const sensor = state.sensors[tab];
  const running = sensor?.state === "running";
  const detail = useApiGet<SensorDetail<unknown>>(`/api/sensors/${tab}`, running ? 2000 : undefined);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Network</h2>
          <p>What each detector has observed on the wire. Tables come straight from the running detectors.</p>
        </div>
      </div>
      <section className="panel">
        <div className="tabs" role="tablist" aria-label="Detector tables">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls="network-panel"
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div id="network-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
          <div className="panel-head">
            <StatusWord state={sensor?.state ?? "idle"}>
              {sensor?.state === "idle" || !sensor ? "not started" : sensor.state}
            </StatusWord>
            <span className="meta">
              {sensor?.started_at
                ? `${sensor.interface ?? defaultInterface ?? "default interface"} · started ${formatTime(sensor.started_at)}${running ? " · refreshing every 2s" : ""}`
                : "This detector has not run since the server started."}
            </span>
          </div>
          {detail.error ? (
            <div className="panel-body">
              <ErrorNotice error={detail.error} />
            </div>
          ) : detail.loading && !detail.data ? (
            <SkeletonRows />
          ) : !sensor?.started_at ? (
            <Empty
              title={`Start the ${tab.toUpperCase()} detector to fill this table`}
              action={
                <button type="button" className="btn" onClick={onGoToBoard}>
                  Go to sensors
                </button>
              }
            />
          ) : (
            <DetailTable kind={tab} details={detail.data?.details ?? {}} />
          )}
        </div>
      </section>
    </div>
  );
}

function DetailTable({ kind, details }: { kind: SensorKind; details: unknown }) {
  if (kind === "arp") {
    const rows = (details as { bindings?: ArpBinding[] }).bindings ?? [];
    if (!rows.length) return <Empty title="No ARP bindings observed">Nothing was seeded from the OS cache and no ARP traffic has been seen.</Empty>;
    return (
      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>IP address</th>
              <th>MAC address</th>
              <th className="r">Packets</th>
              <th>Trusted</th>
              <th>Last seen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.ip}>
                <td className="mono">{b.ip}</td>
                <td className="mono">{b.mac}</td>
                <td className="mono r">{formatNumber(b.packets)}</td>
                <td>{b.trusted ? <span className="status" data-state="operational">Trusted</span> : null}</td>
                <td className="mono">{formatTime(b.last_seen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (kind === "dns") {
    const rows = (details as { resolutions?: DnsResolution[] }).resolutions ?? [];
    if (!rows.length) return <Empty title="No DNS answers observed yet">Resolutions appear as DNS responses cross the interface.</Empty>;
    return (
      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Domain</th>
              <th>Current IP</th>
              <th>All IPs this session</th>
              <th className="r">Answers</th>
              <th>Last seen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.domain}>
                <td style={{ overflowWrap: "anywhere" }}>{r.domain}</td>
                <td className="mono">{r.current_ip}</td>
                <td className="mono" style={{ color: r.ips_seen.length > 1 ? "var(--high)" : undefined }}>
                  {r.ips_seen.join(", ")}
                </td>
                <td className="mono r">{formatNumber(r.packets)}</td>
                <td className="mono">{formatTime(r.last_seen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  const mac = details as Partial<MacDetails>;
  if (!mac.top_macs?.length) return <Empty title="No frames observed yet" />;
  return (
    <>
      <div className="panel-body hint">
        {formatNumber(mac.unique_macs ?? 0)} unique source MACs tracked
        {mac.table_limit ? ` of a ${formatNumber(mac.table_limit)} limit` : ""}. Top {mac.top_macs.length} by frames:
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>MAC address</th>
            <th className="r">Frames</th>
          </tr>
        </thead>
        <tbody>
          {mac.top_macs.map((m) => (
            <tr key={m.mac}>
              <td className="mono">{m.mac}</td>
              <td className="mono r">{formatNumber(m.packets)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
