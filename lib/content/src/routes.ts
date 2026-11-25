// HTML dla robotów (Google, AdSense): każdy adres dostaje własny tytuł, opis, adres kanoniczny
// i pełną treść już w pierwszej odpowiedzi serwera — bez czekania na JavaScript.
// Po załadowaniu aplikacja React podmienia tę treść na interaktywną wersję.
import { ARTICLES, ARTICLE_BY_SLUG, readingMinutes, CONTACT_EMAIL } from "./list";
import { DOCS, type Doc } from "./docs";
import { escapeHtml as e, inline, renderMarkup } from "./markup";
import type { Article } from "./types";

export const SITE_URL = "https://nexus-sight.com.pl";
const BRAND = "Nexus Draft";

export interface RouteMeta {
  status: number;
  title: string;
  description: string;
  canonical: string;
  robots: string;
  ogType: "website" | "article";
  /** treść wstawiana do <div id="root"> */
  bodyHtml: string;
  /** dodatkowe dane strukturalne JSON-LD */
  jsonLd?: object;
}

const INDEX = "index, follow, max-image-preview:large";
const NOINDEX = "noindex, follow";

const STYLE = `<style>
.ssr{max-width:780px;margin:0 auto;padding:24px 16px 48px;color:#ece6d6;font:16px/1.65 Inter,system-ui,sans-serif;background:#0b0f17}
.ssr a{color:#d2ad62}.ssr h1{font:800 2.1rem/1.1 'Barlow Condensed',sans-serif;text-transform:uppercase;margin:.4em 0}
.ssr h2{font:700 1.45rem/1.2 'Barlow Condensed',sans-serif;text-transform:uppercase;margin:1.6em 0 .5em}
.ssr h3{font-size:1.08rem;margin:1.2em 0 .3em}.ssr .lead{color:#a8b0bf;font-size:1.06rem}
.ssr nav,.ssr footer{display:flex;flex-wrap:wrap;gap:14px;font-size:14px}.ssr footer{margin-top:40px;border-top:1px solid #233047;padding-top:16px;color:#a8b0bf}
.ssr .tip{border-left:3px solid #d2ad62;padding:4px 14px;background:#121926}.ssr table{border-collapse:collapse;width:100%}
.ssr td,.ssr th{border:1px solid #233047;padding:6px 8px;text-align:left}.ssr .card{border:1px solid #233047;border-radius:10px;padding:12px 14px;margin:10px 0;background:#121926}
</style>`;

function layout(main: string, crumbs?: { href: string; label: string }[]) {
  const nav = `<nav aria-label="Główne"><a href="/"><strong>${BRAND}</strong></a><a href="/">Statystyki graczy</a><a href="/draft">Analizator draftu</a><a href="/optymalizator">Kalkulator buildu</a><a href="/poradnik">Poradnik</a></nav>`;
  const bc = crumbs?.length
    ? `<p style="font-size:13px;color:#a8b0bf"><a href="/">Start</a>${crumbs.map((c) => ` › <a href="${c.href}">${e(c.label)}</a>`).join("")}</p>`
    : "";
  const footer = `<footer><a href="/about">O nas</a><a href="/poradnik">Poradnik</a><a href="/poradnik/jak-dziala-nexus-draft">Metodologia</a><a href="/privacy">Polityka prywatności</a><a href="/terms">Regulamin</a><span>Kontakt: ${CONTACT_EMAIL}</span><span>${BRAND} nie jest zatwierdzony przez Riot Games i nie odzwierciedla poglądów ani opinii Riot Games. League of Legends i Riot Games są znakami towarowymi Riot Games, Inc.</span></footer>`;
  return `${STYLE}<div class="ssr">${nav}${bc}<main>${main}</main>${footer}</div>`;
}

