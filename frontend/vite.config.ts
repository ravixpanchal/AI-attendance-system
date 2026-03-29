import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Same proxy for dev + preview; target port must match `uvicorn --port` (see frontend/.env). */
const apiProxy = {
  "/auth": { target: "http://127.0.0.1:8765", changeOrigin: true },
  "/students": { target: "http://127.0.0.1:8765", changeOrigin: true },
  "/attendance": { target: "http://127.0.0.1:8765", changeOrigin: true },
  "/upload": { target: "http://127.0.0.1:8765", changeOrigin: true },
  "/analytics": { target: "http://127.0.0.1:8765", changeOrigin: true },
  "/export": { target: "http://127.0.0.1:8765", changeOrigin: true },
  "/ai": { target: "http://127.0.0.1:8765", changeOrigin: true },
  "/ai-query": { target: "http://127.0.0.1:8765", changeOrigin: true },
  "/ai-confirm": { target: "http://127.0.0.1:8765", changeOrigin: true },
} as const;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    port: 5173,
    proxy: apiProxy,
  },
  preview: {
    port: 4173,
    proxy: apiProxy,
  },
});
