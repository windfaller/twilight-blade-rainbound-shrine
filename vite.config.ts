import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

function pagesFallback() {
  return {
    name: "pages-404-fallback",
    closeBundle() {
      const index = path.resolve("dist/index.html");
      const dest = path.resolve("dist/404.html");
      if (fs.existsSync(index)) fs.copyFileSync(index, dest);
    },
  };
}

export default defineConfig(({ command, isPreview }) => ({
  base: command === "build" || isPreview ? "/twilight-blade-rainbound-shrine/" : "/",
  plugins: [react(), pagesFallback()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
}));
