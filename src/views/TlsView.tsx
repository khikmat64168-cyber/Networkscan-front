import { ArrowRight, CheckCircle2, ScanSearch } from "lucide-react";
import { useState } from "react";

import { api } from "../api/client";
import type { ModeInfo, TlsResult } from "../api/types";
import { Empty, ErrorNotice, SeverityTag } from "../components/common";
import { usePerforation } from "../components/Pass";
import { DASH, formatDateTime } from "../format";
import { useAction } from "../hooks";

export function parseHosts(text: string): string[] {
  return text
    .split(/[\s,]+/)
    .map((h) => h.trim())
    .filter(Boolean);
}

export function TlsView({ limits }: { limits?: ModeInfo["limits"] }) {
  const [hosts, setHosts] = useState("");
  const maxTimeout = limits?.tls_timeout_max ?? 15;
  const maxHosts = limits?.tls_hosts_per_request ?? 10;
  const [timeout, setTimeoutValue] = useState(Math.min(10, maxTimeout));
  const [results, setResults] = useState<TlsResult[] | null>(null);
  const scan = useAction(async (list: string[], t: number) =>
    api<{ results: TlsResult[] }>("/api/tls/scan", { method: "POST", body: { hosts: list, timeout: t } }),
  );

  const list = parseHosts(hosts);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await scan.run(list, timeout);
    if (result) setResults(result.results);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>TLS inspection</h2>
          <p>
            Connect to each host, read its certificate and negotiated cipher, and check expiry, self-signing, hostname match,
            protocol version, cipher strength and key size. Certificates are inspected even when invalid.
          </p>
        </div>
      </div>
      <section className="panel">
        <form className="panel-body" onSubmit={(e) => void submit(e)}>
          <div className="form-row">
            <div className="field grow">
              <label className="label" htmlFor="tls-hosts">
                Hosts
              </label>
              <input
                id="tls-hosts"
                className="input mono"
                placeholder="github.com, example.com:8443"
                value={hosts}
                spellCheck={false}
                autoComplete="off"
                onChange={(e) => setHosts(e.target.value)}
                aria-invalid={scan.error?.code === "invalid_input" ? true : undefined}
                aria-describedby="tls-hint"
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="tls-timeout">
                Timeout (s)
              </label>
              <input
                id="tls-timeout"
                className="input mono"
                type="number"
                min={1}
                max={maxTimeout}
                value={timeout}
                onChange={(e) => setTimeoutValue(Number(e.target.value))}
                style={{ width: 96 }}
              />
            </div>
            <button type="submit" className="btn primary" disabled={!list.length || scan.pending}>
              <ScanSearch size={14} aria-hidden="true" />
              {scan.pending ? `Scanning ${list.length}…` : "Scan"}
            </button>
          </div>
          <p className="hint" id="tls-hint" style={{ marginTop: 8 }}>
            Up to {maxHosts} hosts, separated by commas or spaces. Port 443 unless given as host:port. Hosts are scanned in
            parallel.
            {limits
              ? ` Public demo: public hosts only, ${limits.tls_hosts_per_minute} hosts per minute, ports ${limits.tls_ports.join(", ")}.`
              : ""}
          </p>
          {scan.error ? (
            <div style={{ marginTop: 12 }}>
              <ErrorNotice error={scan.error} action="Scan" />
            </div>
          ) : null}
        </form>
      </section>

      {results === null ? (
        scan.pending ? null : (
          <section className="panel">
            <Empty title="No scans yet">Results appear here as passes, one per host, with every issue the checker found.</Empty>
          </section>
        )
      ) : (
        <div className="tls-list">
          {results.map((r) => (
            <TlsPass key={`${r.host}:${r.port}`} result={r} />
          ))}
        </div>
      )}
    </div>
  );
}

export function explainTlsError(error: string): string {
  if (/nodename nor servname|Name or service not known|getaddrinfo failed|No address associated/i.test(error)) {
    return `The host name could not be resolved (DNS lookup failed). Details: ${error}`;
  }
  if (/Network is unreachable|No route to host/i.test(error)) {
    return `The host is not reachable from this machine. Details: ${error}`;
  }
  return error;
}

function TlsPass({ result }: { result: TlsResult }) {
  const critical = Boolean(result.error) || result.issues.some((i) => i.severity === "critical");
  const [passRef, perfRef, perfStyle] = usePerforation();
  return (
    <article ref={passRef} className="pass notched" style={perfStyle}>
      <header className="pass-head" data-sev={critical ? "critical" : undefined}>
        <span className="board-type">
          {result.error ? "Unreachable" : result.issues.length ? `${result.issues.length} issue${result.issues.length > 1 ? "s" : ""}` : "Secure"}
        </span>
        <span className="board-type">{result.port}</span>
      </header>
      <h3 className="pass-title mono" style={{ overflowWrap: "anywhere" }}>
        {result.host}
      </h3>
      {result.error ? (
        <div className="pass-evidence">
          <p style={{ fontSize: "var(--fs-13)" }}>{explainTlsError(result.error)}</p>
        </div>
      ) : (
        <>
          <div className="pass-route">
            <div className="end">
              <small>Valid from</small>
              <b style={{ fontSize: "var(--fs-16)" }}>{result.not_before ? formatDateTime(result.not_before).split(" ").slice(0, 3).join(" ") : DASH}</b>
            </div>
            <ArrowRight size={18} aria-hidden="true" />
            <div className="end">
              <small>Expires</small>
              <b style={{ fontSize: "var(--fs-16)", color: (result.days_until_expiry ?? 99) <= 30 ? "#b42318" : undefined }}>
                {result.days_until_expiry === null
                  ? DASH
                  : result.days_until_expiry < 0
                    ? `Expired ${-result.days_until_expiry}d ago`
                    : `${result.days_until_expiry} days`}
              </b>
            </div>
          </div>
          <div ref={perfRef} className="perforation" aria-hidden="true" />
          <div className="pass-segs">
            <div className="pass-seg">
              <small>Protocol</small>
              <span className="mono">{result.tls_version ?? DASH}</span>
            </div>
            <div className="pass-seg">
              <small>Key</small>
              <span className="mono">
                {result.public_key_type ? `${result.public_key_type} ${result.public_key_bits ?? ""}` : DASH}
              </span>
            </div>
            <div className="pass-seg wide">
              <small>Cipher</small>
              <span className="mono">
                {result.cipher_suite ?? DASH}
                {result.cipher_bits ? ` · ${result.cipher_bits}-bit` : ""}
              </span>
            </div>
            <div className="pass-seg wide">
              <small>Subject</small>
              <span className="mono">{result.subject ?? DASH}</span>
            </div>
            <div className="pass-seg wide">
              <small>Issuer</small>
              <span className="mono">{result.issuer ?? DASH}</span>
            </div>
            <div className="pass-seg wide">
              <small>Names (SAN)</small>
              <span className="mono">{result.san.length ? result.san.slice(0, 6).join(", ") + (result.san.length > 6 ? ` +${result.san.length - 6}` : "") : DASH}</span>
            </div>
          </div>
          <div style={{ height: 14 }} />
          {result.issues.length ? (
            <ul className="issue-list">
              {result.issues.map((i, idx) => (
                <li key={idx}>
                  <SeverityTag severity={i.severity} />
                  <span>{i.detail}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ok-line">
              <CheckCircle2 size={16} aria-hidden="true" />
              No issues found by the checker
            </p>
          )}
        </>
      )}
    </article>
  );
}
