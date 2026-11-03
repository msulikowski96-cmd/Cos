import path from "node:path";
import app from "./artifacts/api-server/src/app";
import { logger } from "./artifacts/api-server/src/lib/logger";
import { bootstrapAuth } from "./artifacts/api-server/src/lib/auth";
import { initDatabase } from "./lib/db/src";

// Render (i inne hostingi) podają port w zmiennej PORT; lokalnie domyślnie 3000.
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  await initDatabase();
  await bootstrapAuth();

  // W produkcji frontend serwuje app.ts (express.static + fallback SPA).
  // W developmencie podpinamy Vite jako middleware.
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      configFile: path.resolve(process.cwd(), "artifacts/web/vite.config.ts"),
      server: { middlewareMode: true },
      appType: "spa",
      root: path.resolve(process.cwd(), "artifacts/web"),
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    logger.info({ port: PORT }, `Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
