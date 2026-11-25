import type { Article } from "./types";
import { article as jakWygracDraft } from "./articles/jak-wygrac-draft";
import { article as kompozycje } from "./articles/kompozycje-druzyn";
import { article as powerSpiki } from "./articles/power-spiki-krzywa-sily";
import { article as statystyki } from "./articles/jak-czytac-statystyki";
import { article as counterpick } from "./articles/counterpick-i-matchupy";
import { article as obiektywy } from "./articles/obiektywy-i-makro";
import { article as tilt } from "./articles/tilt-i-mentalnosc";
import { article as ranked } from "./articles/jak-wspinac-sie-w-rankedach";
import { article as role } from "./articles/role-w-lol";
import { article as live } from "./articles/analiza-meczu-na-zywo";
import { article as metodologia } from "./articles/jak-dziala-nexus-draft";
import { article as slownik } from "./articles/slownik-lol";
import { renderMarkup, wordCount } from "./markup";


/** Kolejność = kolejność na liście poradników. */
export const ARTICLES: Article[] = [
  jakWygracDraft,
  kompozycje,
  powerSpiki,
  statystyki,
  counterpick,
  obiektywy,
  ranked,
  role,
  live,
  tilt,
  slownik,
  metodologia,
];

export const ARTICLE_BY_SLUG: Record<string, Article> = Object.fromEntries(ARTICLES.map((a) => [a.slug, a]));

/** Czas czytania w minutach (ok. 200 słów na minutę). */
export const readingMinutes = (a: Article) => Math.max(2, Math.round((wordCount(a.lead) + wordCount(a.body)) / 200));

export function articleHtml(a: Article) {
  return renderMarkup(a.body);
}

export const CONTACT_EMAIL = "nexussight.kontakt@gmail.com";
