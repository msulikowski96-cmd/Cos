// Buduje serwer produkcyjny do dist/server.mjs.
// Pakiety z node_modules zostają zewnętrzne, ale wewnętrzne @workspace/* (TypeScript bez
// kompilacji) są wbudowywane w paczkę — inaczej Node nie umie ich załadować i serwer pada przy starcie.
import { build } from "esbuild";

await build({
  entryPoints: ["server.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outfile: "dist/server.mjs",
  sourcemap: true,
  logLevel: "info",
  // Vite jest potrzebny tylko w developmencie (import dynamiczny w server.ts).
  external: ["vite"],
  banner: {
    // Część zależności (np. pino) używa require — w ESM trzeba go odtworzyć.
    js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);",
  },
  plugins: [
    {
      name: "externalize-node-modules",
      setup(b) {
        b.onResolve({ filter: /^[^./]/ }, (args) => {
          if (args.path.startsWith("@workspace/")) return undefined; // wbuduj
          if (args.kind === "entry-point") return undefined;
          return { path: args.path, external: true };
        });
      },
    },
  ],
});
