import { RefreshCw } from "lucide-react";

import type { AppConfigView, Capabilities, Health } from "../api/types";
import { ErrorNotice, Notice, SkeletonRows, StatusWord } from "../components/common";
import { DASH } from "../format";
import { useApiGet } from "../hooks";

export function SystemView({
  capabilities,
  isPublic,
}: {
  capabilities: { data: Capabilities | null; reload: () => void; loading: boolean; error: { code: string; message: string } | null };
  isPublic: boolean;
}) {
  const health = useApiGet<Health>("/api/health");
  // The public demo does not expose host configuration.
  const config = useApiGet<AppConfigView>(isPublic ? null : "/api/config");
  const caps = capabilities.data;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>System</h2>
          <p>What this NST instance can do right now, and the configuration it runs with.</p>
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn"
            onClick={() => {
              capabilities.reload();
              health.reload();
            }}
            disabled={capabilities.loading}
          >
            <RefreshCw size={14} aria-hidden="true" />
            Re-check
          </button>
        </div>
      </div>

      {caps && !caps.capture.allowed ? (
        <Notice tone="bad" title="Packet capture is blocked">
          {caps.capture.message}
        </Notice>
      ) : null}

      <section className="panel">
        <div className="panel-head">
          <h3>Capabilities</h3>
          <span className="meta">capture is tested by opening a real capture socket, not assumed from the user id</span>
        </div>
        {capabilities.error ? (
          <div className="panel-body">
            <ErrorNotice error={capabilities.error} />
          </div>
        ) : !caps ? (
          <SkeletonRows />
        ) : (
          <div>
            {caps.features.map((f) => (
              <div className="feature-row" key={f.id}>
                <strong>{f.label}</strong>
                <StatusWord state={f.status} />
                <p>{f.reason ?? (f.requires === "capture" ? "Capture socket opened successfully." : "Available.")}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h3>Instance</h3>
          </div>
          <div className="panel-body">
            {health.error ? (
              <ErrorNotice error={health.error} />
            ) : !health.data ? (
              <SkeletonRows rows={3} />
            ) : (
              <dl className="kv">
                <dt>NST version</dt>
                <dd className="mono">{health.data.version}</dd>
                <dt>Mode</dt>
                <dd>{health.data.mode === "public" ? "Public demo" : health.data.mode === "console" ? "Private console" : "Local"}</dd>
                {health.data.platform !== undefined ? (
                  <>
                    <dt>Platform</dt>
                    <dd>{health.data.platform}</dd>
                    <dt>Python</dt>
                    <dd className="mono">{health.data.python}</dd>
                    <dt>Running as root</dt>
                    <dd>{health.data.running_as_root ? "Yes" : "No"}</dd>
                  </>
                ) : null}
                <dt>Listening on</dt>
                <dd className="mono">
                  {window.location.host}
                  {health.data.mode === "local" ? " (loopback only)" : " (behind the reverse proxy)"}
                </dd>
              </dl>
            )}
          </div>
        </section>
        {isPublic ? null : (
        <section className="panel">
          <div className="panel-head">
            <h3>Configuration</h3>
          </div>
          <div className="panel-body">
            {config.error ? (
              <ErrorNotice error={config.error} />
            ) : !config.data ? (
              <SkeletonRows rows={5} />
            ) : (
              <dl className="kv">
                <dt>Credential detection</dt>
                <dd>{config.data.analyzer.detect_credentials ? "On" : "Off"}</dd>
                <dt>Port-scan threshold</dt>
                <dd className="mono">{config.data.analyzer.port_scan_threshold} ports</dd>
                <dt>Gateway IP</dt>
                <dd className="mono">{config.data.arp_detector.gateway_ip ?? "not set"}</dd>
                <dt>Trusted IPs</dt>
                <dd className="mono">{config.data.arp_detector.trusted_ips.join(", ") || DASH}</dd>
                <dt>Trusted domains</dt>
                <dd className="mono">{config.data.dns_detector.trusted_domains.join(", ") || DASH}</dd>
                <dt>MAC flood threshold</dt>
                <dd className="mono">
                  {config.data.mac_detector.flood_threshold} new / {config.data.mac_detector.window_secs}s
                </dd>
                <dt>Log file</dt>
                <dd className="mono">{config.data.logging.file}</dd>
                <dt>Reports folder</dt>
                <dd className="mono">{config.data.reports_dir}</dd>
              </dl>
            )}
          </div>
        </section>
        )}
      </div>
    </div>
  );
}
