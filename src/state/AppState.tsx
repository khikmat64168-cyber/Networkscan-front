// Connects the reducer to the backend: REST bootstrap, the live stream,
// and the sensor actions shared by every view.

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import type { ReactNode } from "react";

import { ApiError, api, describeError, initToken, onUnauthorized, setToken } from "../api/client";
import { connectStream } from "../api/stream";
import type { ModeInfo, SecurityEvent, SensorKind, SensorStatus, Severity, TrafficDetails } from "../api/types";
import { initialState, reducer } from "./reducer";
import type { Action, State } from "./reducer";

const SEEN_KEY = "nst.seen";
const SEEN_CAP = 5000;

function loadSeen(): Set<string> {
  try {
    const raw = window.sessionStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveSeen(seen: Set<string>): void {
  try {
    window.sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-SEEN_CAP)));
  } catch {
    // Convenience only; unread state then resets on reload.
  }
}

interface EventsResponse {
  events: SecurityEvent[];
  counts: Partial<Record<Severity, number>>;
  last_seq: number;
  instance_id: string;
}

export interface StartOptions {
  interface: string | null;
  bpf_filter?: string;
}

interface AppContextValue {
  state: State;
  dispatch: React.Dispatch<Action>;
  startSensor: (kind: SensorKind, options: StartOptions) => Promise<SensorStatus>;
  stopSensor: (kind: SensorKind) => Promise<SensorStatus>;
  signIn: (token: string) => void;
  retryMode: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    initialState(initToken() ? "ok" : "missing", loadSeen()),
  );
  const lastSeqRef = useRef(0);
  lastSeqRef.current = state.lastSeq;
  const instanceRef = useRef<string | null>(null);
  instanceRef.current = state.instanceId;

  useEffect(() => saveSeen(state.seen), [state.seen]);

  // Which server is this?  /api/mode needs no token.  A backend from before
  // the deployment modes has no such endpoint: treat it as a local console.
  const loadMode = useCallback(() => {
    api<ModeInfo>("/api/mode")
      .then((mode) => dispatch({ type: "mode", mode }))
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          dispatch({ type: "mode", mode: { mode: "local", version: "", auth: "token" } });
        } else {
          dispatch({ type: "modeError", error: describeError(err) });
        }
      });
  }, []);
  useEffect(loadMode, [loadMode]);

  // A fresh `nst web` link opened in this same tab only changes the hash,
  // so pick the new token up without waiting for a reload.
  useEffect(() => {
    const onHash = () => {
      if (/(?:^#|&)token=/.test(window.location.hash) && initToken()) {
        dispatch({ type: "auth", auth: "ok" });
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(
    () =>
      onUnauthorized(() => {
        setToken(null);
        dispatch({ type: "auth", auth: "rejected" });
      }),
    [],
  );

  const backfill = useCallback(async (instanceId: string) => {
    // Resume only within the same server run; after a restart fetch everything.
    const after = instanceRef.current === instanceId ? lastSeqRef.current : 0;
    dispatch({ type: "instance", instanceId });
    const [events, sensors] = await Promise.all([
      api<EventsResponse>(`/api/events?after=${after}&limit=1000`),
      api<{ sensors: SensorStatus[] }>("/api/sensors"),
    ]);
    dispatch({ type: "instance", instanceId: events.instance_id });
    dispatch({ type: "events", events: events.events, counts: events.counts, lastSeq: events.last_seq });
    dispatch({ type: "sensors", sensors: sensors.sensors });
    if (sensors.sensors.some((s) => s.kind === "traffic" && s.started_at)) {
      const detail = await api<{ details: TrafficDetails | Record<string, never> }>("/api/sensors/traffic");
      dispatch({ type: "traffic", traffic: "total_packets" in detail.details ? (detail.details as TrafficDetails) : null });
    }
  }, []);

  const modeName = state.mode?.mode;
  useEffect(() => {
    // The public demo has no live stream: nothing is captured there.
    if (state.auth !== "ok" || !modeName || modeName === "public") return;
    const stop = connectStream({
      onStatus: (status) => dispatch({ type: "stream", status }),
      onHandshakeFailed: () => {
        // A 401 here flips auth to "rejected" through onUnauthorized.
        api("/api/health").catch(() => undefined);
      },
      onMessage: (message) => {
        switch (message.type) {
          case "hello":
            // hello is the first frame of every connection: backfill from it.
            backfill(message.data.instance_id).catch(() => undefined);
            dispatch({ type: "sensors", sensors: message.data.sensors });
            break;
          case "event":
            dispatch({ type: "events", events: [message.data], live: true });
            break;
          case "sensor":
            dispatch({ type: "sensor", sensor: message.data });
            break;
          case "sensors":
            dispatch({ type: "sensors", sensors: message.data });
            break;
          case "traffic":
            dispatch({ type: "traffic", traffic: message.data });
            break;
        }
      },
    });
    return stop;
  }, [state.auth, modeName, backfill]);

  const startSensor = useCallback(async (kind: SensorKind, options: StartOptions) => {
    const body: Record<string, unknown> = { interface: options.interface };
    if (kind === "traffic") body.bpf_filter = options.bpf_filter ?? "";
    const result = await api<{ status: SensorStatus }>(`/api/sensors/${kind}/start`, { method: "POST", body });
    dispatch({ type: "sensor", sensor: result.status });
    if (kind === "traffic") dispatch({ type: "traffic", traffic: null });
    return result.status;
  }, []);

  const stopSensor = useCallback(async (kind: SensorKind) => {
    const result = await api<{ status: SensorStatus }>(`/api/sensors/${kind}/stop`, { method: "POST" });
    dispatch({ type: "sensor", sensor: result.status });
    if (kind === "traffic") {
      const detail = await api<{ details: TrafficDetails | Record<string, never> }>("/api/sensors/traffic");
      if ("total_packets" in detail.details) dispatch({ type: "traffic", traffic: detail.details as TrafficDetails });
    }
    return result.status;
  }, []);

  const signIn = useCallback((token: string) => {
    setToken(token);
    dispatch({ type: "auth", auth: "ok" });
  }, []);

  const value = useMemo(
    () => ({ state, dispatch, startSensor, stopSensor, signIn, retryMode: loadMode }),
    [state, startSensor, stopSensor, signIn, loadMode],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp outside AppStateProvider");
  return ctx;
}
