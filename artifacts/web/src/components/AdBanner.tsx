import { useEffect, useRef, useState } from "react";
import { getConsent } from "./CookieConsent";

interface AdBannerProps {
  slot: string;
  format?: "auto" | "autorelaxed" | "horizontal" | "rectangle" | "vertical";
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function AdBanner({
  slot,
  format = "auto",
  className = "",
  style,
}: AdBannerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);
  const [consent, setConsent] = useState(getConsent);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getConsent();
      if (current !== consent) setConsent(current);
    }, 1000);
    return () => clearInterval(interval);
  }, [consent]);

  useEffect(() => {
    if (pushed.current) return;
    if (consent !== "accepted") return;
    if (!slot || slot === "TWOJ_SLOT_ID") return;

    const timer = setTimeout(() => {
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        pushed.current = true;
      } catch {
        // ignore
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [slot, consent]);

  if (!slot || slot === "TWOJ_SLOT_ID") return null;

  return (
    <div ref={ref} className={className} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-7717242133259434"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
