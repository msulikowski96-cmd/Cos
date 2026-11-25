import { renderRoute, escapeHtml as esc } from "@workspace/content";

/**
 * Wstawia do szablonu index.html meta-dane i treść właściwe dla danego adresu.
 * Dzięki temu robot (Google, AdSense) już w pierwszej odpowiedzi dostaje inny tytuł, opis
 * i pełny tekst dla każdej podstrony, zamiast tej samej powłoki aplikacji.
 */
export function renderIndexHtml(template: string, path: string): { status: number; html: string } {
  const m = renderRoute(path);
  const title = esc(m.title);
  const desc = esc(m.description);
  const url = esc(m.canonical);

  const setMeta = (html: string, attr: "name" | "property", key: string, value: string) => {
    const re = new RegExp(`<meta ${attr}="${key}" content="[^"]*"\\s*/?>`);
    const tag = `<meta ${attr}="${key}" content="${value}" />`;
    return re.test(html) ? html.replace(re, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
  };

  let html = template.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = setMeta(html, "name", "description", desc);
  html = setMeta(html, "name", "robots", esc(m.robots));
  html = setMeta(html, "property", "og:title", title);
  html = setMeta(html, "property", "og:description", desc);
  html = setMeta(html, "property", "og:url", url);
  html = setMeta(html, "property", "og:type", m.ogType);
  html = setMeta(html, "name", "twitter:title", title);
  html = setMeta(html, "name", "twitter:description", desc);
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}" />`);
  if (m.jsonLd) {
    // "<" w JSON zamieniamy na \u003c, żeby tekst nie mógł zamknąć znacznika <script>.
    const json = JSON.stringify(m.jsonLd).replace(/</g, "\\u003c");
    html = html.replace("</head>", `    <script type="application/ld+json">${json}</script>\n  </head>`);
  }
  html = html.replace("<!--app-html-->", m.bodyHtml);
  return { status: m.status, html };
}
