export type Category = "Draft" | "Statystyki" | "Rozgrywka" | "Ranked" | "Nexus Draft";

export interface Article {
  slug: string;
  title: string;
  /** krótki opis do meta description i kart (do ~160 znaków) */
  description: string;
  category: Category;
  /** data publikacji / ostatniej aktualizacji (YYYY-MM-DD) */
  updated: string;
  /** akapit wprowadzający, wyświetlany pod tytułem */
  lead: string;
  /** treść w formacie z markup.ts */
  body: string;
  /** slugi powiązanych artykułów */
  related: string[];
  /** narzędzie w aplikacji, do którego prowadzi artykuł */
  cta?: { href: string; label: string };
}
