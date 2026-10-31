import express, { type Request, type Response, type NextFunction } from "express";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { CHAMP_BY_ID, CHAMP_ID_BY_KEY } from "../src/lib/champs";
import { liveGameToDraft, type SpectatorGame } from "../src/lib/live";
import type { Draft, Side, Slot } from "../src/lib/analysis";
import { PLATFORMS, RiotError, getAccount, getLiveGame, getTopMastery, riotEnabled } from "./riot";
import { EXPECTED_CHARS, aiEnabled, coach } from "./ai";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "16kb" }));

// Prosty limit zapytań na IP — chroni klucze przed nadużyciem.
function limit(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip ?? "?";
    const now = Date.now();
    const list = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
    if (list.length >= max) {
      res.status(429).json({ error: "Za dużo zapytań. Odczekaj chwilę i spróbuj ponownie." });
      return;
    }
    list.push(now);
    hits.set(ip, list);
    next();
  };
}

app.get("/api/status", (_req, res) => {
  res.json({ riot: riotEnabled(), ai: aiEnabled(), regions: Object.entries(PLATFORMS).map(([id, p]) => ({ id, label: p.label })) });
});

app.get("/api/riot/player", limit(20, 60_000), async (req, res) => {
  if (!riotEnabled()) return void res.status(503).json({ error: "Serwer nie ma ustawionego klucza RIOT_API_KEY." });
  const platform = String(req.query.region ?? "").toLowerCase();
  const riotId = String(req.query.riotId ?? "").trim();
  const [gameName, tagLine] = riotId.split("#").map((s) => s?.trim());
  if (!PLATFORMS[platform]) return void res.status(400).json({ error: "Nieznany region." });
  if (!gameName || !tagLine || gameName.length > 32 || tagLine.length > 8)
    return void res.status(400).json({ error: "Podaj Riot ID w formacie Nazwa#TAG." });

  try {
    const account = await getAccount(platform, gameName, tagLine);
    const [mastery, live] = await Promise.all([
      getTopMastery(platform, account.puuid).catch(() => []),
      getLiveGame<SpectatorGame>(platform, account.puuid),
    ]);
    const pool = (mastery ?? [])
      .map((m) => ({ id: CHAMP_ID_BY_KEY[m.championId], level: m.championLevel, points: m.championPoints }))
      .filter((m) => m.id);
    const supported = live && live.participants?.length === 10;
    res.json({
      account: { gameName: account.gameName, tagLine: account.tagLine },
      pool,
      live: supported ? liveGameToDraft(live, account.puuid) : null,
      inUnsupportedGame: !!live && !supported,
    });
  } catch (e) {
    const err = e as RiotError;
    res.status(err.status ?? 500).json({ error: err.message ?? "Błąd API Riot." });
  }
});

function parseSlots(v: unknown): Slot[] | null {
  if (!Array.isArray(v) || v.length !== 5) return null;
  const out: Slot[] = [];
  for (const s of v) {
    if (s === null) out.push(null);
    else if (typeof s === "string" && CHAMP_BY_ID[s]) out.push(s);
    else return null;
  }
  return out;
}

app.post("/api/ai/coach", limit(6, 60_000), async (req, res) => {
  if (!aiEnabled()) return void res.status(503).json({ error: "Serwer nie ma ustawionego klucza do modelu AI." });
  const body = req.body ?? {};
  const d = body.draft ?? {};
  const draft: Draft | null = (() => {
    const blue = parseSlots(d.blue);
    const red = parseSlots(d.red);
    const blueBans = parseSlots(d.blueBans);
    const redBans = parseSlots(d.redBans);
    return blue && red && blueBans && redBans ? { blue, red, blueBans, redBans } : null;
  })();
  const mySide: Side = body.mySide === "red" ? "red" : "blue";
  const myChampion = typeof body.myChampion === "string" && CHAMP_BY_ID[body.myChampion] ? body.myChampion : null;
  if (!draft) return void res.status(400).json({ error: "Nieprawidłowy draft." });
  if (draft.blue.filter(Boolean).length < 3 || draft.red.filter(Boolean).length < 3)
    return void res.status(400).json({ error: "Wybierz co najmniej 3 championów w każdej drużynie." });

  // Odpowiedź strumieniowa (NDJSON): postęp na bieżąco, na końcu gotowy raport.
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  const send = (obj: unknown) => res.write(JSON.stringify(obj) + "\n");
  send({ type: "start", expected: EXPECTED_CHARS });
  try {
    const result = await coach(draft, mySide, myChampion, (p) => send({ type: "progress", ...p }));
    send({ type: "done", ...result });
  } catch (e) {
    console.error("[ai]", (e as Error).message);
    send({ type: "error", error: "Model AI nie odpowiedział poprawnie. Spróbuj ponownie za chwilę." });
  }
  res.end();
});

// Statyczny frontend (po `npm run build`).
const here = path.dirname(fileURLToPath(import.meta.url));
const dist = [path.resolve(here, "../dist"), path.resolve(process.cwd(), "dist")].find((p) => existsSync(p));
if (dist) app.use(express.static(dist, { maxAge: "1h", index: "index.html" }));

export default app;
