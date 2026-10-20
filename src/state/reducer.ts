// Pure application state: everything the console shows comes from the
// backend through these transitions.  Nothing here invents data.

import type { StreamStatus } from "../api/stream";
import type { ModeInfo, SecurityEvent, SensorKind, SensorStatus, Severity, TrafficDetails } from "../api/types";

export const MAX_EVENTS = 2000;

export type AuthState = "ok" | "missing" | "rejected";

export interface State {
  auth: AuthState;
  /** What the server is (local / console / public); null until /api/mode answered. */
  mode: ModeInfo | null;
  modeError: { code: string; message: string } | null;
  /** Server run the cached history belongs to; a change resets the history. */
  instanceId: string | null;
  stream: StreamStatus;
  /** Newest first. */
  events: SecurityEvent[];
  lastSeq: number;
  /** Server-wide counts per severity since `nst web` started (not capped). */
  counts: Partial<Record<Severity, number>>;
  /** Event ids the operator has opened.  Anything else is lit as new. */
  seen: Set<string>;
  /** Ids that arrived over the live stream during this page session. */
  live: Set<string>;
  sensors: Partial<Record<SensorKind, SensorStatus>>;
  traffic: TrafficDetails | null;
  selectedId: string | null;
}

export type Action =
  | { type: "auth"; auth: AuthState }
  | { type: "mode"; mode: ModeInfo }
  | { type: "modeError"; error: { code: string; message: string } }
  | { type: "instance"; instanceId: string }
  | { type: "stream"; status: StreamStatus }
  | { type: "sensors"; sensors: SensorStatus[] }
  | { type: "sensor"; sensor: SensorStatus }
  | { type: "events"; events: SecurityEvent[]; counts?: State["counts"]; lastSeq?: number; live?: boolean }
  | { type: "traffic"; traffic: TrafficDetails | null }
  | { type: "select"; id: string | null }
  | { type: "seen"; ids: string[] };

export function initialState(auth: AuthState, seen: Set<string>): State {
  return {
    auth,
    mode: null,
    modeError: null,
    instanceId: null,
    stream: "connecting",
    events: [],
    lastSeq: 0,
    counts: {},
    seen,
    live: new Set(),
    sensors: {},
    traffic: null,
    selectedId: null,
  };
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "auth":
      return { ...state, auth: action.auth };
    case "mode":
      // The public demo has no token at all.
      return {
        ...state,
        mode: action.mode,
        modeError: null,
        auth: action.mode.auth === "none" ? "ok" : state.auth,
      };
    case "modeError":
      return { ...state, modeError: action.error };
    case "instance":
      if (state.instanceId === action.instanceId) return state;
      if (state.instanceId === null) return { ...state, instanceId: action.instanceId };
      // A different server run: its sequence numbers start over, so the
      // cached history can neither be resumed nor mixed with the new one.
      return {
        ...initialState(state.auth, state.seen),
        mode: state.mode,
        stream: state.stream,
        instanceId: action.instanceId,
      };
    case "stream":
      return { ...state, stream: action.status };
    case "sensors": {
      const sensors = { ...state.sensors };
      for (const s of action.sensors) sensors[s.kind] = s;
      return { ...state, sensors };
    }
    case "sensor":
      return { ...state, sensors: { ...state.sensors, [action.sensor.kind]: action.sensor } };
    case "events":
      return mergeEvents(state, action.events, action.counts, action.lastSeq, action.live ?? false);
    case "traffic":
      return { ...state, traffic: action.traffic };
    case "select": {
      if (action.id === null) return { ...state, selectedId: null };
      const seen = new Set(state.seen);
      seen.add(action.id);
      return { ...state, selectedId: action.id, seen };
    }
    case "seen": {
      const seen = new Set(state.seen);
      action.ids.forEach((id) => seen.add(id));
      return { ...state, seen };
    }
  }
}

function mergeEvents(
  state: State,
  incoming: SecurityEvent[],
  counts: State["counts"] | undefined,
  lastSeq: number | undefined,
  live: boolean,
): State {
  const known = new Set(state.events.map((e) => e.id));
  const fresh = incoming.filter((e) => !known.has(e.id));
  let nextCounts = counts ?? state.counts;
  if (!counts && fresh.length) {
    nextCounts = { ...state.counts };
    for (const e of fresh) nextCounts[e.severity] = (nextCounts[e.severity] ?? 0) + 1;
  }
  const maxIncoming = incoming.reduce((m, e) => Math.max(m, e.seq), 0);
  if (!fresh.length) {
    return { ...state, counts: nextCounts, lastSeq: Math.max(state.lastSeq, lastSeq ?? 0, maxIncoming) };
  }
  const events = [...fresh, ...state.events].sort((a, b) => b.seq - a.seq).slice(0, MAX_EVENTS);
  const liveIds = live ? new Set([...state.live, ...fresh.map((e) => e.id)]) : state.live;
  return {
    ...state,
    events,
    counts: nextCounts,
    live: liveIds,
    lastSeq: Math.max(state.lastSeq, lastSeq ?? 0, maxIncoming),
  };
}

export function isUnread(state: Pick<State, "seen">, event: SecurityEvent): boolean {
  return !state.seen.has(event.id);
}

const SEVERITY_RANK: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };

export function severityRank(severity: Severity): number {
  return SEVERITY_RANK[severity];
}

export type SortMode = "time" | "severity";

export interface BoardFilter {
  severities: Set<Severity>;
  sensor: SensorKind | "all";
  query: string;
  unreadOnly: boolean;
}

export function filterEvents(
  events: SecurityEvent[],
  filter: BoardFilter,
  seen: Set<string>,
  sort: SortMode,
): SecurityEvent[] {
  const q = filter.query.trim().toLowerCase();
  const out = events.filter((e) => {
    if (filter.severities.size && !filter.severities.has(e.severity)) return false;
    if (filter.sensor !== "all" && e.sensor !== filter.sensor) return false;
    if (filter.unreadOnly && seen.has(e.id)) return false;
    if (q) {
      const hay = `${e.summary} ${e.asset_ref ?? ""} ${e.category}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  if (sort === "severity") {
    out.sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || b.seq - a.seq);
  }
  return out;
}
