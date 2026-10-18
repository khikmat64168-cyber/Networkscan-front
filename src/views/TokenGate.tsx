import { KeyRound } from "lucide-react";
import { useState } from "react";

import { BoardMark, Notice } from "../components/common";

export function TokenGate({ rejected, onSubmit }: { rejected: boolean; onSubmit: (token: string) => void }) {
  const [token, setToken] = useState("");
  return (
    <main className="gate">
      <div className="gate-card">
        <BoardMark size={40} />
        <h1>Access token required</h1>
        <p>
          NST Web only answers requests that carry the one-time token printed when <code>nst web</code> started. Open the
          link from your terminal, or paste the token below.
        </p>
        {rejected ? (
          <Notice tone="bad" title="The token was rejected">
            Each start of <code>nst web</code> issues a new token. If the server was restarted, use the new link.
          </Notice>
        ) : null}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (token.trim()) onSubmit(token.trim());
          }}
        >
          <label className="sr-only" htmlFor="token">
            Access token
          </label>
          <input
            id="token"
            className="input mono"
            value={token}
            autoComplete="off"
            spellCheck={false}
            placeholder="Paste access token"
            onChange={(e) => setToken(e.target.value)}
          />
          <button type="submit" className="btn primary" disabled={!token.trim()}>
            <KeyRound size={14} aria-hidden="true" />
            Connect
          </button>
        </form>
      </div>
    </main>
  );
}
