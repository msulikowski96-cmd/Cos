import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

interface Props {
  back?: { href: string; label: string };
  eyebrow?: ReactNode;
  title: string;
  lead?: string;
  /** HTML wygenerowany z naszej treści (markup.ts escapuje tekst) */
  html: string;
  /** wstawiane między wstępem a treścią (np. spis treści) */
  beforeBody?: ReactNode;
  children?: ReactNode;
}

/** Układ stron z treścią: poradniki, O nas, polityka prywatności, regulamin. */
export default function ContentPage({ back = { href: "/", label: "Strona główna" }, eyebrow, title, lead, html, beforeBody, children }: Props) {
  return (
    <div className="gutter mx-auto max-w-3xl py-8 sm:py-12">
      <Link href={back.href} className="inline-flex items-center gap-1.5 text-sm text-subtle hover:text-gold">
        <ArrowLeft size={15} aria-hidden /> {back.label}
      </Link>
      {eyebrow && <div className="eyebrow mt-6">{eyebrow}</div>}
      <h1 className="mt-2 font-display text-3xl font-extrabold uppercase leading-tight tracking-wide sm:text-4xl">{title}</h1>
      {lead && <p className="mt-3 text-[1.05rem] leading-relaxed text-subtle">{lead}</p>}
      {beforeBody}
      <div className="prose-custom mt-6" dangerouslySetInnerHTML={{ __html: html }} />
      {children}
    </div>
  );
}
