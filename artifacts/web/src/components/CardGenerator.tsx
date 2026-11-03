import { useState } from "react";
import { Loader2, Download, AlertCircle, ImageIcon, Sparkles } from "lucide-react";

interface RankedEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

interface CardGeneratorProps {
  gameName: string;
  tagLine: string;
  region: string;
  rankedEntry?: RankedEntry | null;
}

export default function CardGenerator({ gameName, tagLine, region, rankedEntry }: CardGeneratorProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setImageUrl(null);
    try {
      const res = await fetch("/api/card/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ gameName, tagLine, region, rankedEntry: rankedEntry ?? null }),
      });
      if (!res.ok) {
        let msg = "Błąd generowania karty.";
        try {
          const json = await res.json();
          if (json.error) msg = json.error;
        } catch {}
        throw new Error(msg);
      }
      const blob = await res.blob();
      setImageUrl(URL.createObjectURL(blob));
    } catch (e: any) {
      setError(e.message ?? "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Info card */}
      <div className="rounded-xl p-4" style={{ background: "#121926", border: "1px solid #233047", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <p className="text-[9px] uppercase tracking-[0.15em] font-bold mb-1 flex items-center gap-1" style={{ color: "#d2ad62", fontFamily: "'Rajdhani',sans-serif" }}>
          <ImageIcon className="w-3 h-3" /> Karta gracza
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Wygeneruj spersonalizowaną kartę profilową z Twoimi statystykami rankingowymi gotową do pobrania i udostępnienia.
        </p>
      </div>

      {/* Generate button */}
      <button
        onClick={generate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60"
        style={{
          background: loading ? "#6b5a35" : "#d2ad62",
          color: "white",
          fontFamily: "'Rajdhani',sans-serif",
          letterSpacing: "0.1em",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? "none" : "0 2px 12px hsl(200,90%,38%,0.3)",
        }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generuję kartę…
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            WYGENERUJ KARTĘ
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
          style={{ background: "#2a1519", border: "1px solid #2a1519", color: "#f0545c" }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="w-full flex justify-center">
          <div className="w-[200px] h-[300px] rounded-2xl animate-pulse flex items-center justify-center"
            style={{ background: "#172031", border: "1px solid #233047" }}>
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#d2ad62" }} />
          </div>
        </div>
      )}

      {/* Generated card */}
      {!loading && imageUrl && (
        <div className="flex flex-col items-center gap-3">
          <div className="relative group rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <img
              src={imageUrl}
              alt="Karta gracza"
              className="w-full max-w-[240px] rounded-2xl"
              style={{ display: "block" }}
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
              <a
                href={imageUrl}
                download={`${gameName}-${tagLine}-card.png`}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
                style={{ background: "#121926", color: "#0f172a" }}
              >
                <Download className="w-4 h-4" />
                Pobierz
              </a>
            </div>
          </div>

          {/* Download button (always visible on mobile) */}
          <a
            href={imageUrl}
            download={`${gameName}-${tagLine}-card.png`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: "#12271f",
              border: "1px solid #2a5c45",
              color: "#46c08a",
              fontFamily: "'Rajdhani',sans-serif",
              letterSpacing: "0.08em",
              textDecoration: "none",
            }}
          >
            <Download className="w-4 h-4" />
            POBIERZ PNG
          </a>

          <p className="text-[10px] text-muted-foreground/50 text-center">
            Udostępnij na social mediach lub w grupach LoL!
          </p>
        </div>
      )}
    </div>
  );
}
