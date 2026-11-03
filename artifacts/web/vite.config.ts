import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const port = Number(process.env.PORT || 3000);
const basePath = process.env.BASE_PATH || "/";
const apiProxyTarget = process.env.API_PROXY_TARGET || "http://127.0.0.1:8080";

const apiProxy = {
  "/api": {
    target: apiProxyTarget,
    changeOrigin: false,
  },
};

const stripUseClientDirective = {
  name: "strip-use-client-directive",
  enforce: "pre" as const,
  transform(code: string, id: string) {
    const normalizedId = id.replaceAll("\\", "/");
    if (!normalizedId.includes("/src/") || !/\.[cm]?[jt]sx?$/.test(normalizedId)) {
      return null;
    }

    const transformed = code.replace(/^\s*["']use client["'];?\s*/, "");
    if (transformed === code) return null;

    return { code: transformed, map: null };
  },
};

export default defineConfig({
  base: basePath,
  plugins: [stripUseClientDirective, react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: apiProxy,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: apiProxy,
  },
});
