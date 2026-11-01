import { describe, expect, it } from "vitest";
import { assignRoles, liveGameToDraft, type SpectatorGame } from "./live";
import { RAW_CHAMPIONS } from "../data/champions.generated";
import { extractJson, normalizeReport } from "./coach";
import { emptyDraft, suggest } from "./analysis";

const key = (id: string) => RAW_CHAMPIONS.find((c) => c.id === id)!.key;
const p = (id: string, teamId: number, smite = false, puuid?: string) => ({ championId: key(id), teamId, spell1Id: 4, spell2Id: smite ? 11 : 14, puuid });

describe("import meczu na żywo", () => {
  it("przypisuje role niezależnie od kolejności graczy", () => {
    expect(assignRoles([
      { id: "Thresh", smite: false },
      { id: "Jinx", smite: false },
      { id: "LeeSin", smite: true },
      { id: "Garen", smite: false },
      { id: "Ahri", smite: false },
    ])).toEqual(["Garen", "LeeSin", "Ahri", "Jinx", "Thresh"]);
  });

  it("Smite wygrywa z główną rolą (np. Graves na topie bez Smite'a)", () => {
    const r = assignRoles([
      { id: "Graves", smite: false },
      { id: "Sejuani", smite: true },
      { id: "Syndra", smite: false },
      { id: "Ezreal", smite: false },
      { id: "Nautilus", smite: false },
    ]);
    expect(r[1]).toBe("Sejuani");
    expect(r[0]).toBe("Graves");
  });

  it("zamienia odpowiedź spectator-v5 na draft z banami i stroną gracza", () => {
    const game: SpectatorGame = {
      gameQueueConfigId: 420,
      gameLength: 312,
      participants: [
        p("Darius", 100), p("Vi", 100, true), p("Orianna", 100), p("Jinx", 100, false, "me"), p("Lulu", 100),
        p("Renekton", 200), p("Khazix", 200, true), p("Zed", 200), p("Caitlyn", 200), p("Leona", 200),
      ],
      bannedChampions: [
        { championId: key("Yone"), teamId: 100, pickTurn: 1 },
        { championId: -1, teamId: 100, pickTurn: 2 },
        { championId: key("Teemo"), teamId: 200, pickTurn: 6 },
      ],
    };
    const live = liveGameToDraft(game, "me");
    expect(live.draft.blue).toEqual(["Darius", "Vi", "Orianna", "Jinx", "Lulu"]);
    expect(live.draft.red).toEqual(["Renekton", "Khazix", "Zed", "Caitlyn", "Leona"]);
    expect(live.draft.blueBans[0]).toBe("Yone");
    expect(live.draft.redBans[0]).toBe("Teemo");
    expect(live.mySide).toBe("blue");
    expect(live.myChampion).toBe("Jinx");
  });
});

describe("trener AI — parsowanie odpowiedzi", () => {
  const d = emptyDraft();
  d.blue = ["Darius", "Vi", "Orianna", "Jinx", "Lulu"];
  d.red = ["Renekton", "Khazix", "Zed", "Caitlyn", "Leona"];

  it("wyciąga JSON z tekstu z blokiem kodu i myśleniem modelu", () => {
    const raw = '<think>hmm {nie to}</think>Oto analiza:\n```json\n{"summary":"Ok {nawias} w tekście","lanes":[]}\n```';
    expect(extractJson(raw)).toEqual({ summary: "Ok {nawias} w tekście", lanes: [] });
  });

  it("uzupełnia nazwy championów z draftu, a nie z odpowiedzi modelu", () => {
    const r = normalizeReport(
      { summary: "S", lanes: [{ role: "Top", tip: "Unikaj wymian do 6 lvl." }, { role: "ADC", tip: "Farm pod wieżą." }], threats: [{ champion: "Zed", answer: "Zhonya" }, { champion: "" }] },
      d,
      "blue",
    );
    expect(r.lanes.map((l) => [l.role, l.ally, l.enemy])).toEqual([["Top", "Darius", "Renekton"], ["ADC", "Jinx", "Caitlyn"]]);
    expect(r.threats).toHaveLength(1);
  });

  it("długą poradę przycina na końcu zdania, nie w pół słowa", () => {
    const long = "Graj bezpiecznie do lvl 6. ".repeat(40) + "Kup Control Ward.";
    const tip = normalizeReport({ summary: "S", lanes: [{ role: "Top", tip: long }] }, d, "blue").lanes[0].tip;
    expect(tip.length).toBeLessThanOrEqual(800);
    expect(tip.endsWith(".")).toBe(true);
  });

  it("odrzuca pustą odpowiedź", () => {
    expect(() => normalizeReport({}, d, "blue")).toThrow();
  });
});

describe("pula gracza w podpowiedziach", () => {
  it("champion z puli awansuje i jest oznaczony", () => {
    const d = emptyDraft();
    d.blue = ["Darius", "Vi", "Orianna", "Jinx", null];
    d.red = ["Renekton", "Khazix", "Zed", "Caitlyn", "Leona"];
    const without = suggest(d, "blue", 4, 50);
    const last = without[Math.floor(without.length / 2)].champ.id;
    const withPool = suggest(d, "blue", 4, 50, { [last]: 0 });
    const idx = (list: typeof without) => list.findIndex((s) => s.champ.id === last);
    expect(idx(withPool)).toBeLessThan(idx(without));
    expect(withPool[idx(withPool)].inPool).toBe(true);
    expect(withPool[idx(withPool)].reasons[0]).toBe("twoja pula");
  });
});
