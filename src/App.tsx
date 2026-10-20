import { Activity, FileText, Globe2, Info, LayoutList, Lock, Network, RefreshCw, Settings2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { ModeInfo, NetworkInterface } from "./api/types";
import { BoardMark, Notice } from "./components/common";
import { formatClock } from "./format";
import { useApiGet, useCapabilities, useNow } from "./hooks";
import { useApp } from "./state/AppState";
import { AboutView } from "./views/AboutView";
import { BoardView } from "./views/BoardView";
import { GeoView } from "./views/GeoView";
import { LocalOnlyView } from "./views/LocalOnlyView";
import { NetworkView } from "./views/NetworkView";
import { ReportsView } from "./views/ReportsView";
import { SystemView } from "./views/SystemView";
import { TlsView } from "./views/TlsView";
import { TokenGate } from "./views/TokenGate";
import { TrafficView } from "./views/TrafficView";

type ViewId = "about" | "board" | "traffic" | "network" | "tls" | "geoip" | "reports" | "system";

interface NavItem {
  id: ViewId;
  label: string;
  icon: LucideIcon;
  title: string;
  /** Needs capture or stored data: replaced by an explanation in the public demo. */
  local?: boolean;
  publicOnly?: boolean;
}

const NAV: NavItem[] = [
  { id: "about", label: "About", icon: Info, title: "About", publicOnly: true },
  { id: "board", label: "Board", icon: LayoutList, title: "Live board", local: true },
  { id: "traffic", label: "Traffic", icon: Activity, title: "Traffic", local: true },
  { id: "network", label: "Network", icon: Network, title: "Network", local: true },
  { id: "tls", label: "TLS", icon: Lock, title: "TLS inspection" },
  { id: "geoip", label: "GeoIP", icon: Globe2, title: "GeoIP" },
  { id: "reports", label: "Reports", icon: FileText, title: "Reports", local: true },
  { id: "system", label: "System", icon: Settings2, title: "System" },
];

function navFor(isPublic: boolean): NavItem[] {
  return NAV.filter((n) => isPublic || !n.publicOnly);
}

function viewFromHash(items: NavItem[], fallback: ViewId): ViewId {
  const id = window.location.hash.replace(/^#\/?/, "");
  return items.find((n) => n.id === id)?.id ?? fallback;
}

export function App() {
  const { state, signIn, retryMode } = useApp();
  if (state.modeError) {
    return (
      <main className="gate">
        <div className="gate-card">
          <BoardMark size={40} />
          <Notice tone="bad" title="Cannot reach the NST backend">
            {state.modeError.message}
          </Notice>
          <button type="button" className="btn" onClick={retryMode} style={{ justifySelf: "start" }}>
            <RefreshCw size={14} aria-hidden="true" />
            Try again
          </button>
        </div>
      </main>
    );
  }
  if (!state.mode) {
    return (
      <main className="gate" aria-busy="true">
        <div className="gate-card">
          <BoardMark size={40} />
          <span className="skeleton" style={{ width: "60%" }} />
        </div>
      </main>
    );
  }
  if (state.auth !== "ok") {
    return <TokenGate rejected={state.auth === "rejected"} onSubmit={signIn} />;
  }
  return <Console mode={state.mode} />;
}

function Console({ mode }: { mode: ModeInfo }) {
  const { state } = useApp();
  const isPublic = mode.mode === "public";
  const items = useMemo(() => navFor(isPublic), [isPublic]);
  const fallback: ViewId = isPublic ? "about" : "board";
  const [view, setView] = useState<ViewId>(() => viewFromHash(items, fallback));
  const interfaces = useApiGet<{ default: string | null; interfaces: NetworkInterface[] }>(
    isPublic ? null : "/api/interfaces",
  );
  const capabilities = useCapabilities();
  const now = useNow(1000);

  useEffect(() => {
    const onHash = () => setView(viewFromHash(items, fallback));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [items, fallback]);

  const go = (id: ViewId) => {
    window.history.replaceState(null, "", `#/${id}`);
    setView(id);
  };

  const current = items.find((n) => n.id === view) ?? items[0]!;
  useEffect(() => {
    document.title = `${current.title} · NST`;
  }, [current.title]);

  const unread = state.events.filter((e) => !state.seen.has(e.id)).length;
  const capture = capabilities.data?.capture;
  const streamTone = state.stream === "live" ? "ok" : state.stream === "offline" || state.stream === "rejected" ? "bad" : "warn";
  const streamText =
    state.stream === "live" ? "Live" : state.stream === "connecting" ? "Connecting" : state.stream === "reconnecting" ? "Reconnecting" : "Offline";
  const defaultInterface = interfaces.data?.default ?? null;

  const body = (() => {
    if (isPublic && current.local) {
      return <LocalOnlyView feature={current.id as "board" | "traffic" | "network" | "reports"} onAbout={() => go("about")} />;
    }
    switch (current.id) {
      case "about":
        return <AboutView mode={mode} onOpen={go} />;
      case "board":
        return (
          <BoardView
            interfaces={interfaces.data?.interfaces ?? null}
            defaultInterface={defaultInterface}
            capabilities={capabilities.data}
          />
        );
      case "traffic":
        return <TrafficView onGoToBoard={() => go("board")} defaultInterface={defaultInterface} />;
      case "network":
        return <NetworkView onGoToBoard={() => go("board")} defaultInterface={defaultInterface} />;
      case "tls":
        return <TlsView limits={mode.limits} />;
      case "geoip":
        return <GeoView limits={mode.limits} />;
      case "reports":
        return <ReportsView />;
      case "system":
        return <SystemView capabilities={capabilities} isPublic={isPublic} />;
    }
  })();

  return (
    <div className="shell">
      <aside className="rail">
        <a className="wordmark" href={`#/${fallback}`} onClick={(e) => { e.preventDefault(); go(fallback); }}>
          <BoardMark />
          <div>
            <strong>NST</strong>
            <span>Network Security Toolkit</span>
          </div>
        </a>
        <nav className="nav" aria-label="Sections">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" aria-current={view === item.id ? "page" : undefined} onClick={() => go(item.id)}>
                <Icon size={16} aria-hidden="true" />
                {item.label}
                {isPublic && item.local ? <span className="nav-tag">local</span> : null}
                {item.id === "board" && unread > 0 ? (
                  <span className="count" aria-label={`${unread} new findings`}>
                    {unread > 99 ? "99+" : unread}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
        <div className="rail-foot">
          {isPublic ? "Public demo · rate-limited · nothing stored" : mode.mode === "console" ? "Private console · token-protected" : "Loopback only · token-protected"}
        </div>
      </aside>

      <header className="topbar">
        <h1>{current.title}</h1>
        <span className="clock num" aria-label="Local time">
          {formatClock(now)}
        </span>
        <span className="spacer" />
        {isPublic ? (
          <span className="pill" data-tone="warn" title="Capture, detectors and reports run in a local install">
            <span className="dot" aria-hidden="true" />
            <span className="pill-text">Public demo</span>
          </span>
        ) : (
          <>
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
          </>
        )}
      </header>

      <main className="main" id="main">
        {body}
      </main>
    </div>
  );
}
