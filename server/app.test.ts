import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { RAW_CHAMPIONS } from "../src/data/champions.generated";

const key = (id: string) => RAW_CHAMPIONS.find((c) => c.id === id)!.key;
const realFetch = globalThis.fetch;
let server: Server;
let base = "";
const calls: string[] = [];

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

beforeAll(async () => {
  process.env.RIOT_API_KEY = "RGAPI-test";
  process.env.NVIDIA_API_KEY = "nv-test";
  delete process.env.AI_MODEL;
  delete process.env.NVIDIA_AI_MODEL;
  delete process.env.NVIDIA_MODEL;
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url.startsWith("http://127.0.0.1")) return realFetch(input, init);
    calls.push(url);
    if (url.includes("/accounts/by-riot-id/Nikt/")) return json({ status: { status_code: 404 } }, 404);
    if (url.includes("/accounts/by-riot-id/")) return json({ puuid: "p1", gameName: "Gracz", tagLine: "EUNE" });
    if (url.includes("/champion-masteries/")) return json([{ championId: key("Jinx"), championLevel: 7, championPoints: 250000 }]);
    if (url.includes("/active-games/")) {
      const t = (ids: string[], team: number) =>
        ids.map((id, i) => ({ championId: key(id), teamId: team, spell1Id: 4, spell2Id: i === 1 ? 11 : 14, puuid: team === 100 && i === 3 ? "p1" : `x${team}${i}` }));
      return json({ gameQueueConfigId: 420, gameLength: 100, participants: [...t(["Garen", "Vi", "Ahri", "Jinx", "Lulu"], 100), ...t(["Darius", "LeeSin", "Zed", "Caitlyn", "Thresh"], 200)], bannedChampions: [] });
    }
    if (url.includes("/chat/completions")) {
      const body = JSON.parse(String(init?.body ?? "{}"));
      if (body.model === "nvidia/nemotron-3-ultra-550b-a55b") return json({ detail: "gone" }, 410); // pierwszy model wycofany → fallback
      const content = JSON.stringify({ summary: "Lepszy draft macie wy.", winCondition: "Graj wokół Jinx.", lanes: [{ role: "Top", tip: "Garen ma priorytet." }], threats: [{ champion: "Zed", answer: "Stoper." }], teamfight: "Peel na Jinx.", powerSpikes: "6 lvl.", firstMinutes: "Ochrona bota." });
      const parts = [{ reasoning_content: "myślę".repeat(40) }, { content: content.slice(0, 150) }, { content: content.slice(150) }];
      const sse = parts.map((delta) => `data: ${JSON.stringify({ id: "1", object: "chat.completion.chunk", created: 0, model: body.model, choices: [{ index: 0, delta, finish_reason: null }] })}\n\n`).join("") + "data: [DONE]\n\n";
      return new Response(sse, { status: 200, headers: { "content-type": "text/event-stream" } });
    }
    return json({ error: "unexpected " + url }, 500);
  });
  const { default: app } = await import("./app");
  server = app.listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server?.close();
  vi.unstubAllGlobals();
});

describe("serwer API", () => {
  it("status pokazuje włączone funkcje, bez ujawniania kluczy", async () => {
    const s = await (await realFetch(`${base}/api/status`)).json();
    expect(s.riot).toBe(true);
    expect(s.ai).toBe(true);
    expect(JSON.stringify(s)).not.toContain("RGAPI");
  });

  it("wczytuje gracza, pulę i mecz na żywo", async () => {
    const r = await realFetch(`${base}/api/riot/player?region=eun1&riotId=${encodeURIComponent("Gracz#EUNE")}`);
    const body = await r.json();
    expect(r.status).toBe(200);
    expect(body.pool[0].id).toBe("Jinx");
    expect(body.live.draft.blue).toEqual(["Garen", "Vi", "Ahri", "Jinx", "Lulu"]);
    expect(body.live.mySide).toBe("blue");
    expect(calls.some((u) => u.startsWith("https://europe.api.riotgames.com/riot/account/v1/"))).toBe(true);
    expect(calls.some((u) => u.startsWith("https://eun1.api.riotgames.com/lol/spectator/v5/"))).toBe(true);
  });

  it("zwraca czytelny błąd dla nieistniejącego gracza i złych danych", async () => {
    const nf = await realFetch(`${base}/api/riot/player?region=eun1&riotId=${encodeURIComponent("Nikt#123")}`);
    expect(nf.status).toBe(404);
    expect((await nf.json()).error).toMatch(/Nie znaleziono/);
    const bad = await realFetch(`${base}/api/riot/player?region=xx&riotId=a%23b`);
    expect(bad.status).toBe(400);
  });

  it("trener AI zwraca raport i odrzuca nieprawidłowy draft", async () => {
    const draft = { blue: ["Garen", "Vi", "Ahri", "Jinx", "Lulu"], red: ["Darius", "LeeSin", "Zed", "Caitlyn", "Thresh"], blueBans: [null, null, null, null, null], redBans: [null, null, null, null, null] };
    const ok = await realFetch(`${base}/api/ai/coach`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ draft, mySide: "blue" }) });
    const lines = (await ok.text()).trim().split("\n").map((l) => JSON.parse(l));
    expect(ok.status).toBe(200);
    expect(lines[0].type).toBe("start");
    expect(lines.some((l) => l.type === "progress")).toBe(true);
    const body = lines[lines.length - 1];
    expect(body.type).toBe("done");
    expect(body.model).toBe("openai/gpt-oss-20b");
    expect(body.report.lanes[0]).toMatchObject({ role: "Top", ally: "Garen", enemy: "Darius" });
    expect(body.report.threats[0].champion).toBe("Zed");

    const bad = await realFetch(`${base}/api/ai/coach`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ draft: { ...draft, blue: ["<script>", null, null, null, null] } }) });
    expect(bad.status).toBe(400);
  });
});
