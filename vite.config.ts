import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiTarget = "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/new-session": apiTarget,
      "/status": apiTarget,
      "/upload": apiTarget,
      "^/[a-z0-9._~-]{8}$": apiTarget,
    },
  },
});
