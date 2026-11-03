import { useEffect } from "react";

const DEFAULT_TITLE = "Nexus Sight — Statystyki graczy League of Legends";

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | Nexus Sight` : DEFAULT_TITLE;
    return () => { document.title = DEFAULT_TITLE; };
  }, [title]);
}
