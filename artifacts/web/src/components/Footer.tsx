import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card/50 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
              NEXUS DRAFT
            </span>
            <span className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()}
            </span>
          </div>

          <nav className="flex items-center gap-4 text-xs">
            <Link href="/about">
              <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">O nas</span>
            </Link>
            <Link href="/poradnik">
              <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Poradnik</span>
            </Link>
            <Link href="/privacy">
              <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Polityka Prywatności</span>
            </Link>
            <Link href="/terms">
              <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Regulamin</span>
            </Link>
          </nav>
        </div>

        <div className="mt-4 pt-3 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-muted-foreground/60 text-center sm:text-left leading-relaxed max-w-lg">
            Nexus Draft nie jest zatwierdzony przez Riot Games i nie odzwierciedla poglądów ani opinii Riot Games
            ani żadnej osoby oficjalnie zaangażowanej w tworzenie lub zarządzanie właściwościami Riot Games.
          </p>
          <span className="text-[10px] text-muted-foreground/40 tracking-wider uppercase" style={{ fontFamily: "'Rajdhani',sans-serif" }}>
            Powered by Riot API
          </span>
        </div>
      </div>
    </footer>
  );
}
