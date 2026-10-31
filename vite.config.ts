import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { existsSync, readFileSync } from "node:fs";

// SINGLEFILE=1 buduje jeden plik HTML z osadzonymi ikonami (do podglądu offline).
const single = process.env.SINGLEFILE === "1";

function inlineIcons(): Plugin {
  const id = "virtual:inline-icons";
  return {
    name: "inline-icons",
    resolveId: (s) => (s === id ? "\0" + id : null),
    load(s) {
      if (s !== "\0" + id) return null;
      const file = new URL("./.cache/icons.json", import.meta.url);
      if (single && existsSync(file)) return `export default ${readFileSync(file, "utf8")};`;
      return "export default {};";
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), inlineIcons(), ...(single ? [viteSingleFile()] : [])],
  build: { outDir: single ? "dist-single" : "dist" },
  server: { proxy: { "/api": "http://localhost:8787" } },
});