const articleCard = (a: Article) =>
  `<article class="card"><h3><a href="/poradnik/${a.slug}">${e(a.title)}</a></h3><p>${e(a.description)}</p><p style="font-size:13px;color:#a8b0bf">${e(a.category)} · ${readingMinutes(a)} min czytania</p></article>`;

const meta = (path: string, m: Omit<RouteMeta, "canonical" | "status" | "robots" | "ogType"> & Partial<RouteMeta>): RouteMeta => ({
  status: 200,
  robots: INDEX,
  ogType: "website",
  canonical: SITE_URL + (path === "/" ? "/" : path),
  ...m,
});

function home(): RouteMeta {
  const body = `
<h1>Statystyki League of Legends i analiza draftu</h1>
<p class="lead">${BRAND} to darmowe, polskojęzyczne narzędzie dla graczy League of Legends. Sprawdzisz tu statystyki dowolnego gracza, ocenisz draft przed meczem, dobierzesz build pod przeciwników i przeczytasz poradniki, które pomagają wygrywać więcej gier.</p>
<h2>Co znajdziesz w ${BRAND}</h2>
<ul>
<li><strong>Statystyki graczy</strong> — wpisz Riot ID i serwer, a zobaczysz rangę, historię meczów, mistrzostwo, pulę championów oraz autorskie wskaźniki: ocenę od A do F, wskaźnik tiltu, krzywą mocy, warunki zwycięstwa i porównanie z twoją rangą.</li>
<li><strong><a href="/draft">Analizator draftu</a></strong> — ocena obu składów, szansa na wygraną z samego draftu, krzywa siły od 0 do 40 minuty, gotowy plan gry i podpowiedzi championów. Wczytuje też trwający mecz.</li>
<li><strong><a href="/optymalizator">Kalkulator buildu</a></strong> — przedmioty, runy i czary dobrane do składu przeciwnika, z uzasadnieniem.</li>
<li><strong>Analiza AI</strong> — raport trenera oparty na statystykach z twoich ostatnich meczów rankingowych.</li>
<li><strong><a href="/poradnik">Poradniki</a></strong> — artykuły o drafcie, kompozycjach, makro, statystykach i mentalności.</li>
</ul>
<h2>Jak sprawdzić statystyki gracza</h2>
<ol><li>Wybierz serwer, na przykład EUNE lub EUW.</li><li>Wpisz nazwę gracza i tag z Riot ID (np. Nazwa#EUW).</li><li>Otwórz profil i przejdź przez zakładki: Analiza, Rang, Mecze, Build, Karta i Live.</li></ol>
<p>Dane pochodzą z oficjalnego API Riot Games. Opis wszystkich wskaźników znajdziesz w artykule <a href="/poradnik/jak-czytac-statystyki">Jak czytać statystyki gracza</a>, a opis algorytmów w tekście <a href="/poradnik/jak-dziala-nexus-draft">Jak działa ${BRAND}</a>.</p>
<h2>Najnowsze poradniki</h2>
${ARTICLES.slice(0, 6).map(articleCard).join("")}
<p><a href="/poradnik">Wszystkie poradniki →</a></p>`;
  return meta("/", {
    title: `${BRAND} — statystyki graczy i analiza draftu League of Legends`,
    description:
      "Darmowe statystyki graczy LoL i analiza draftu po polsku: ranga, historia meczów, wskaźniki gry, szansa na wygraną z draftu, kalkulator buildu i poradniki.",
    bodyHtml: layout(body),
    jsonLd: { "@context": "https://schema.org", "@type": "WebSite", name: BRAND, url: SITE_URL + "/", inLanguage: "pl" },
  });
}

