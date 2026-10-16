import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const gateway = env.VITE_PROXY_TARGET || "http://localhost:8080";
  return {
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173,
    },
    proxy: {
      "/api": {
        target: gateway,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    proxy: { '/api': { target: gateway, changeOrigin: true } },
  },
  };
});
