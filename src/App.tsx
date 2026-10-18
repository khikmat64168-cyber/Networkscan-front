import { Activity, FileText, Globe2, LayoutList, Lock, Network, Settings2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { BoardMark } from "./components/common";
import { formatClock } from "./format";
import { useCapabilities, useInterfaces, useNow } from "./hooks";
import { useApp } from "./state/AppState";
import { BoardView } from "./views/BoardView";
import { GeoView } from "./views/GeoView";
import { NetworkView } from "./views/NetworkView";
import { ReportsView } from "./views/ReportsView";
import { SystemView } from "./views/SystemView";
import { TlsView } from "./views/TlsView";
import { TokenGate } from "./views/TokenGate";
import { TrafficView } from "./views/TrafficView";

type ViewId = "board" | "traffic" | "network" | "tls" | "geoip" | "reports" | "system";

const NAV: { id: ViewId; label: string; icon: LucideIcon; title: string }[] = [
  { id: "board", label: "Board", icon: LayoutList, title: "Live board" },
  { id: "traffic", label: "Traffic", icon: Activity, title: "Traffic" },
  { id: "network", label: "Network", icon: Network, title: "Network" },
  { id: "tls", label: "TLS", icon: Lock, title: "TLS inspection" },
  { id: "geoip", label: "GeoIP", icon: Globe2, title: "GeoIP" },
  { id: "reports", label: "Reports", icon: FileText, title: "Reports" },
  { id: "system", label: "System", icon: Settings2, title: "System" },
];

function viewFromHash(): ViewId {
  const id = window.location.hash.replace(/^#\/?/, "");
  return (NAV.find((n) => n.id === id)?.id ?? "board") as ViewId;
}

export function App() {
  const { state, signIn } = useApp();
  if (state.auth !== "ok") {
    return <TokenGate rejected={state.auth === "rejected"} onSubmit={signIn} />;
  }
  return <Console />;
}

function Console() {
  const { state } = useApp();
  const [view, setView] = useState<ViewId>(viewFromHash);
  const interfaces = useInterfaces();
  const capabilities = useCapabilities();
  const now = useNow(1000);

  useEffect(() => {
    const onHash = () => setView(viewFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (id: ViewId) => {
    window.history.replaceState(null, "", `#/${id}`);
    setView(id);
  };

  const current = NAV.find((n) => n.id === view) ?? NAV[0]!;
  useEffect(() => {
    document.title = `${current.title} · NST`;
  }, [current.title]);

  const unread = state.events.filter((e) => !state.seen.has(e.id)).length;
  const capture = capabilities.data?.capture;
  const streamTone = state.stream === "live" ? "ok" : state.stream === "offline" || state.stream === "rejected" ? "bad" : "warn";
  const streamText =
    state.stream === "live" ? "Live" : state.stream === "connecting" ? "Connecting" : state.stream === "reconnecting" ? "Reconnecting" : "Offline";

  return (
    <div className="shell">
      <aside className="rail">
        <a className="wordmark" href="#/board" onClick={(e) => { e.preventDefault(); go("board"); }}>
          <BoardMark />
          <div>
            <strong>NST</strong>
            <span>Network Security Toolkit</span>
          </div>
        </a>
        <nav className="nav" aria-label="Sections">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" aria-current={view === item.id ? "page" : undefined} onClick={() => go(item.id)}>
                <Icon size={16} aria-hidden="true" />
                {item.label}
                {item.id === "board" && unread > 0 ? (
                  <span className="count" aria-label={`${unread} new findings`}>
                    {unread > 99 ? "99+" : unread}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
        <div className="rail-foot">Loopback only · token-protected</div>
      </aside>

      <header className="topbar">
        <h1>{current.title}</h1>
        <span className="clock num" aria-label="Local time">
          {formatClock(now)}
        </span>
        <span className="spacer" />
        <span className="pill" data-tone={streamTone} title="Live stream connection">
          <span className="dot" aria-hidden="true" />
          <span className="pill-text">{streamText}</span>
        </span>
        <span
          className="pill"
          data-tone={!capture ? undefined : capture.allowed ? "ok" : "bad"}
          title={capture?.message ?? "Checking capture permission"}
        >
          <span className="dot" aria-hidden="true" />
          <span className="pill-text">{!capture ? "Checking capture" : capture.allowed ? "Capture allowed" : "Capture blocked"}</span>
        </span>
      </header>

      <main className="main" id="main">
        {view === "board" ? (
          <BoardView
            interfaces={interfaces.data?.interfaces ?? null}
            defaultInterface={interfaces.data?.default ?? null}
            capabilities={capabilities.data}
          />
        ) : view === "traffic" ? (
          <TrafficView onGoToBoard={() => go("board")} defaultInterface={interfaces.data?.default ?? null} />
        ) : view === "network" ? (
          <NetworkView onGoToBoard={() => go("board")} defaultInterface={interfaces.data?.default ?? null} />
        ) : view === "tls" ? (
          <TlsView />
        ) : view === "geoip" ? (
          <GeoView />
        ) : view === "reports" ? (
          <ReportsView />
        ) : (
          <SystemView capabilities={capabilities} />
        )}
      </main>
    </div>
  );
}