function draftPage(): RouteMeta {
  const body = `
<h1>Analizator draftu League of Legends</h1>
<p class="lead">Ułóż oba składy albo wczytaj trwający mecz, a analizator pokaże, która drużyna ma przewagę w drafcie, kiedy jest najsilniejsza i jak powinna grać.</p>
<h2>Co pokazuje analizator</h2>
<ul>
<li><strong>Szansa na wygraną z samego draftu</strong> — porównanie ocen obu składów, celowo ograniczone do przedziału 25–75%, bo draft nie rozstrzyga meczu.</li>
<li><strong>Ocena składu</strong> — frontline, inicjacja (engage), ochrona carry (peel), kontrola tłumu, poke, mobilność, split push i zróżnicowanie obrażeń.</li>
<li><strong>Archetyp drużyny</strong> — teamfight, dive, poke, ochrona carry, łapanie albo split push, razem z warunkiem zwycięstwa.</li>
<li><strong>Krzywa siły</strong> — jak zmienia się względna moc obu drużyn od pierwszej do 40. minuty i gdzie są okna przewagi.</li>
<li><strong>Plan gry</strong> — co robić we wczesnej, środkowej i późnej fazie gry.</li>
<li><strong>Podpowiedzi championów</strong> — propozycje do wolnego miejsca w składzie, także z uwzględnieniem twojej puli championów.</li>
<li><strong>Trener AI</strong> — opisowa analiza draftu dla zalogowanych użytkowników.</li>
</ul>
<h2>Jak wczytać mecz na żywo</h2>
<p>Wpisz swój Riot ID i wybierz serwer. Gdy mecz jest już na ekranie ładowania, analizator pobierze oba składy z oficjalnego API Riot Games. Jeśli gry jeszcze nie widać, panel sam sprawdza ją co 45 sekund przez kwadrans. Gracze z włączonym ukrywaniem aktywności przed aplikacjami nie są widoczni — wtedy wpisz Riot ID kogoś z drużyny.</p>
<h2>Poradniki o drafcie</h2>
${["jak-wygrac-draft", "kompozycje-druzyn", "power-spiki-krzywa-sily", "counterpick-i-matchupy"].map((s) => articleCard(ARTICLE_BY_SLUG[s]!)).join("")}`;
  return meta("/draft", {
    title: `Analizator draftu LoL — szansa na wygraną, krzywa siły i plan gry | ${BRAND}`,
    description:
      "Oceń draft League of Legends przed meczem: szansa na wygraną z draftu, krzywa siły, kompozycja drużyny, plan gry i podpowiedzi championów. Wczytuje też mecz na żywo.",
    bodyHtml: layout(body, [{ href: "/draft", label: "Analizator draftu" }]),
  });
}

function buildPage(): RouteMeta {
  const body = `
<h1>Kalkulator buildu League of Legends</h1>
<p class="lead">Wybierz swojego championa i przeciwników, a kalkulator dobierze buty, kolejność przedmiotów, przedmioty sytuacyjne, runy i czary przywoływacza pod ten konkretny skład.</p>
<h2>Jak działa kalkulator</h2>
<p>Kalkulator analizuje skład przeciwnika: ile ma obrażeń fizycznych i magicznych, ile postaci wytrzymałych, ile leczenia i kontroli tłumu. Na tej podstawie wybiera przedmioty, które najlepiej odpowiadają na zagrożenia, i krótko uzasadnia każdy wybór — na przykład przedmiot z głębokimi ranami przeciwko drużynie z dużym leczeniem albo buty z pancerzem przeciwko składowi z wieloma postaciami zadającymi obrażenia fizyczne.</p>
<h2>Co dostajesz w wyniku</h2>
<ul><li><strong>Buty</strong> dobrane do głównego zagrożenia w składzie przeciwnika.</li><li><strong>Kolejność buildu</strong> — trzy główne przedmioty z krótkim opisem, po co je kupujesz, oraz łączny koszt.</li><li><strong>Przedmioty sytuacyjne</strong> na wypadek, gdy przeciwnik zacznie dominować grę.</li><li><strong>Runy i czary przywoływacza</strong> pasujące do twojej roli i stylu championa.</li><li><strong>Analizę składu wroga</strong> — poziom zagrożenia obrażeniami fizycznymi i magicznymi, liczbę tanków i postaci łatwych do zabicia.</li></ul>
<p>Build możesz skopiować jednym kliknięciem i wkleić znajomym z drużyny. Pamiętaj, że to punkt wyjścia: jeśli w trakcie gry jeden przeciwnik wyraźnie odskoczy, warto wcześniej kupić przedmiot defensywny przeciwko niemu.</p>
<h2>Kiedy warto zmienić build</h2>
<ul><li>Gdy przeciwnik ma wyraźną przewagę jednego rodzaju obrażeń.</li><li>Gdy w składzie wroga jest kilka postaci z leczeniem lub tarczami.</li><li>Gdy jeden przeciwnik dominuje grę i trzeba przetrwać jego wejście.</li></ul>
<p>Kalkulator jest też dostępny w profilu każdego gracza, w zakładce Build. Więcej o tym, jak dopasować grę do składu przeciwnika, przeczytasz w artykule <a href="/poradnik/counterpick-i-matchupy">Counterpick i matchupy</a>.</p>`;
  return meta("/optymalizator", {
    title: `Kalkulator buildu LoL — przedmioty i runy pod przeciwników | ${BRAND}`,
    description: "Dobierz przedmioty, runy i czary w League of Legends pod konkretny skład przeciwnika. Kalkulator buildu z uzasadnieniem każdego wyboru.",
    bodyHtml: layout(body, [{ href: "/optymalizator", label: "Kalkulator buildu" }]),
  });
}

