import { useCallback, useEffect, useRef, useState } from "react";

import { api, describeError } from "./api/client";
import type { Capabilities, NetworkInterface } from "./api/types";

export interface Loadable<T> {
  data: T | null;
  error: { code: string; message: string } | null;
  loading: boolean;
  reload: () => void;
}

/** GET *path* on mount (and whenever reload() is called or *path* changes). */
export function useApiGet<T>(path: string | null, intervalMs?: number): Loadable<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Loadable<T>["error"]>(null);
  const [loading, setLoading] = useState(path !== null);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (path === null) return;
    const controller = new AbortController();
    setLoading(true);
    api<T>(path, { signal: controller.signal })
      .then((result) => {
        setData(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(describeError(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, tick]);

  useEffect(() => {
    if (!intervalMs || path === null) return;
    const id = window.setInterval(reload, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, path, reload]);

  return { data, error, loading, reload };
}

export function useInterfaces(): Loadable<{ default: string | null; interfaces: NetworkInterface[] }> {
  return useApiGet("/api/interfaces");
}

export function useCapabilities(): Loadable<Capabilities> {
  return useApiGet("/api/capabilities");
}

export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Run an async action with pending / error state for a button. */
export function useAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );
  const run = useCallback(
    async (...args: A): Promise<R | undefined> => {
      setPending(true);
      setError(null);
      try {
        return await fn(...args);
      } catch (err) {
        if (mounted.current) setError(describeError(err));
        return undefined;
      } finally {
        if (mounted.current) setPending(false);
      }
    },
    [fn],
  );
  return { run, pending, error, clearError: () => setError(null) };
}
