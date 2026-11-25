import { useEffect } from "react";

const DEFAULT_TITLE = "Nexus Draft — statystyki graczy i analiza draftu League of Legends";

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | Nexus Draft` : DEFAULT_TITLE;
    return () => { document.title = DEFAULT_TITLE; };
  }, [title]);
}