function hub(): RouteMeta {
  const cats = [...new Set(ARTICLES.map((a) => a.category))];
  const body = `
<h1>Poradnik League of Legends</h1>
<p class="lead">Autorskie poradniki po polsku: jak wygrywać draft, rozumieć kompozycje drużyn, czytać statystyki, podejmować decyzje makro i nie dać się tiltowi. Każdy artykuł łączy wiedzę o grze z narzędziami ${BRAND}.</p>
${cats.map((c) => `<h2>${e(c)}</h2>${ARTICLES.filter((a) => a.category === c).map(articleCard).join("")}`).join("")}`;
  return meta("/poradnik", {
    title: `Poradnik League of Legends — draft, statystyki, makro i ranked | ${BRAND}`,
    description: "Poradniki LoL po polsku: draft i kompozycje drużyn, power spiki, counterpick, obiektywy i makro, statystyki graczy, tilt i wspinanie się w rankedach.",
    bodyHtml: layout(body, [{ href: "/poradnik", label: "Poradnik" }]),
  });
}

function articlePage(a: Article): RouteMeta {
  const { html } = renderMarkup(a.body);
  const related = a.related.map((s) => ARTICLE_BY_SLUG[s]).filter(Boolean) as Article[];
  const body = `
<article>
<p style="font-size:13px;color:#a8b0bf">${e(a.category)} · ${readingMinutes(a)} min czytania · aktualizacja ${e(a.updated)}</p>
<h1>${e(a.title)}</h1>
<p class="lead">${inline(a.lead)}</p>
${html}
${a.cta ? `<p><a href="${a.cta.href}"><strong>${e(a.cta.label)} →</strong></a></p>` : ""}
</article>
<h2>Czytaj dalej</h2>
${related.map(articleCard).join("")}`;
  return meta(`/poradnik/${a.slug}`, {
    title: `${a.title} | ${BRAND}`,
    description: a.description,
    ogType: "article",
    bodyHtml: layout(body, [
      { href: "/poradnik", label: "Poradnik" },
      { href: `/poradnik/${a.slug}`, label: a.title },
    ]),
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: a.title,
      description: a.description,
      inLanguage: "pl",
      dateModified: a.updated,
      datePublished: a.updated,
      mainEntityOfPage: `${SITE_URL}/poradnik/${a.slug}`,
      author: { "@type": "Organization", name: BRAND, url: SITE_URL + "/about" },
      publisher: { "@type": "Organization", name: BRAND, url: SITE_URL + "/" },
    },
  });
}

