// Live stream over WebSocket with automatic reconnection.
//
// The token travels as a subprotocol ("auth.<token>"), so it never appears
// in a URL or access log.  The server closes with 1008 for bad credentials
// (no retry: the token is wrong) and 1013 when this client fell behind
// (retry immediately and resynchronise over REST).

import { getToken } from "./client";
import type { StreamMessage } from "./types";

export type StreamStatus = "connecting" | "live" | "reconnecting" | "rejected" | "offline";

export interface StreamHandlers {
  onMessage: (message: StreamMessage) => void;
  onStatus: (status: StreamStatus) => void;
  /** Fired after every (re)connection so callers can backfill missed data. */
  onOpen?: () => void;
  /**
   * Fired when the handshake fails.  Browsers report a refused upgrade as
   * close code 1006, indistinguishable from a network error, so the caller
   * re-checks the token over REST (which reports 401 precisely).
   */
  onHandshakeFailed?: () => void;
}

const MAX_BACKOFF_MS = 15_000;

export function connectStream(handlers: StreamHandlers): () => void {
  let socket: WebSocket | null = null;
  let attempt = 0;
  let timer: number | undefined;
  let closed = false;

  const open = () => {
    const token = getToken();
    if (!token) {
      handlers.onStatus("rejected");
      return;
    }
    handlers.onStatus(attempt === 0 ? "connecting" : "reconnecting");
    const scheme = window.location.protocol === "https:" ? "wss" : "ws";
    try {
      socket = new WebSocket(`${scheme}://${window.location.host}/api/stream`, ["nst.v1", `auth.${token}`]);
    } catch {
      // The browser refuses a subprotocol it cannot send: treat as a bad token.
      handlers.onStatus("rejected");
      return;
    }
    let opened = false;

    socket.onopen = () => {
      opened = true;
      attempt = 0;
      handlers.onStatus("live");
      handlers.onOpen?.();
    };
    socket.onmessage = (event: MessageEvent<string>) => {
      try {
        handlers.onMessage(JSON.parse(event.data) as StreamMessage);
      } catch {
        // Ignore malformed frames; the next snapshot supersedes them.
      }
    };
    socket.onclose = (event) => {
      socket = null;
      if (closed) return;
      if (event.code === 1008) {
        handlers.onStatus("rejected");
        return;
      }
      if (!opened) handlers.onHandshakeFailed?.();
      attempt += 1;
      handlers.onStatus(attempt > 3 ? "offline" : "reconnecting");
      const delay = event.code === 1013 ? 0 : Math.min(MAX_BACKOFF_MS, 500 * 2 ** (attempt - 1));
      timer = window.setTimeout(open, delay);
    };
  };

  open();

  return () => {
    closed = true;
    window.clearTimeout(timer);
    socket?.close(1000);
  };
}
