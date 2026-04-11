import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy all /api/* calls to the Python backend so CORS is never an issue
      "/api": {
        target:       "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
