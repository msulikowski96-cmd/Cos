// Prosty, przewidywalny format treści artykułów (podzbiór Markdown).
// Ten sam kod renderuje HTML na serwerze (dla robotów, bez JavaScriptu) i w przeglądarce.
//
// Bloki oddziela pusta linia:
//   ## Nagłówek      ### Podnagłówek
//   - punkt listy    1. punkt listy numerowanej
//   > Wskazówka (wyróżniona ramka)
//   | a | b |         tabela (pierwszy wiersz to nagłówek)
//   zwykły tekst      akapit
// W tekście: **pogrubienie** i [link](/sciezka).

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]!);

export function inline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((\/[^)\s]*|https:\/\/[^)\s]+)\)/g, (_m, label: string, href: string) =>
      href.startsWith("/") ? `<a href="${href}">${label}</a>` : `<a href="${href}" rel="noopener" target="_blank">${label}</a>`,
    );
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export interface Heading {
  id: string;
  text: string;
}

/** Zamienia treść artykułu na HTML. Zwraca też listę nagłówków H2 (spis treści). */
export function renderMarkup(src: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  const out: string[] = [];
  const blocks = src.trim().split(/\n\s*\n/);
  for (const raw of blocks) {
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const first = lines[0]!;
    if (first.startsWith("### ")) {
      out.push(`<h3>${inline(first.slice(4))}</h3>`);
      if (lines.length > 1) out.push(`<p>${inline(lines.slice(1).join(" "))}</p>`);
    } else if (first.startsWith("## ")) {
      const text = first.slice(3);
      const id = slugify(text);
      headings.push({ id, text });
      out.push(`<h2 id="${id}">${inline(text)}</h2>`);
      if (lines.length > 1) out.push(`<p>${inline(lines.slice(1).join(" "))}</p>`);
    } else if (lines.every((l) => l.startsWith("- "))) {
      out.push(`<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join("")}</ul>`);
    } else if (lines.every((l) => /^\d+\.\s/.test(l))) {
      out.push(`<ol>${lines.map((l) => `<li>${inline(l.replace(/^\d+\.\s/, ""))}</li>`).join("")}</ol>`);
    } else if (first.startsWith("> ")) {
      out.push(`<aside class="tip"><p>${inline(lines.map((l) => l.replace(/^>\s?/, "")).join(" "))}</p></aside>`);
    } else if (first.startsWith("|")) {
      const rows = lines.map((l) => l.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
      const [head, ...body] = rows;
      out.push(
        `<div class="table-wrap"><table><thead><tr>${head!.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead>` +
          `<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`,
      );
    } else {
      out.push(`<p>${inline(lines.join(" "))}</p>`);
    }
  }
  return { html: out.join("\n"), headings };
}

/** Liczba słów (do czasu czytania i testów jakości treści). */
export const wordCount = (src: string) => src.replace(/[#>*|\-[\]()]/g, " ").split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;
