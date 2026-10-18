// Sensors as departure-board rows: name, a leader line that carries the
// state (solid live, dashed stopping, red error, dim idle), the state word,
// live figures inline, the interface and the action.

import { Play, Square } from "lucide-react";
import { useEffect, useState } from "react";

import type { Capabilities, NetworkInterface, SensorKind, SensorStatus } from "../api/types";
import { SENSOR_KINDS } from "../api/types";
import { formatDuration, formatNumber, formatTime } from "../format";
import { useAction, useNow } from "../hooks";
import { useApp } from "../state/AppState";
import { ErrorNotice, StatusWord } from "./common";

const LABELS: Record<SensorKind, string> = {
  traffic: "Traffic analyzer",
  arp: "ARP spoofing",
  dns: "DNS spoofing",
  mac: "MAC flooding",
};

const PACKET_NOUN: Record<SensorKind, string> = {
  traffic: "pkts",
  arp: "arp",
  dns: "dns",
  mac: "frames",
};

const PURPOSE: Record<SensorKind, string> = {
  traffic: "Protocols, talkers, credentials, threats",
  arp: "Bindings and gateway MAC changes",
  dns: "Answer changes, unsolicited, TTL 0",
  mac: "Bursts of new source MACs",
};

interface Props {
  interfaces: NetworkInterface[] | null;
  defaultInterface: string | null;
  capabilities: Capabilities | null;
}

export function SensorStrip({ interfaces, defaultInterface, capabilities }: Props) {
  const { state, startSensor } = useApp();
  const running = SENSOR_KINDS.filter((k) => {
    const s = state.sensors[k]?.state;
    return s === "running" || s === "stopping";
  });
  const startable = SENSOR_KINDS.filter(
    (k) => !running.includes(k) && capabilities?.features.find((f) => f.id === k)?.status !== "blocked",
  );
  const startAll = useAction(async () => {
    // Sequential so a permission failure on the first stops the rest.
    for (const kind of startable) await startSensor(kind, { interface: null });
  });

  return (
    <section className="panel" aria-labelledby="sensors-title">
      <div className="panel-head">
        <h3 id="sensors-title">Sensors</h3>
        <span className="meta num">
          {running.length} of {SENSOR_KINDS.length} running
          {defaultInterface ? ` · default interface ${defaultInterface}` : ""}
        </span>
        <div className="tools">
          <button
            type="button"
            className="btn small primary"
            disabled={!startable.length || startAll.pending}
            onClick={() => void startAll.run()}
          >
            <Play size={13} aria-hidden="true" />
            {startAll.pending ? "Starting" : startable.length === SENSOR_KINDS.length ? "Start all" : "Start the rest"}
          </button>
        </div>
      </div>
      {startAll.error ? (
        <div className="panel-body" style={{ paddingBottom: 0 }}>
          <ErrorNotice error={startAll.error} action="Start" />
        </div>
      ) : null}
      <ul className="sensor-rows">
        {SENSOR_KINDS.map((kind) => (
          <SensorRow
            key={kind}
            kind={kind}
            interfaces={interfaces}
            defaultInterface={defaultInterface}
            capabilities={capabilities}
          />
        ))}
      </ul>
    </section>
  );
}

