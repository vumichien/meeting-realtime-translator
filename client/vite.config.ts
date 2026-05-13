import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/session": "http://localhost:8787",
      "/health": "http://localhost:8787",
    },
  },
});
