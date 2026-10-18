# Networkscan-front

Web console for the [Network Security Toolkit (NST)](https://github.com/khikmat64168-cyber/network-security-toolkit):
a live findings board, traffic statistics, ARP / DNS / MAC detector tables,
TLS inspection, GeoIP lookups and HTML reports.

It is a single-page app (React 18, Vite, TypeScript) that talks to the NST
backend (`nst web`, FastAPI) over a JSON API and one WebSocket stream on the
**same origin**. It has no backend of its own.

| Where it runs | How it gets there |
|---|---|
| Your machine, with `nst web` | The backend repo's CI bundles this repo's `dist/` into the NST Python package |
| Public demo / private console on the VPS | `dist/` is deployed as static files behind Caddy, which proxies `/api` to NST |

## Develop

Requires Node 18.18+ and a running NST backend.

```bash
npm ci
```

```bash
# in the NST repo: start the backend and allow the dev server's origin
nst web --port 8780 --no-browser --dev-origin http://127.0.0.1:5173
```

```bash
npm run dev
```

Open `http://127.0.0.1:5173/#token=<token printed by nst web>`. Vite proxies
`/api` (including the WebSocket) to `127.0.0.1:8780`.

## Check and build

```bash
npm run typecheck
```

```bash
npm test
```

```bash
npm run build
```

The production bundle lands in `dist/`. Fonts (Inter, Martian Mono) are
self-hosted from npm packages; their licenses ship in `dist/FONT-LICENSES.txt`.

## Structure

```
src/
├── api/         # REST client, WebSocket stream, API types (keep in sync with nst/web/app.py)
├── state/       # reducer + provider: everything shown comes from the backend
├── components/  # sensor rows, boarding pass, timeline chart, shared bits
├── views/       # Board, Traffic, Network, TLS, GeoIP, Reports, System, token gate
└── styles/      # app.css — the Gate Board visual system (see DESIGN.md)
```

Design and product context: [DESIGN.md](DESIGN.md), [PRODUCT.md](PRODUCT.md).

## Security model

- The access token arrives once in the URL fragment, is moved to
  `sessionStorage` and stripped from the address bar; it is sent as a bearer
  header and, for the WebSocket, as a subprotocol, never in a URL.
- Plaintext credentials are redacted by the backend before they reach the
  browser; the UI never sees them.
- HTML reports render in a fully sandboxed `<iframe sandbox="">`.

## License

MIT — see [LICENSE](LICENSE).
