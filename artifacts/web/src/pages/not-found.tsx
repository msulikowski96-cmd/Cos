import { Link } from "wouter";
import { Search, ArrowLeft, BarChart3, Brain, Swords } from "lucide-react";

export default function NotFound() {
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center mb-5"
          style={{ background: "#262418", border: "1px solid #6b5a35" }}>
          <Search className="w-7 h-7" style={{ color: "#d2ad62" }} />
        </div>

        <h1 className="text-4xl font-bold text-foreground mb-2"
          style={{ fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.02em" }}>
          404
        </h1>
        <p className="text-lg font-semibold text-foreground mb-1"
          style={{ fontFamily: "'Rajdhani',sans-serif" }}>
          Strona nie znaleziona
        </p>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Ta strona nie istnieje lub została przeniesiona. Sprawdź adres URL lub wróć do wyszukiwarki graczy.
        </p>

        <Link href="/">
          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white cursor-pointer transition-all hover:brightness-110"
            style={{ background: "#d2ad62", fontFamily: "'Rajdhani',sans-serif" }}>
            <ArrowLeft className="w-4 h-4" />
            Wróć do strony głównej
          </span>
        </Link>

        <div className="mt-14 text-left">
          <h2 className="text-base font-bold text-foreground mb-4"
            style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
            Co możesz zrobić w Nexus Draft?
          </h2>
          <div className="space-y-3">
            <div className="glass-panel p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#262418", border: "1px solid #6b5a35" }}>
                <BarChart3 className="w-4 h-4" style={{ color: "#d2ad62" }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Statystyki gracza</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  Wyszukaj dowolnego gracza po Riot ID i sprawdź jego rangę, historię meczy,
                  mistrzostwo bohaterów i 12+ wskaźników analitycznych.
                </p>
              </div>
            </div>

            <div className="glass-panel p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#1f1a33", border: "1px solid #4a3d80" }}>
                <Brain className="w-4 h-4" style={{ color: "#9c7bff" }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Analiza AI</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  Generowany przez sztuczną inteligencję raport z oceną stylu gry, wskazówkami
                  coachingowymi i polecanymi championami.
                </p>
              </div>
            </div>

            <div className="glass-panel p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#12271f", border: "1px solid #2a5c45" }}>
                <Swords className="w-4 h-4" style={{ color: "#46c08a" }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Live Game</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  Sprawdź aktywny mecz w czasie rzeczywistym — rangi, runy i czarownie
                  wszystkich 10 graczy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
