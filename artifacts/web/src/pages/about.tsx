import { useMemo } from "react";
import { ABOUT, renderMarkup } from "@workspace/content";
import ContentPage from "@/components/ContentPage";
import { usePageTitle } from "@/lib/usePageTitle";

export default function Page() {
  usePageTitle(ABOUT.title);
  const { html } = useMemo(() => renderMarkup(ABOUT.body), []);
  return (
    <ContentPage
      eyebrow={<>Ostatnia aktualizacja: {new Date(ABOUT.updated).toLocaleDateString("pl-PL")}</>}
      title={ABOUT.title}
      lead={ABOUT.lead}
      html={html}
    />
  );
}
