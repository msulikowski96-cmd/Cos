import { useMemo } from "react";
import { PRIVACY, renderMarkup } from "@workspace/content";
import ContentPage from "@/components/ContentPage";
import { usePageTitle } from "@/lib/usePageTitle";

export default function Page() {
  usePageTitle(PRIVACY.title);
  const { html } = useMemo(() => renderMarkup(PRIVACY.body), []);
  return (
    <ContentPage
      eyebrow={<>Ostatnia aktualizacja: {new Date(PRIVACY.updated).toLocaleDateString("pl-PL")}</>}
      title={PRIVACY.title}
      lead={PRIVACY.lead}
      html={html}
    />
  );
}
