import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

import type { Severity } from "../api/types";

export function SeverityTag({ severity }: { severity: Severity }) {
  return (
    <span className="sev" data-sev={severity}>
      {severity === "medium" ? "med" : severity}
    </span>
  );
}

export function StatusWord({ state, children }: { state: string; children?: ReactNode }) {
  return (
    <span className="status" data-state={state}>
      {children ?? state}
    </span>
  );
}

export function Notice({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warn" | "bad";
  title: ReactNode;
  children?: ReactNode;
}) {
  const Icon = tone === "bad" ? ShieldAlert : tone === "warn" ? AlertTriangle : Info;
  return (
    <div className="notice" data-tone={tone} role={tone === "bad" ? "alert" : "status"}>
      <Icon size={16} strokeWidth={2} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        {children ? <p>{children}</p> : null}
      </div>
    </div>
  );
}

/** Explains an API error, adding the fix for the codes the backend defines. */
export function ErrorNotice({ error, action }: { error: { code: string; message: string }; action?: string }) {
  const titles: Record<string, string> = {
    permission_denied: "Capture permission denied",
    interface_error: "Interface unavailable",
    capture_unavailable: "Capture backend unavailable",
    capture_failed: "Capture failed",
    invalid_input: "Check the input",
    already_running: "Already running",
    backend_unreachable: "Backend unreachable",
    unauthorized: "Access token rejected",
    not_found: "Not found",
  };
  return (
    <Notice tone={error.code === "invalid_input" || error.code === "already_running" ? "warn" : "bad"} title={titles[error.code] ?? (action ? `${action} failed` : "Request failed")}>
      {error.message}
    </Notice>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <h4>{title}</h4>
      {children ? <p>{children}</p> : null}
      {action}
    </div>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ display: "grid", gap: 14, padding: 16 }} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <span key={i} className="skeleton" style={{ width: `${88 - i * 9}%` }} />
      ))}
    </div>
  );
}

export function BoardMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <g fill="#E6E8EB">
        <rect x="4" y="7" width="5" height="4" />
        <rect x="11" y="7" width="17" height="4" />
        <rect x="4" y="14" width="5" height="4" />
        <rect x="11" y="14" width="17" height="4" />
        <rect x="4" y="21" width="5" height="4" />
      </g>
      <rect x="11" y="21" width="17" height="4" fill="#FFD400" />
    </svg>
  );
}
