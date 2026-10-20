// Landing view of the public demo: what NST is, what this demo can do,
// what only a local install can do, and how to get it.  Every statement
// here is a fact about the software; nothing is a claimed result.

import { ArrowRight, Download, Globe2, Lock } from "lucide-react";

import type { ModeInfo } from "../api/types";

const BACKEND_REPO = "https://github.com/khikmat64168-cyber/network-security-toolkit";
const FRONTEND_REPO = "https://github.com/khikmat64168-cyber/Networkscan-front";

/**
 * The release wheel of the server's own version.  It bundles this console;
 * the package is not on PyPI, and a plain checkout has no built frontend.
 */
export function wheelUrl(version: string): string {
  return `${BACKEND_REPO}/releases/download/v${version}/network_security_toolkit-${version}-py3-none-any.whl`;
}

const LOCAL_ONLY = [
  { name: "Traffic analyzer", what: "Protocol mix, top talkers and ports, plaintext credentials, port scans, DNS tunneling." },
  { name: "ARP spoofing detector", what: "IP → MAC bindings, gateway MAC changes, gratuitous ARP, combined MITM signals." },
  { name: "DNS spoofing detector", what: "Answer changes, unsolicited responses, zero-TTL answers, domains with several IPs." },
  { name: "MAC flooding detector", what: "Bursts of new source MACs that indicate a CAM table overflow attack." },
  { name: "HTML reports", what: "Self-contained security reports with TLS findings and network interfaces." },
];

export function AboutView({ mode, onOpen }: { mode: ModeInfo; onOpen: (view: "tls" | "geoip") => void }) {
  const limits = mode.limits;
  return (
    <div className="page about">
      <section className="about-hero">
        <h2>Network Security Toolkit</h2>
        <p>
          A Python toolkit that watches a local network for attacks — ARP spoofing, DNS spoofing, MAC flooding, plaintext
          credentials — and audits TLS endpoints, with a live web console. This is its public demo: the parts that are
          safe to run on a shared server.
        </p>
        <div className="about-actions">
          <button type="button" className="btn primary" onClick={() => onOpen("tls")}>
            <Lock size={14} aria-hidden="true" />
            Inspect a TLS certificate
          </button>
          <button type="button" className="btn" onClick={() => onOpen("geoip")}>
            <Globe2 size={14} aria-hidden="true" />
            Look up an IP
          </button>
        </div>
      </section>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h3>In this demo</h3>
          </div>
          <div className="panel-body about-list">
            <div>
              <strong>TLS inspection</strong>
              <p>
                Expiry, self-signed certificates, hostname mismatch, weak protocol versions and ciphers, weak keys.
                {limits
                  ? ` Up to ${limits.tls_hosts_per_request} public hosts per scan, ${limits.tls_hosts_per_minute} per minute, on TLS ports (${limits.tls_ports.join(", ")}).`
                  : ""}
              </p>
            </div>
            <div>
              <strong>GeoIP</strong>
              <p>
                Country, region and network operator for public addresses
                {limits ? `, up to ${limits.geoip_targets_per_minute} lookups per minute` : ""}. Lookups go to
                ip-api.com over plain HTTP.
              </p>
            </div>
            <div>
              <strong>Nothing is stored</strong>
              <p>Scan results are returned to your browser and not kept on the server.</p>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Only in a local install</h3>
          </div>
          <div className="panel-body about-list">
            {LOCAL_ONLY.map((item) => (
              <div key={item.name}>
                <strong>{item.name}</strong>
                <p>{item.what}</p>
              </div>
            ))}
            <p className="hint">
              Packet capture only makes sense on the network you want to watch, and needs capture privileges there — so
              these run on your machine, not on a public server.
            </p>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h3>Run it yourself</h3>
        </div>
        <div className="panel-body about-install">
          <pre className="code-block">
            <code>{`python3 -m venv nst-env
nst-env/bin/pip install "network-security-toolkit[web] @ ${wheelUrl(mode.version)}"
sudo nst-env/bin/nst web`}</code>
          </pre>
          <div className="about-links">
            <a href={BACKEND_REPO} target="_blank" rel="noreferrer noopener">
              <Download size={14} aria-hidden="true" />
              network-security-toolkit (Python, CLI, backend)
              <ArrowRight size={14} aria-hidden="true" />
            </a>
            <a href={FRONTEND_REPO} target="_blank" rel="noreferrer noopener">
              <Download size={14} aria-hidden="true" />
              Networkscan-front (this web console)
              <ArrowRight size={14} aria-hidden="true" />
            </a>
            <p className="hint">
              Python 3.12+. <code>nst web</code> opens your browser on its own one-time link: there is no account, and no
              token to ask anyone for.
            </p>
            <p className="hint">Version {mode.version}. Use it only on networks you own or are authorised to test.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
