import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { renderIndexHtml } from "./seo-html";

const template = fs.readFileSync(path.resolve(__dirname, "../../../web/index.html"), "utf8");
const text = (html: string) =>
  html
    .split('<div id="root">')[1]!
    .replace(/<style>[\s\S]*?<\/style>/g, "")
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;

describe("renderIndexHtml", () => {
  it("artykuł ma własny tytuł, opis, adres kanoniczny, JSON-LD i pełną treść", () => {
    const { status, html } = renderIndexHtml(template, "/poradnik/jak-wygrac-draft");
    expect(status).toBe(200);
    expect(html).toContain("<title>Jak wygrać draft w League of Legends — kompletny poradnik | Nexus Draft</title>");
    expect(html).toContain('<link rel="canonical" href="https://nexus-sight.com.pl/poradnik/jak-wygrac-draft" />');
    expect(html).toContain('<meta property="og:type" content="article" />');
    expect(html).toContain('"@type":"Article"');
    expect(html).toContain('<meta name="robots" content="index, follow, max-image-preview:large" />');
    expect(html).not.toContain("<!--app-html-->");
    expect(text(html)).toBeGreaterThan(700);
    // tylko jeden <title> i jeden opis
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html.match(/<meta name="description"/g)).toHaveLength(1);
  });

  it("różne adresy dają różne strony", () => {
    const a = renderIndexHtml(template, "/").html;
    const b = renderIndexHtml(template, "/privacy").html;
    expect(a).not.toBe(b);
    expect(b).toContain("<title>Polityka prywatności | Nexus Draft</title>");
  });

  it("profil gracza jest noindex, a nieznany adres zwraca 404", () => {
    const p = renderIndexHtml(template, "/profile/EUW1/doggokule/000");
    expect(p.status).toBe(200);
    expect(p.html).toContain('<meta name="robots" content="noindex, follow" />');
    expect(renderIndexHtml(template, "/to-nie-istnieje").status).toBe(404);
  });
});
