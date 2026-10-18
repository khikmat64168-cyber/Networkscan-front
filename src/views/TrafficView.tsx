import { useMemo } from "react";

import { Empty, SkeletonRows } from "../components/common";
import { TimelineChart } from "../components/TimelineChart";
import { DASH, formatBytes, formatDuration, formatNumber, formatRate, formatTime } from "../format";
import { useNow } from "../hooks";
import { useApp } from "../state/AppState";

export function TrafficView({ onGoToBoard, defaultInterface }: { onGoToBoard: () => void; defaultInterface: string | null }) {
  const { state } = useApp();
  const sensor = state.sensors.traffic;
  const traffic = state.traffic;
  const running = sensor?.state === "running";
  const now = useNow(1000);

  const markers = useMemo(
    () =>
      state.events
        .filter((e) => e.sensor === "traffic")
        .map((e) => ({ t: Math.floor(new Date(e.occurred_at).getTime() / 1000), label: e.summary })),
    [state.events],
  );

  const head = (
    <div className="page-head">
      <div>
        <h2>Traffic</h2>
        <p>Live statistics from the traffic analyzer: what is on the wire, who is talking, and where.</p>
      </div>
    </div>
  );

  if (!sensor?.started_at) {
    return (
      <div className="page">
        {head}
        <section className="panel">
          <Empty
            title="The traffic analyzer has not run yet"
            action={
              <button type="button" className="btn primary" onClick={onGoToBoard}>
                Go to sensors
              </button>
            }
          >
            Start it from the sensor strip on the board. Packet rate, protocol mix, top talkers and recent packets appear
            here as soon as the first packet is captured.
          </Empty>
        </section>
      </div>
    );
  }

  if (!traffic) {
    return (
      <div className="page">
        {head}
        <section className="panel">
          {running ? <SkeletonRows rows={6} /> : <Empty title="No statistics were recorded">The last session ended before any packet was analysed.</Empty>}
        </section>
      </div>
    );
  }

  const startEpoch = sensor.started_at ? Math.floor(new Date(sensor.started_at).getTime() / 1000) : 0;
  const lastBucket = traffic.timeline[traffic.timeline.length - 1]?.t ?? startEpoch;
  const endEpoch = running
    ? Math.floor(now.getTime() / 1000)
    : sensor.stopped_at
      ? Math.floor(new Date(sensor.stopped_at).getTime() / 1000)
      : lastBucket;
  const protocolTotal = Object.values(traffic.protocols).reduce((a, b) => a + b, 0);
  const recent = [...traffic.recent].reverse();

  return (
    <div className="page">
      {head}
      <div className="figures" role="list">
        <div role="listitem">
          <span className="label">Packets</span>
          <b>{formatNumber(traffic.total_packets)}</b>
        </div>
        <div role="listitem">
          <span className="label">Captured</span>
          <b>{formatBytes(traffic.total_bytes)}</b>
        </div>
        <div role="listitem">
          <span className="label">Average rate</span>
          <b>{formatRate(traffic.pps)}/s</b>
        </div>
        <div role="listitem">
          <span className="label">Session</span>
          <b>{formatDuration(traffic.elapsed)}</b>
        </div>
        <div role="listitem">
          <span className="label">{running ? "Interface" : "Stopped"}</span>
          <b>{running ? sensor.interface ?? defaultInterface ?? "default" : formatTime(sensor.stopped_at)}</b>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h3>Packets per second</h3>
          <span className="meta">
            {running ? "last 2 minutes, live" : "final 2 minutes of the session"}
            {sensor.bpf_filter ? ` · filter "${sensor.bpf_filter}"` : ""}
            {markers.length ? " · yellow marks are traffic findings" : ""}
          </span>
        </div>
        <div className="panel-body">
          <TimelineChart points={traffic.timeline} start={startEpoch} end={Math.max(endEpoch, startEpoch)} markers={markers} />
        </div>
      </section>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h3>Protocol mix</h3>
            <span className="meta num">{formatNumber(protocolTotal)} packets</span>
          </div>
          <div className="panel-body">
            {protocolTotal === 0 ? (
              <p className="hint">No packets analysed.</p>
            ) : (
              Object.entries(traffic.protocols).map(([proto, count]) => {
                const pct = (count / protocolTotal) * 100;
                return (
                  <div className="share-row" key={proto}>
                    <span className="board-type">{proto}</span>
                    <span className="bar" role="presentation">
                      <i style={{ width: `${pct}%` }} />
                    </span>
                    <span className="num" style={{ textAlign: "right" }}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
        <RankTable title="Top destination ports" rows={traffic.top_ports.map((p) => [String(p.port), p.packets])} keyLabel="Port" />
      </div>

      <div className="grid-2">
        <RankTable title="Top sources" rows={traffic.top_sources.map((s) => [s.ip, s.packets])} keyLabel="IP address" />
        <RankTable title="Top destinations" rows={traffic.top_destinations.map((s) => [s.ip, s.packets])} keyLabel="IP address" />
      </div>

      <section className="panel">
        <div className="panel-head">
          <h3>Recent packets</h3>
          <span className="meta">newest first · payloads are never sent to the browser</span>
        </div>
        {recent.length === 0 ? (
          <Empty title="No packets yet" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>+Time</th>
                  <th>Proto</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th className="r">Bytes</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p, i) => (
                  <tr key={`${p.elapsed}-${i}`}>
                    <td className="mono">{p.elapsed.toFixed(2)}s</td>
                    <td className="board-type">{p.protocol}</td>
                    <td className="mono">{p.src}</td>
                    <td className="mono">{p.dst}</td>
                    <td className="mono r">{formatNumber(p.length)}</td>
                    <td style={{ maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.info}>
                      {p.info || DASH}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function RankTable({ title, rows, keyLabel }: { title: string; rows: [string, number][]; keyLabel: string }) {
  const max = Math.max(1, ...rows.map(([, n]) => n));
  return (
    <section className="panel">
      <div className="panel-head">
        <h3>{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="hint" style={{ padding: 16 }}>
          Nothing recorded yet.
        </p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>{keyLabel}</th>
              <th style={{ width: "40%" }} aria-hidden="true" />
              <th className="r">Packets</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 8).map(([key, n]) => (
              <tr key={key}>
                <td className="mono">{key}</td>
                <td>
                  <span className="share-row" style={{ display: "block", padding: 0 }}>
                    <span className="bar" style={{ display: "block" }}>
                      <i style={{ width: `${(n / max) * 100}%` }} />
                    </span>
                  </span>
                </td>
                <td className="mono r">{formatNumber(n)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
