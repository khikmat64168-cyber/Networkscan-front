// Shown in the public demo for features that need packet capture or
// stored data.  The feature is named and explained, never faked.

import { Empty } from "../components/common";

const FEATURES = {
  board: {
    title: "Live findings board",
    body: "Starts the traffic, ARP, DNS and MAC sensors and streams their findings as they happen.",
  },
  traffic: {
    title: "Traffic statistics",
    body: "Packet rate, protocol mix, top talkers and ports, and recent packets from a live capture.",
  },
  network: {
    title: "Detector tables",
    body: "ARP bindings, DNS resolutions and source MACs observed by the running detectors.",
  },
  reports: {
    title: "HTML reports",
    body: "Builds and stores self-contained security reports.",
  },
} as const;

export type LocalOnlyFeature = keyof typeof FEATURES;

export function LocalOnlyView({ feature, onAbout }: { feature: LocalOnlyFeature; onAbout: () => void }) {
  const f = FEATURES[feature];
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>{f.title}</h2>
          <p>{f.body}</p>
        </div>
      </div>
      <section className="panel">
        <Empty
          title="Available in a local install, not in this public demo"
          action={
            <button type="button" className="btn" onClick={onAbout}>
              How to run NST locally
            </button>
          }
        >
          This needs packet capture on the network being watched, so it runs on your own machine with <code>nst web</code>. A public
          server would only see its own traffic — and capture controls do not belong on the open internet.
        </Empty>
      </section>
    </div>
  );
}
