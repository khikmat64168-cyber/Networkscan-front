import { MapPin } from "lucide-react";
import { useState } from "react";

import { api } from "../api/client";
import type { GeoResult, ModeInfo } from "../api/types";
import { Empty, ErrorNotice, Notice } from "../components/common";
import { DASH } from "../format";
import { useAction } from "../hooks";
import { parseHosts } from "./TlsView";

export function GeoView({ limits }: { limits?: ModeInfo["limits"] }) {
  const [targets, setTargets] = useState("");
  const [results, setResults] = useState<GeoResult[] | null>(null);
  const lookup = useAction(async (list: string[]) =>
    api<{ results: GeoResult[] }>("/api/geoip", { method: "POST", body: { targets: list } }),
  );
  const list = parseHosts(targets);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await lookup.run(list);
    if (result) setResults(result.results);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>GeoIP</h2>
          <p>Country, region and network operator for public IP addresses and hostnames.</p>
        </div>
      </div>
      <Notice tone="warn" title="Lookups leave this machine">
        Public addresses are sent to ip-api.com over plain HTTP (its free tier has no HTTPS). Private, loopback and
        link-local addresses are answered locally and never sent.
      </Notice>
      <section className="panel">
        <form className="panel-body" onSubmit={(e) => void submit(e)}>
          <div className="form-row">
            <div className="field grow">
              <label className="label" htmlFor="geo-targets">
                IP addresses or hostnames
              </label>
              <input
                id="geo-targets"
                className="input mono"
                placeholder="8.8.8.8, github.com"
                value={targets}
                spellCheck={false}
                autoComplete="off"
                onChange={(e) => setTargets(e.target.value)}
                aria-invalid={lookup.error?.code === "invalid_input" ? true : undefined}
              />
            </div>
            <button type="submit" className="btn primary" disabled={!list.length || lookup.pending}>
              <MapPin size={14} aria-hidden="true" />
              {lookup.pending ? "Looking up…" : "Look up"}
            </button>
          </div>
          <p className="hint" style={{ marginTop: 8 }}>
            Up to 20 targets
            {limits ? ` (${limits.geoip_targets_per_minute} per minute in the public demo)` : ""}. Successful answers are
            cached for the life of the server; failures are retried next time.
          </p>
          {lookup.error ? (
            <div style={{ marginTop: 12 }}>
              <ErrorNotice error={lookup.error} action="Lookup" />
            </div>
          ) : null}
        </form>
      </section>

      <section className="panel">
        {results === null ? (
          <Empty title="No lookups yet" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Target</th>
                  <th>Country</th>
                  <th>Region / city</th>
                  <th>Network operator</th>
                  <th>Coordinates</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.target}>
                    <td className="mono">{r.target}</td>
                    <td>
                      {r.is_private ? (
                        "Private range"
                      ) : r.country ? (
                        <>
                          <span className="flap" style={{ marginRight: 8 }}>
                            {r.country_code ?? "??"}
                          </span>
                          {r.country}
                        </>
                      ) : (
                        DASH
                      )}
                    </td>
                    <td>{[r.region, r.city].filter(Boolean).join(" · ") || DASH}</td>
                    <td>{r.isp ?? DASH}</td>
                    <td className="mono">
                      {r.latitude !== null && r.longitude !== null ? `${r.latitude.toFixed(3)}, ${r.longitude.toFixed(3)}` : DASH}
                    </td>
                    <td>
                      {r.success ? (
                        <span className="status" data-state="operational">
                          {r.is_private ? "Local" : "OK"}
                        </span>
                      ) : (
                        <span className="status" data-state="error" title={r.error ?? undefined}>
                          Failed{r.error ? `: ${r.error}` : ""}
                        </span>
                      )}
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
