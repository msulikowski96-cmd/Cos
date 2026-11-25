import { ARTICLES, type Category } from "@workspace/content";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { ArticleCard } from "@/pages/article";
import { usePageTitle } from "@/lib/usePageTitle";

const ORDER: Category[] = ["Draft", "Rozgrywka", "Statystyki", "Ranked", "Nexus Draft"];

/** Lista poradników pogrupowana według kategorii. */
export default function Guide() {
  usePageTitle("Poradnik League of Legends");
  const cats = ORDER.filter((c) => ARTICLES.some((a) => a.category === c));
  return (
    <div className="gutter mx-auto max-w-4xl py-8 sm:py-12">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-subtle hover:text-gold">
        <ArrowLeft size={15} aria-hidden /> Strona główna
      </Link>
      <div className="eyebrow mt-6 !text-gold">Poradnik</div>
      <h1 className="mt-1 font-display text-3xl font-extrabold uppercase leading-tight tracking-wide sm:text-4xl">
        Poradnik League of Legends
      </h1>
      <p className="mt-3 max-w-[65ch] text-[1.05rem] leading-relaxed text-subtle">
        Autorskie poradniki po polsku: jak wygrywać draft, rozumieć kompozycje drużyn, czytać statystyki, podejmować decyzje makro i nie
        dać się tiltowi. Każdy artykuł łączy wiedzę o grze z narzędziami Nexus Draft.
      </p>
      {cats.map((c) => (
        <section key={c} className="mt-10">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide">{c}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {ARTICLES.filter((a) => a.category === c).map((a) => (
              <ArticleCard key={a.slug} a={a} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
