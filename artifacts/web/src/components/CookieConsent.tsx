import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Check } from "lucide-react";

const CONSENT_KEY = "nexus_consent";

function loadAdSense() {
  if (document.querySelector('script[src*="adsbygoogle"]')) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7717242133259434";
  s.crossOrigin = "anonymous";
  document.head.appendChild(s);
}

export function getConsent(): "accepted" | "rejected" | null {
  try { return localStorage.getItem(CONSENT_KEY) as "accepted" | "rejected" | null; } catch { return null; }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getConsent();
    if (consent === "accepted") { loadAdSense(); return; }
    if (consent === null) setVisible(true);
  }, []);

  function accept() {
    try { localStorage.setItem(CONSENT_KEY, "accepted"); } catch { /* ignore */ }
    loadAdSense();
    setVisible(false);
  }

  function reject() {
    try { localStorage.setItem(CONSENT_KEY, "rejected"); } catch { /* ignore */ }
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 260 }}
          className="fixed bottom-4 left-4 right-4 z-50 max-w-lg mx-auto"
        >
          <div className="bg-card border border-border rounded-xl shadow-lg p-4 flex flex-col gap-3"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.10)" }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#262418" }}>
                <Cookie className="w-4 h-4" style={{ color: "#d2ad62" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Ta strona używa plików cookie</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Używamy cookies do personalizacji reklam (Google AdSense) oraz analizy ruchu. Możesz zaakceptować lub odrzucić pliki cookie innych firm.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={reject}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors border border-border"
              >
                <X className="w-3 h-3" /> Odrzuć
              </button>
              <button
                onClick={accept}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                style={{ background: "#d2ad62" }}
              >
                <Check className="w-3 h-3" /> Akceptuję
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
