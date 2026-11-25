import { describe, expect, it } from "vitest";
import { ARTICLES, ARTICLE_BY_SLUG, DOCS, renderRoute, sitemapXml, wordCount, renderMarkup } from "./index";

describe("poradniki", () => {
  it("każdy artykuł jest obszerny i ma unikalny slug", () => {
    expect(new Set(ARTICLES.map((a) => a.slug)).size).toBe(ARTICLES.length);
    for (const a of ARTICLES) {
      expect(wordCount(a.lead + "\n" + a.body), a.slug).toBeGreaterThanOrEqual(580);
      expect(a.description.length, a.slug).toBeLessThanOrEqual(170);
    }
  });

  it("linki wewnętrzne i powiązane artykuły prowadzą do istniejących stron", () => {
    const known = new Set(["/", "/draft", "/optymalizator", "/poradnik", ...DOCS.map((d) => d.path), ...ARTICLES.map((a) => `/poradnik/${a.slug}`)]);
    for (const src of [...ARTICLES.map((a) => a.body), ...DOCS.map((d) => d.body)]) {
      for (const [, href] of src.matchAll(/\]\((\/[^)]*)\)/g)) expect(known.has(href!), href).toBe(true);
    }
    for (const a of ARTICLES) for (const r of a.related) expect(ARTICLE_BY_SLUG[r], `${a.slug} → ${r}`).toBeTruthy();
  });

  it("markup: nagłówki, listy, tabele i bezpieczne znaki", () => {
    const { html, headings } = renderMarkup("## Tytuł <b>\n\n- a **b**\n- [c](/draft)\n\n| x | y |\n| 1 | 2 |\n\n> rada");
    expect(headings).toEqual([{ id: "tytul-b", text: "Tytuł <b>" }]);
    expect(html).toContain("&lt;b&gt;");
    expect(html).toContain('<li>a <strong>b</strong></li>');
    expect(html).toContain('<a href="/draft">c</a>');
    expect(html).toContain("<th>x</th>");
    expect(html).toContain('<aside class="tip">');
  });
});

describe("renderRoute", () => {
  it("strony z treścią mają unikalne tytuły, opisy i dużo tekstu w HTML", () => {
    const paths = ["/", "/draft", "/optymalizator", "/poradnik", ...ARTICLES.map((a) => `/poradnik/${a.slug}`), ...DOCS.map((d) => d.path)];
    const metas = paths.map(renderRoute);
    expect(new Set(metas.map((m) => m.title)).size).toBe(paths.length);
    expect(new Set(metas.map((m) => m.description)).size).toBe(paths.length);
    for (const [i, m] of metas.entries()) {
      expect(m.status).toBe(200);
      expect(m.robots).toMatch(/^index/);
      const words = m.bodyHtml.replace(/<style>[\s\S]*?<\/style>/, "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
      expect(words, paths[i]).toBeGreaterThan(250);
    }
  });

  it("profile i strony techniczne nie są indeksowane, nieznany adres to 404", () => {
    expect(renderRoute("/profile/EUW1/Faker/KR1").robots).toBe("noindex, follow");
    expect(renderRoute("/profile/EUW1/Faker/KR1").title).toContain("Faker#KR1");
    expect(renderRoute("/match/EUW1/a/b/EUW1_1").robots).toBe("noindex, follow");
    expect(renderRoute("/auth").robots).toBe("noindex, follow");
    expect(renderRoute("/nie-ma-takiej").status).toBe(404);
    expect(renderRoute("/poradnik/nie-ma-takiego").status).toBe(404);
    expect(renderRoute("/poradnik/").canonical).toBe("https://nexus-sight.com.pl/poradnik");
  });

  it("nazwa gracza z adresu jest bezpiecznie wstawiana do HTML", () => {
    const m = renderRoute("/profile/EUW1/%3Cscript%3E/x");
    expect(m.bodyHtml).not.toContain("<script>");
  });

  it("sitemap zawiera artykuły i strony informacyjne, bez profili", () => {
    const xml = sitemapXml();
    for (const a of ARTICLES) expect(xml).toContain(`/poradnik/${a.slug}</loc>`);
    expect(xml).toContain("/privacy</loc>");
    expect(xml).not.toContain("/profile/");
    expect(xml).not.toContain("/promo");
  });
});
