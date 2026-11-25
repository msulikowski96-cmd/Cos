import { useMemo } from "react";
import { TERMS, renderMarkup } from "@workspace/content";
import ContentPage from "@/components/ContentPage";
import { usePageTitle } from "@/lib/usePageTitle";

export default function Page() {
  usePageTitle(TERMS.title);
  const { html } = useMemo(() => renderMarkup(TERMS.body), []);
  return (
    <ContentPage
      eyebrow={<>Ostatnia aktualizacja: {new Date(TERMS.updated).toLocaleDateString("pl-PL")}</>}
      title={TERMS.title}
      lead={TERMS.lead}
      html={html}
    />
  );
}
