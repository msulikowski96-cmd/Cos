import { Router, type Request, type Response, type NextFunction } from "express";
import {
  CHAMP_BY_ID,
  CHAMP_ID_BY_KEY,
  liveGameToDraft,
  type Draft,
  type Side,
  type Slot,
  type SpectatorGame,
} from "@workspace/draft-core";
import { PLATFORMS, RiotError, getAccount, getLiveGame, getTopMastery, riotEnabled } from "../draft/riot";
import { EXPECTED_CHARS, aiEnabled, coach } from "../draft/ai";
import { requireUsage } from "../middlewares/auth";

// Trasy Nexus Draft: /api/draft/status, /api/draft/player, /api/draft/coach
const router = Router();

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

router.get("/status", (req, res) => {
  res.json({
    riot: riotEnabled(),
    ai: aiEnabled(),
    loggedIn: !!req.user,
    regions: Object.entries(PLATFORMS).map(([id, p]) => ({ id, label: p.label })),
  });
});

router.get("/player", limit(20, 60_000), async (req, res) => {
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

function validate(req: Request, res: Response, next: NextFunction) {
  if (!aiEnabled()) return void res.status(503).json({ error: "Serwer nie ma ustawionego klucza do modelu AI." });
  const d = req.body?.draft ?? {};
  const blue = parseSlots(d.blue);
  const red = parseSlots(d.red);
  const blueBans = parseSlots(d.blueBans);
  const redBans = parseSlots(d.redBans);
  if (!blue || !red || !blueBans || !redBans) return void res.status(400).json({ error: "Nieprawidłowy draft." });
  if (blue.filter(Boolean).length < 3 || red.filter(Boolean).length < 3)
    return void res.status(400).json({ error: "Wybierz co najmniej 3 championów w każdej drużynie." });
  res.locals.draft = { blue, red, blueBans, redBans } satisfies Draft;
  next();
}

// Trener AI: wymaga zalogowania i liczy się do dziennego limitu „optymalizatorów / trenera”.
router.post("/coach", limit(6, 60_000), validate, requireUsage("optimizer"), async (req, res) => {
  const draft = res.locals.draft as Draft;
  const mySide: Side = req.body?.mySide === "red" ? "red" : "blue";
  const mc = req.body?.myChampion;
  const myChampion = typeof mc === "string" && CHAMP_BY_ID[mc] ? mc : null;

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
    console.error("[draft/ai]", (e as Error).message);
    // Nieudana analiza nie zużywa dziennego limitu.
    res.locals.usageFailed = true;
    send({ type: "error", error: "Model AI nie odpowiedział poprawnie. Spróbuj ponownie za chwilę." });
  }
  res.end();
});

export default router;
