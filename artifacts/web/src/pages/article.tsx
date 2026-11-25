import { useMemo } from "react";
import { Link, useParams } from "wouter";
import { ArrowRight, Clock } from "lucide-react";
import { ARTICLE_BY_SLUG, articleHtml, readingMinutes, type Article } from "@workspace/content";
import ContentPage from "@/components/ContentPage";
import AdBanner from "@/components/AdBanner";
import NotFound from "@/pages/not-found";
import { usePageTitle } from "@/lib/usePageTitle";

export function ArticleCard({ a }: { a: Article }) {
  return (
    <Link href={`/poradnik/${a.slug}`} className="section block transition-colors hover:border-gold">
      <div className="eyebrow !text-gold">{a.category}</div>
      <h3 className="mt-1 text-lg font-bold leading-snug">{a.title}</h3>
      <p className="mt-1.5 text-sm text-subtle">{a.description}</p>
      <p className="mt-2 flex items-center gap-1 text-xs text-subtle">
        <Clock size={12} aria-hidden /> {readingMinutes(a)} min czytania
      </p>
    </Link>
  );
}

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const a = ARTICLE_BY_SLUG[slug ?? ""];
  usePageTitle(a?.title);
  const rendered = useMemo(() => (a ? articleHtml(a) : null), [a]);
  if (!a || !rendered) return <NotFound />;
  const related = a.related.map((s) => ARTICLE_BY_SLUG[s]).filter(Boolean) as Article[];

  return (
    <ContentPage
      back={{ href: "/poradnik", label: "Wszystkie poradniki" }}
      eyebrow={
        <>
          {a.category} · {readingMinutes(a)} min czytania · aktualizacja {new Date(a.updated).toLocaleDateString("pl-PL")}
        </>
      }
      title={a.title}
      lead={a.lead}
      html={rendered.html}
      beforeBody={
        rendered.headings.length > 3 && (
          <nav className="section mt-6" aria-label="Spis treści">
            <div className="eyebrow">Spis treści</div>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              {rendered.headings.map((h) => (
                <li key={h.id}>
                  <a href={`#${h.id}`} className="text-subtle hover:text-gold">
                    {h.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )
      }
    >
      {a.cta && (
        <Link href={a.cta.href} className="btn btn-gold mt-8 inline-flex">
          {a.cta.label} <ArrowRight size={15} aria-hidden />
        </Link>
      )}

      <AdBanner slot="2167950293" format="auto" className="mt-10" />

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide">Czytaj dalej</h2>
          <div className="mt-3 grid gap-3">
            {related.map((r) => (
              <ArticleCard key={r.slug} a={r} />
            ))}
          </div>
        </section>
      )}
    </ContentPage>
  );
}
