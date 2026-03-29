import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Same proxy for dev + preview; target port must match `uvicorn --port` (see frontend/.env). */
const backendUrl = process.env["VITE_API_URL"] || "http://127.0.0.1:8765";

const apiProxy = {
  "/auth":       { target: backendUrl, changeOrigin: true },
  "/students":   { target: backendUrl, changeOrigin: true },
  "/attendance": { target: backendUrl, changeOrigin: true },
  "/upload":     { target: backendUrl, changeOrigin: true },
  "/analytics":  { target: backendUrl, changeOrigin: true },
  "/export":     { target: backendUrl, changeOrigin: true },
  "/ai":         { target: backendUrl, changeOrigin: true },
  "/ai-query":   { target: backendUrl, changeOrigin: true },
  "/ai-confirm": { target: backendUrl, changeOrigin: true },
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