function docPage(d: Doc): RouteMeta {
  const { html } = renderMarkup(d.body);
  const body = `<h1>${e(d.title)}</h1><p style="font-size:13px;color:#a8b0bf">Ostatnia aktualizacja: ${e(d.updated)}</p>${d.lead ? `<p class="lead">${inline(d.lead)}</p>` : ""}${html}`;
  return meta(d.path, { title: `${d.title} | ${BRAND}`, description: d.description, bodyHtml: layout(body, [{ href: d.path, label: d.title }]) });
}

/** Strony z danymi konkretnego gracza: bez stałej treści, więc nie indeksujemy ich. */
function dynamicPage(path: string, title: string, what: string): RouteMeta {
  const body = `<h1>${e(title)}</h1><p class="lead">${e(what)}</p><p>Dane wczytują się z oficjalnego API Riot Games po otwarciu strony. Jeśli widzisz ten tekst, włącz JavaScript w przeglądarce.</p><p>Zobacz też: <a href="/poradnik/jak-czytac-statystyki">Jak czytać statystyki gracza</a>.</p>`;
  return meta(path, { title: `${title} | ${BRAND}`, description: what, robots: NOINDEX, bodyHtml: layout(body) });
}

const dec = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

export function renderRoute(rawPath: string): RouteMeta {
  const path = rawPath.replace(/\/+$/, "") || "/";
  if (path === "/") return home();
  if (path === "/draft") return draftPage();
  if (path === "/optymalizator") return buildPage();
  if (path === "/poradnik") return hub();
  const art = path.match(/^\/poradnik\/([a-z0-9-]+)$/);
  if (art && ARTICLE_BY_SLUG[art[1]!]) return articlePage(ARTICLE_BY_SLUG[art[1]!]!);
  const doc = DOCS.find((d) => d.path === path);
  if (doc) return docPage(doc);

  const prof = path.match(/^\/(profile|live|ai-analysis)\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (prof) {
    const who = `${dec(prof[3]!)}#${dec(prof[4]!)}`;
    const kind = { profile: "statystyki gracza", live: "mecz na żywo", "ai-analysis": "analiza AI" }[prof[1] as "profile"];
    return dynamicPage(path, `${who} — ${kind} LoL`, `${who} (${prof[2]!.toUpperCase()}): ranga, historia meczów, mistrzostwo i wskaźniki gry w League of Legends.`);
  }
  if (/^\/(match|champion)\//.test(path)) return dynamicPage(path, "Szczegóły meczu LoL", "Szczegółowe statystyki meczu League of Legends.");
  if (["/auth", "/admin", "/promo"].includes(path))
    return dynamicPage(path, path === "/auth" ? "Logowanie" : BRAND, "Darmowe narzędzia i poradniki dla graczy League of Legends.");

  return {
    ...dynamicPage(path, "Nie znaleziono strony", "Ta strona nie istnieje albo została przeniesiona."),
    status: 404,
  };
}

export function sitemapXml(): string {
  const urls: { loc: string; lastmod?: string; priority: string; changefreq: string }[] = [
    { loc: "/", priority: "1.0", changefreq: "weekly" },
    { loc: "/draft", priority: "0.9", changefreq: "weekly" },
    { loc: "/optymalizator", priority: "0.7", changefreq: "monthly" },
    { loc: "/poradnik", priority: "0.9", changefreq: "weekly" },
    ...ARTICLES.map((a) => ({ loc: `/poradnik/${a.slug}`, lastmod: a.updated, priority: "0.8", changefreq: "monthly" })),
    ...DOCS.map((d) => ({ loc: d.path, lastmod: d.updated, priority: "0.4", changefreq: "yearly" })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      (u) =>
        `  <url><loc>${SITE_URL}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
    )
    .join("\n")}\n</urlset>\n`;
}
