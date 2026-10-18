import { Download, FileText, X } from "lucide-react";
import { useState } from "react";

import { api, describeError, fetchReportHtml } from "../api/client";
import type { ReportCreated, ReportItem } from "../api/types";
import { Empty, ErrorNotice, Notice, SkeletonRows } from "../components/common";
import { formatBytes, formatDateTime } from "../format";
import { useAction, useApiGet } from "../hooks";
import { parseHosts } from "./TlsView";

export function ReportsView() {
  const list = useApiGet<{ reports: ReportItem[]; directory: string }>("/api/reports");
  const [hosts, setHosts] = useState("");
  const [includeInterfaces, setIncludeInterfaces] = useState(true);
  const [geo, setGeo] = useState(false);
  const [created, setCreated] = useState<ReportCreated | null>(null);
  const [viewing, setViewing] = useState<{ name: string; html: string } | null>(null);
  const [viewError, setViewError] = useState<{ code: string; message: string } | null>(null);

  const tlsHosts = parseHosts(hosts);
  const generate = useAction(async () =>
    api<ReportCreated>("/api/reports", {
      method: "POST",
      body: { tls_hosts: tlsHosts, include_interfaces: includeInterfaces, geo: geo && tlsHosts.length > 0 },
    }),
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await generate.run();
    if (result) {
      setCreated(result);
      list.reload();
      void open(result.report.name);
    }
  };

  const open = async (name: string) => {
    setViewError(null);
    try {
      setViewing({ name, html: await fetchReportHtml(name) });
    } catch (err) {
      setViewError(describeError(err));
    }
  };

  const download = () => {
    if (!viewing) return;
    const url = URL.createObjectURL(new Blob([viewing.html], { type: "text/html" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = viewing.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Reports</h2>
          <p>Self-contained HTML security reports built by the same generator as <code>nst report</code>.</p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h3>New report</h3>
        </div>
        <form className="panel-body" onSubmit={(e) => void submit(e)} style={{ display: "grid", gap: 14 }}>
          <div className="field">
            <label className="label" htmlFor="report-hosts">
              TLS hosts (optional)
            </label>
            <input
              id="report-hosts"
              className="input mono"
              placeholder="github.com, example.com:8443"
              value={hosts}
              spellCheck={false}
              autoComplete="off"
              onChange={(e) => setHosts(e.target.value)}
            />
          </div>
          <div className="form-row" style={{ alignItems: "center" }}>
            <label className="check">
              <input type="checkbox" checked={includeInterfaces} onChange={(e) => setIncludeInterfaces(e.target.checked)} />
              Include network interfaces
            </label>
            <label className="check" title={tlsHosts.length ? undefined : "Needs at least one TLS host"}>
              <input type="checkbox" checked={geo} disabled={!tlsHosts.length} onChange={(e) => setGeo(e.target.checked)} />
              Add country and network operator for TLS hosts (sends their IPs to ip-api.com)
            </label>
            <span style={{ flex: 1 }} />
            <button
              type="submit"
              className="btn primary"
              disabled={generate.pending || (!tlsHosts.length && !includeInterfaces)}
            >
              <FileText size={14} aria-hidden="true" />
              {generate.pending ? (tlsHosts.length ? "Scanning and writing…" : "Writing…") : "Generate report"}
            </button>
          </div>
          {generate.error ? <ErrorNotice error={generate.error} action="Report" /> : null}
          {created && !generate.error ? (
            <Notice tone={created.summary.critical ? "bad" : "info"} title={`Saved ${created.report.name}`}>
              {created.summary.tls_hosts} TLS host(s), {created.summary.interfaces} interface(s)
              {created.summary.critical ? `, ${created.summary.critical} with critical issues` : ", no critical TLS issues"}.
            </Notice>
          ) : null}
        </form>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Saved reports</h3>
          <span className="meta mono">{list.data?.directory ?? ""}</span>
        </div>
        {list.error ? (
          <div className="panel-body">
            <ErrorNotice error={list.error} />
          </div>
        ) : list.loading && !list.data ? (
          <SkeletonRows rows={3} />
        ) : !list.data?.reports.length ? (
          <Empty title="No reports yet">Reports generated here are saved in your NST state directory and listed below.</Empty>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Report</th>
                <th>Created</th>
                <th className="r">Size</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.data.reports.map((r) => (
                <tr key={r.name}>
                  <td className="mono">{r.name}</td>
                  <td className="mono">{formatDateTime(r.created_at)}</td>
                  <td className="mono r">{formatBytes(r.size)}</td>
                  <td className="r">
                    <button type="button" className="btn small" onClick={() => void open(r.name)} aria-label={`Open ${r.name}`}>
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {viewError ? <ErrorNotice error={viewError} action="Opening the report" /> : null}
      {viewing ? (
        <section className="panel" aria-label={`Report ${viewing.name}`}>
          <div className="panel-head">
            <h3>{viewing.name}</h3>
            <div className="tools">
              <button type="button" className="btn small" onClick={download}>
                <Download size={13} aria-hidden="true" />
                Download
              </button>
              <button type="button" className="btn small ghost" onClick={() => setViewing(null)} aria-label="Close report">
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
          {/* Sandboxed with no permissions: the report gets no scripts, forms or network. */}
          <iframe className="report-frame" title={viewing.name} sandbox="" srcDoc={viewing.html} />
        </section>
      ) : null}
    </div>
  );
}