function SensorRow({ kind, interfaces, defaultInterface, capabilities }: Props & { kind: SensorKind }) {
  const { state, startSensor, stopSensor } = useApp();
  const status: SensorStatus | undefined = state.sensors[kind];
  const sensorState = status?.state ?? "idle";
  const active = sensorState === "running" || sensorState === "stopping";
  const [iface, setIface] = useState<string>("");
  const [bpf, setBpf] = useState("");
  const start = useAction(startSensor);
  const stop = useAction(stopSensor);
  const now = useNow(1000);

  useEffect(() => {
    if (status?.interface) setIface(status.interface);
  }, [status?.interface]);

  const feature = capabilities?.features.find((f) => f.id === kind);
  const blocked = feature?.status === "blocked";
  const shownState = blocked && !active ? "blocked" : sensorState;
  const word = shownState === "idle" ? "not started" : shownState;

  const uptime =
    sensorState === "running" && status?.started_at
      ? (now.getTime() - new Date(status.started_at).getTime()) / 1000
      : null;

  const onStart = () => {
    void start.run(kind, { interface: iface || null, bpf_filter: bpf });
  };
  const error = (status?.error && !active ? status.error : null) ?? start.error ?? stop.error;

  return (
    <li className="sensor-row" data-state={shownState} aria-labelledby={`sensor-${kind}`}>
      <div className="sensor-name">
        <h4 id={`sensor-${kind}`}>{LABELS[kind]}</h4>
        <span className="hint">{blocked && !active ? feature?.reason : PURPOSE[kind]}</span>
      </div>
      <span className="sensor-leader" aria-hidden="true" />
      <StatusWord state={shownState}>{word}</StatusWord>
      <div className="sensor-figs" aria-label="Live figures">
        {status?.started_at ? (
          <>
            <span>
              <b>{formatNumber(status.packets)}</b> {PACKET_NOUN[kind]}
            </span>
            <span>
              <b>{formatNumber(status.events)}</b> found
            </span>
            <span>
              {uptime !== null ? (
                <b>{formatDuration(uptime)}</b>
              ) : (
                <>
                  ended <b>{formatTime(status.stopped_at)}</b>
                </>
              )}
            </span>
          </>
        ) : (
          <span className="sensor-none">no session yet</span>
        )}
      </div>
      <div className="sensor-iface">
        {active ? (
          <>
            <span className="flap" title="Interface">
              {status?.interface ?? defaultInterface ?? "default"}
            </span>
            {kind === "traffic" && status?.bpf_filter ? (
              <span className="flap" title="BPF filter">
                {status.bpf_filter}
              </span>
            ) : null}
          </>
        ) : (
          <>
            <label className="sr-only" htmlFor={`iface-${kind}`}>
              Interface for {LABELS[kind]}
            </label>
            <select
              id={`iface-${kind}`}
              className="select"
              value={iface}
              onChange={(e) => setIface(e.target.value)}
              disabled={!interfaces}
            >
              <option value="">{defaultInterface ? `Default (${defaultInterface})` : "Default interface"}</option>
              {interfaces?.map((i) => (
                <option key={i.name} value={i.name}>
                  {i.name}
                  {i.ip ? ` · ${i.ip}` : ""}
                </option>
              ))}
            </select>
            {kind === "traffic" ? (
              <>
                <label className="sr-only" htmlFor="bpf-filter">
                  BPF filter
                </label>
                <input
                  id="bpf-filter"
                  className="input mono"
                  placeholder="BPF filter (optional)"
                  value={bpf}
                  maxLength={256}
                  spellCheck={false}
                  autoComplete="off"
                  onChange={(e) => {
                    setBpf(e.target.value);
                    start.clearError();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onStart();
                  }}
                  aria-invalid={start.error?.code === "invalid_input" ? true : undefined}
                />
              </>
            ) : null}
          </>
        )}
      </div>
      <div className="sensor-action">
        {active ? (
          <button
            type="button"
            className="btn small danger"
            onClick={() => void stop.run(kind)}
            disabled={stop.pending || sensorState === "stopping"}
          >
            <Square size={13} aria-hidden="true" />
            {sensorState === "stopping" || stop.pending ? "Stopping" : "Stop"}
          </button>
        ) : (
          <button
            type="button"
            className="btn small"
            onClick={onStart}
            disabled={start.pending || blocked}
            title={blocked ? feature?.reason ?? undefined : undefined}
          >
            <Play size={13} aria-hidden="true" />
            {start.pending ? "Starting" : "Start"}
          </button>
        )}
      </div>
      {error ? (
        <div className="sensor-error-row">
          <ErrorNotice error={error} action={stop.error ? "Stop" : "Start"} />
        </div>
      ) : null}
    </li>
  );
}
