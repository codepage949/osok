import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/new-session": "http://localhost:8000",
      "/status": "http://localhost:8000",
      "/upload": "http://localhost:8000",
    },
  },
});
