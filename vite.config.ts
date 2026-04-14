import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiTarget = "http://127.0.0.1:8000";

// LightningCSS 타깃: backdrop-filter 표준 속성을 지원하는 모던 브라우저
// Chrome 103+, Firefox 103+, Safari 15.4+, Edge 103+
// (버전 인코딩: major << 16 | minor << 8)
const cssTargets = {
  chrome: 103 << 16,
  firefox: 103 << 16,
  safari: (15 << 16) | (4 << 8),
  edge: 103 << 16,
};

export default defineConfig({
  plugins: [react()],
  css: {
    lightningcss: {
      targets: cssTargets,
    },
  },
  server: {
    proxy: {
      "/new-session": apiTarget,
      "/status": apiTarget,
      "/upload": apiTarget,
      "^/[a-z0-9._~-]{8}$": apiTarget,
    },
  },
});
