// HTTP client for the NST web API.
//
// The access token arrives once in the URL fragment (#token=…), which is
// never sent to the server.  It is moved into sessionStorage and the
// fragment is removed from the address bar so it does not linger in
// history or screenshots.

import type { ApiErrorBody } from "./types";

const TOKEN_KEY = "nst.token";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function readStorage(): string | null {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeStorage(token: string | null): void {
  try {
    if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
    else window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage blocked: the token then lives only in memory for this tab.
  }
}

let memoryToken: string | null = null;

// Server tokens are URL-safe base64 (secrets.token_urlsafe) or, for the
// private console, alphanumeric; nothing else can be a WebSocket subprotocol.
const TOKEN_RE = /^[A-Za-z0-9_-]+$/;

/**
 * Turn whatever the user pasted into a bare token, or null if it is not one.
 * Accepts the bare token, the `NST_WEB_TOKEN=…` line from the console's
 * .env (optionally quoted), and a full `…#token=…` link.
 */
export function normalizeToken(raw: string): string | null {
  let value = raw.trim();
  const fragment = value.match(/[#&]token=([^&\s]+)/);
  if (fragment?.[1]) value = fragment[1];
  value = value.replace(/^(?:export\s+)?NST_WEB_TOKEN\s*=\s*/, "");
  value = value.replace(/^(["'])(.*)\1$/, "$2").trim();
  return TOKEN_RE.test(value) ? value : null;
}

/** Pick up a token from the URL fragment, strip it, and return the active token. */
export function initToken(): string | null {
  const match = window.location.hash.match(/(?:^#|&)token=([A-Za-z0-9_-]+)/);
  if (match?.[1]) {
    setToken(match[1]);
    const url = window.location.pathname + window.location.search;
    window.history.replaceState(null, "", url);
  }
  return getToken();
}

export function getToken(): string | null {
  const token = memoryToken ?? readStorage();
  // A malformed value (e.g. stored by an older build) counts as no token.
  return token && TOKEN_RE.test(token) ? token : null;
}

export function setToken(token: string | null): void {
  memoryToken = token;
  writeStorage(token);
}

type Listener = () => void;
const unauthorizedListeners = new Set<Listener>();

/** Called whenever the server rejects the token (e.g. `nst web` was restarted). */
export function onUnauthorized(listener: Listener): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

export async function api<T>(
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const token = getToken();
  let response: Response;
  try {
    response = await fetch(path, {
      method: init.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: init.signal,
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(0, "backend_unreachable", "Cannot reach the NST backend. Is `nst web` still running?");
  }

  if (response.status === 401) {
    unauthorizedListeners.forEach((listener) => listener());
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  if (!response.ok) {
    let body: ApiErrorBody = { code: "http_error", message: `Request failed (${response.status})` };
    if (isJson) {
      const parsed = (await response.json().catch(() => null)) as { error?: ApiErrorBody } | null;
      if (parsed?.error) body = parsed.error;
    }
    throw new ApiError(response.status, body.code, body.message);
  }
  if (!isJson) {
    return (await response.text()) as unknown as T;
  }
  return (await response.json()) as T;
}

/** Fetch a report's HTML as text (it is rendered in a sandboxed frame). */
export async function fetchReportHtml(name: string): Promise<string> {
  return api<string>(`/api/reports/${encodeURIComponent(name)}`);
}

export function describeError(err: unknown): { code: string; message: string } {
  if (err instanceof ApiError) return { code: err.code, message: err.message };
  if (err instanceof Error) return { code: "client_error", message: err.message };
  return { code: "client_error", message: "Unexpected error" };
}
