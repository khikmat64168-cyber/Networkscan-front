/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The production bundle goes to dist/.  It is deployed as static files
// behind Caddy on the VPS, and bundled into the NST Python package by the
// backend repo's CI so a local `nst web` can serve it too.
//
// Development: run the backend with
//   nst web --port 8780 --dev-origin http://127.0.0.1:5173
// and open http://127.0.0.1:5173/#token=<token printed by nst web>.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsDir: "assets",
    sourcemap: false,
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": { target: "http://127.0.0.1:8780", ws: true },
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
