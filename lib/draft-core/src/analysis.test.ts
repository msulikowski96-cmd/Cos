import { describe, expect, it } from "vitest";
import { analyzeDraft, analyzeTeam, emptyDraft, randomDraft, suggest, teamCurve, powerWindows, taken } from "./analysis";
import { CHAMPIONS } from "./champs";
import { decodeDraft, encodeDraft } from "./share";

describe("analiza draftu", () => {
  it("każdy champion ma role i oceny 0–3", () => {
    expect(CHAMPIONS.length).toBeGreaterThan(160);
    for (const c of CHAMPIONS) {
      expect(c.roles.length).toBeGreaterThan(0);
      for (const v of Object.values(c.stats)) expect(v).toBeGreaterThanOrEqual(0), expect(v).toBeLessThanOrEqual(3);
    }
  });

  it("pusta drużyna daje neutralny wynik", () => {
    const r = analyzeDraft(emptyDraft());
    expect(r.blueWin).toBe(0.5);
    expect(r.blue.count).toBe(0);
  });

  it("karze skład z samymi obrażeniami AD i bez frontline'u", () => {
    const allAD = analyzeTeam(["Fiora", "Khazix", "Zed", "Draven", "Pyke"]);
    const balanced = analyzeTeam(["Ornn", "Sejuani", "Orianna", "Jinx", "Braum"]);
    expect(allAD.damage.ap).toBe(0);
    expect(balanced.score).toBeGreaterThan(allAD.score);
  });

  it("szansa na wygraną mieści się w 25–75%", () => {
    for (let i = 0; i < 50; i++) {
      const w = analyzeDraft(randomDraft()).blueWin;
      expect(w).toBeGreaterThanOrEqual(0.25);
      expect(w).toBeLessThanOrEqual(0.75);
    }
  });

  it("podpowiedzi nie proponują zajętych championów i pasują do roli", () => {
    const d = emptyDraft();
    d.blue = ["Fiora", "Khazix", "Zed", "Draven", null];
    d.red = ["Ornn", "Sejuani", "Orianna", "Jinx", "Braum"];
    d.blueBans[0] = "Leona";
    const s = suggest(d, "blue", 4);
    const used = taken(d);
    expect(s.length).toBeGreaterThan(0);
    for (const x of s) {
      expect(used.has(x.champ.id)).toBe(false);
      expect(x.champ.roles).toContain("S");
    }
  });

  it("krzywa siły i okna mocy", () => {
    const early = analyzeTeam(["Renekton", "Elise", "Leblanc", "Draven", "Blitzcrank"]);
    const late = analyzeTeam(["Kayle", "MasterYi", "Kassadin", "Smolder", "Yuumi"]);
    const w = powerWindows(teamCurve(early), teamCurve(late));
    expect(w[0].side).toBe("blue");
    expect(w[w.length - 1].side).toBe("red");
  });

  it("link do draftu koduje się i dekoduje bez strat", () => {
    const d = randomDraft();
    d.redBans[2] = "Teemo";
    expect(decodeDraft("#" + encodeDraft(d))).toEqual(d);
    expect(encodeDraft(d)).toMatch(/^[A-Za-z0-9-]+$/);
  });
});
