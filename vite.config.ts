import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

const devPort = Number(process.env.VITE_DEV_PORT || 5173);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0",
    port: devPort,
    strictPort: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
    hmr: {
      clientPort: devPort,
    },
    proxy: {
      "/api": {
        target: process.env.VITE_PROXY_TARGET || "http://localhost:3000",
        changeOrigin: true,
      },
      // /r/:shortCode is a frontend route. RedirectHandlerPage resolves the
      // link through the configured API instead of a legacy port-3000 proxy.
    },
  },
});
