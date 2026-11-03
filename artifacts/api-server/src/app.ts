import express, { type Express } from "express";
import path from "path";
import fs from "fs";
import { dbStatus } from "@workspace/db";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { generalLimit } from "./middlewares/rateLimit";
import { attachUser } from "./middlewares/auth";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(attachUser);

// Status serwera i bazy — przydatne przy wdrożeniu (Render health check).
app.get("/api/status", (_req, res) => {
  res.json({ ok: true, db: dbStatus() });
});

app.use("/api", generalLimit, (_req, res, next) => {
  // Personalized — never share between users
  res.set("Cache-Control", "private, no-store");
  next();
}, router);

if (process.env.NODE_ENV === "production") {
  const currentDirname = typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));
  // Serwer startuje albo z dist/ w katalogu głównym (npm start), albo z artifacts/api-server/dist —
  // szukamy zbudowanego frontendu w obu układach.
  const candidates = [
    path.resolve(process.cwd(), "artifacts", "web", "dist", "public"),
    path.resolve(currentDirname, "..", "artifacts", "web", "dist", "public"),
    path.resolve(currentDirname, "..", "..", "web", "dist", "public"),
  ];
  const clientDist = candidates.find((p) => fs.existsSync(path.join(p, "index.html")));
  if (clientDist) {
    app.use(express.static(clientDist, { index: false, maxAge: "1h" }));
    app.get("/{*splat}", (req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(path.join(clientDist, "index.html"));
    });
  } else {
    console.error("[app] Nie znaleziono zbudowanego frontendu (artifacts/web/dist/public). Uruchom npm run build.");
  }
}

export default app;
