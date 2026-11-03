import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, BarChart3, Zap, Shield, Users, Clock, X, Activity, Heart, Sparkles, Swords } from "lucide-react";
import { getFavorites, toggleFavorite, type Favorite } from "@/lib/favorites";
import { usePageTitle } from "@/lib/usePageTitle";

const HISTORY_KEY = "nexus_sight_history";
const MAX_HISTORY = 8;

type HistoryEntry = { gameName: string; tagLine: string; region: string; ts: number };

function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"); } catch { return []; }
}
function saveHistory(entries: HistoryEntry[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(entries)); } catch { /* ignore */ }
}
export function pushHistory(gameName: string, tagLine: string, region: string) {
  const existing = loadHistory().filter(
    e => !(e.gameName.toLowerCase() === gameName.toLowerCase() && e.tagLine.toLowerCase() === tagLine.toLowerCase() && e.region === region)
  );
  const updated: HistoryEntry[] = [{ gameName, tagLine, region, ts: Date.now() }, ...existing].slice(0, MAX_HISTORY);
  saveHistory(updated);
}

const REGIONS = [
  "EUW1", "NA1", "KR", "EUN1", "BR1", "LA1", "LA2", "OC1", "TR1", "RU", "JP1", "PH2", "SG2", "TW2", "TH2", "VN2"
];

const FEATURES = [
  {
    icon: BarChart3,
    title: "Głęboka analiza",
    desc: "12 wskaźników, archetyp stylu gry, early game, obiektywy, wskaźnik tiltu",
    color: "#d2ad62",
    border: "#6b5a35",
    bg: "#262418",
  },
  {
    icon: Zap,
    title: "Live w meczu",
    desc: "Aktywna gra w czasie rzeczywistym — rangi, runy, czarownie i bany",
    color: "#46c08a",
    border: "#2a5c45",
    bg: "#12271f",
  },
  {
    icon: Shield,
    title: "Historia meczy",
    desc: "KDA, OP Score, skład drużyn i porównanie z oponentem z lane",
    color: "#e8a93c",
    border: "#6b4f22",
    bg: "#2a2212",
  },
  {
    icon: Users,
    title: "Szacowana ranga",
    desc: "Algorytm AI oblicza realną rangę gracza na podstawie stylu gry",
    color: "#9c7bff",
    border: "#4a3d80",
    bg: "#1f1a33",
  },
];

const TOOLS = [
  {
    href: "/optymalizator",
    icon: Sparkles,
    title: "Optymalizator Build & Run",
    desc: "Wybierz swojego championa + skład wroga → AI generuje runy, sumony i pełny build na ten matchup",
    badge: "AI",
    color: "#9c7bff",
    border: "#4a3d80",
    bg: "#1f1a33",
  },
];

const QUICK_SEARCH = [
  { name: "Faker", tag: "T1", region: "KR" },
  { name: "Caps", tag: "EUW", region: "EUW1" },
];

const FAQ_ITEMS = [
  {
    q: "Jak sprawdzić statystyki gracza League of Legends?",
    a: "Wpisz Riot ID gracza (nazwa i tag, np. Faker#T1) w wyszukiwarkę na stronie głównej, wybierz odpowiedni region i kliknij Szukaj. W ciągu kilku sekund zobaczysz pełny profil gracza z rangami, historią meczy i analizą AI.",
  },
  {
    q: "Czym jest analiza AI w Nexus Draft?",
    a: "Nasza analiza AI to zestaw 22 autorskich algorytmów, które analizują ostatnie mecze gracza i generują unikalne wskaźniki: archetyp stylu gry, wskaźnik tiltu, warunki zwycięstwa, krzywą mocy, analizę early game i spersonalizowane porady coachingowe.",
  },
  {
    q: "Czy Nexus Draft jest darmowy?",
    a: "Tak, Nexus Draft jest całkowicie darmowy. Nie wymaga rejestracji ani logowania. Wystarczy wpisać nazwę gracza i tag, aby zobaczyć pełne statystyki i analizę.",
  },
  {
    q: "Jakie regiony są obsługiwane?",
    a: "Obsługujemy wszystkie oficjalne serwery League of Legends: EUW, EUNE, NA, KR, BR, LAN, LAS, OCE, TR, RU, JP oraz serwery azjatyckie (PH, SG, TW, TH, VN).",
  },
  {
    q: "Co to jest szacowana ranga AI?",
    a: "Szacowana ranga to algorytm, który oblicza realny poziom gracza na podstawie faktycznych statystyk z meczy (CS/min, KDA, kontrola wardów, obiektywna gra), niezależnie od aktualnego LP. Dzięki temu możesz zobaczyć, na jakim poziomie naprawdę grasz.",
  },
  {
    q: "Czy mogę sprawdzić, czy ktoś jest w aktywnej grze?",
    a: "Tak! Nexus Draft automatycznie wykrywa, czy gracz jest w aktywnej grze. Jeśli tak, zobaczysz baner Live Game na profilu z linkiem do szczegółowego podglądu meczu — z rangami, runami, czarowniami i banami wszystkich 10 uczestników.",
  },
  {
    q: "Skąd pochodzą dane?",
    a: "Wszystkie dane pobieramy bezpośrednio z oficjalnego API Riot Games. Są to publicznie dostępne statystyki — dokładnie te same, które widoczne są w kliencie gry i na innych platformach typu OP.GG.",
  },
];

export default function Home() {
  usePageTitle();
  const [, setLocation] = useLocation();
  const [region, setRegion] = useState("EUW1");
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [focused, setFocused] = useState(false);
  const prefetchedRef = useRef(false);

  useEffect(() => {
    setHistory(loadHistory());
    setFavorites(getFavorites());
  }, []);

  const prefetchProfile = useCallback(() => {
    if (!prefetchedRef.current) {
      prefetchedRef.current = true;
      import("@/pages/profile");
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameName || !tagLine) return;
    const name = gameName.trim();
    const tag = tagLine.trim().replace(/^#/, "");
    pushHistory(name, tag, region);
    setHistory(loadHistory());
    setLocation(`/profile/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
  };

  const handleQuick = (q: typeof QUICK_SEARCH[number]) => {
    setLocation(`/profile/${q.region}/${encodeURIComponent(q.name)}/${q.tag}`);
  };

  return (
    <div className="relative flex flex-col items-center justify-center px-4 overflow-hidden py-12">

      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute inset-0 bg-background/70 z-5" />
        <img
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt=""
          className="w-full h-full object-cover opacity-10"
        />
      </div>

      <div className="z-10 w-full max-w-2xl flex flex-col items-center">

        <motion.div
          initial={{ opacity: 0, y: -28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="relative">
              <div className="w-14 h-14 flex items-center justify-center"
                style={{
                  background: "#262418",
                  border: "1px solid #6b5a35",
                  borderRadius: "8px",
                  boxShadow: "0 2px 12px rgba(0,130,180,0.1)",
                }}>
                <Activity className="w-7 h-7" style={{ color: "#d2ad62" }} />
              </div>
              <div className="corner-accent corner-accent-tl" />
              <div className="corner-accent corner-accent-br" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-[0.06em] leading-none text-gradient-cyan"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900 }}>
                STATYSTYKI LEAGUE OF LEGENDS
              </h1>
              <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mt-1"
                style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}>
                NEXUS DRAFT · Analiza Statystyk
              </p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-light leading-relaxed max-w-md mx-auto">
            Sprawdź statystyki każdego gracza — analiza gry, historia meczy, live game i szacowana ranga AI.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onSubmit={handleSearch}
          className="w-full mb-5"
        >
          <div
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-0 overflow-hidden"
            style={{
              background: "#121926",
              border: focused ? "1px solid #d2ad62" : "1px solid #233047",
              borderRadius: "10px",
              boxShadow: focused
                ? "0 0 0 3px rgba(0,130,180,0.08), 0 8px 30px rgba(0,0,0,0.08)"
                : "0 4px 20px rgba(0,0,0,0.06)",
              transition: "all 0.2s",
              padding: "6px",
            }}
          >
            <div className="border-b sm:border-b-0 sm:border-r border-border pb-2 sm:pb-0 sm:pr-3 sm:mr-2 mb-2 sm:mb-0">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="w-full sm:w-auto bg-transparent border-none focus:ring-0 cursor-pointer outline-none py-3 px-3 text-sm font-semibold appearance-none"
                style={{ color: "#d2ad62", fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}
              >
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="flex flex-1 items-center gap-1 px-2">
              <Search className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              <input
                type="text"
                placeholder="Nazwa gracza"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                onFocus={() => { setFocused(true); prefetchProfile(); }}
                onBlur={() => setFocused(false)}
                className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground/50 focus:ring-0 outline-none py-3 px-2 text-base min-w-0"
                required
              />
              <span className="text-muted-foreground/30 font-light text-xl select-none">#</span>
              <input
                type="text"
                placeholder="TAG"
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="w-20 bg-transparent border-none text-foreground placeholder:text-muted-foreground/40 focus:ring-0 outline-none py-3 px-2 text-base"
                style={{ fontFamily: "'Rajdhani',sans-serif" }}
                required
              />
            </div>

            <button type="submit" className="search-btn flex items-center justify-center gap-2 px-7 py-3.5 rounded-[6px] text-sm group">
              SZUKAJ
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.38 }}
          className="mb-4 w-full"
        >
          <AnimatePresence>
            {favorites.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                  <span className="data-label">Ulubieni gracze</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {favorites.map((f) => (
                    <motion.div
                      key={`${f.gameName}-${f.tagLine}-${f.region}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      className="flex items-center gap-0 rounded-[6px] overflow-hidden"
                      style={{ background: "#2a1519", border: "1px solid #2a1519", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                    >
                      <button
                        onClick={() => setLocation(`/profile/${f.region}/${encodeURIComponent(f.gameName)}/${encodeURIComponent(f.tagLine)}`)}
                        className="text-[11px] px-3 py-1.5 text-left transition-colors hover:bg-red-50"
                        style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 600 }}
                      >
                        <span className="font-bold text-foreground">{f.gameName}</span>
                        <span className="text-red-400">#{f.tagLine}</span>
                        <span className="ml-2 text-[9px] tracking-wider text-muted-foreground">{f.region}</span>
                      </button>
                      <button
                        onClick={() => {
                          toggleFavorite(f);
                          setFavorites(getFavorites());
                        }}
                        className="pr-2.5 pl-1 text-red-300 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Wejście do analizatora draftu — druga połowa aplikacji */}
        <Link
          href="/draft"
          className="group mt-8 flex w-full max-w-2xl items-center gap-4 rounded-[14px] border border-line p-4 text-left transition-colors hover:border-gold"
          style={{ background: "linear-gradient(110deg, color-mix(in srgb, var(--blue) 12%, var(--panel)), var(--panel) 45%, color-mix(in srgb, var(--red) 12%, var(--panel)))" }}
        >
          <span className="hex-frame grid h-12 w-12 shrink-0 place-items-center bg-gold-soft text-gold">
            <Swords className="h-6 w-6" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="eyebrow block !text-gold">Nowość · Analizator draftu</span>
            <span className="block font-display text-2xl font-bold uppercase leading-tight">Kto wygra ten draft?</span>
            <span className="block text-sm text-subtle">
              Ułóż oba składy albo wczytaj mecz na żywo — krzywa siły, plan gry i trener AI.
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-subtle transition-transform group-hover:translate-x-1 group-hover:text-gold" aria-hidden />
        </Link>

        <section
          aria-labelledby="seo-intro-heading"
          className="mt-16 w-full max-w-4xl prose-custom text-left"
        >
          <h2 id="seo-intro-heading">Statystyki graczy LoL i analiza gry</h2>
          <p>
            Nexus Draft to polskojęzyczne narzędzie dla osób, które chcą lepiej rozumieć
            swoją grę w League of Legends. Wpisz Riot ID gracza, wybierz region i otrzymaj
            czytelny profil oparty na danych z oficjalnego API Riot Games. Zamiast przeglądać
            kilka serwisów, możesz w jednym miejscu sprawdzić rangę, ostatnie wyniki,
            bohaterów oraz najważniejsze wskaźniki meczu. To szybki sposób na znalezienie
            powtarzających się mocnych stron i elementów, nad którymi warto pracować.
          </p>

          <h3>Ranga, KDA i historia meczy</h3>
          <p>
            Profil gracza pokazuje aktualną rangę, punkty LP, zwycięstwa i porażki, a także
            historię rozegranych spotkań. Zobaczysz KDA, wynik OP Score, farmę, udział w
            zabójstwach i porównanie z przeciwnikiem na alei. Takie zestawienie pomaga
            ocenić nie tylko wynik pojedynczej gry, ale również kierunek rozwoju w czasie.
            Więcej informacji o tym, jak czytać te dane, znajdziesz w naszym{" "}
            <Link href="/poradnik">poradniku analizy statystyk LoL</Link>.
          </p>

          <h3>Podgląd aktywnej gry na żywo</h3>
          <p>
            Funkcja Live Game pozwala sprawdzić, czy wyszukany gracz jest w trakcie meczu.
            Jeśli dane są dostępne, zobaczysz obie drużyny, wybranych championów, rangi,
            runy, czary przywoływacza i bany. Dzięki temu możesz szybko przygotować się do
            spotkania albo przeanalizować sytuację na serwerze bez instalowania dodatkowej
            aplikacji.
          </p>

          <h2>Funkcje, które pomagają grać lepiej</h2>
          <h3>Analiza AI i spersonalizowane wskazówki</h3>
          <p>
            Statystyki są najbardziej wartościowe wtedy, gdy prowadzą do konkretnego
            działania. Nexus Draft łączy dane z wielu meczy z analizą AI, która pomaga
            rozpoznać styl gry, fazę laningu, kontrolę wizji, teamfighty i powtarzające się
            zgony. Raport wskazuje priorytety do poprawy oraz praktyczne porady coachingowe.
            Zalogowani użytkownicy mogą przejść do{" "}
            <Link href="/optymalizator">narzędzi AI</Link> albo uruchomić analizę z poziomu
            swojego profilu.
          </p>

          <h3>Mistrzostwo bohaterów i lepszy build</h3>
          <p>
            Sprawdź, na których championach grasz najczęściej i gdzie osiągasz najlepsze
            wyniki. Historia pozwala porównać role, wybory oraz konsekwencję w kolejnych
            meczach. Przed następną kolejką możesz też skorzystać z{" "}
            <Link href="/optymalizator">kalkulatora buildu i run</Link>, aby dopasować
            przedmioty do składu przeciwnika.
          </p>

          <h2>Jak zacząć analizę gracza?</h2>
          <p>
            Wyszukaj dowolny Riot ID w formularzu powyżej, na przykład nazwę i tag w formacie
            <strong> Gracz#EUW</strong>. Wybierz serwer, aby otrzymać właściwe dane regionalne.
            Nie musisz nic instalować. Jeśli chcesz poznać projekt i sposób działania,
            odwiedź stronę <Link href="/about">o Nexus Draft</Link> albo wróć do{" "}
            <Link href="/poradnik">poradnika League of Legends</Link>. Nexus Draft jest
            niezależnym narzędziem społecznościowym i nie jest zatwierdzony przez Riot Games.
          </p>
        </section>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-10 w-full"
        >
          {history.length > 0 ? (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="data-label">Ostatnio wyszukiwani</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {history.map((h) => (
                    <motion.div
                      key={`${h.gameName}-${h.tagLine}-${h.region}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      className="flex items-center gap-0 rounded-[6px] overflow-hidden"
                      style={{ background: "#121926", border: "1px solid #233047", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                    >
                      <button
                        onClick={() => setLocation(`/profile/${h.region}/${encodeURIComponent(h.gameName)}/${encodeURIComponent(h.tagLine)}`)}
                        className="text-[11px] px-3 py-1.5 text-left transition-colors hover:bg-muted"
                        style={{ color: "#a8b0bf", fontFamily: "'Rajdhani',sans-serif", fontWeight: 600 }}
                      >
                        <span className="font-bold text-foreground">{h.gameName}</span>
                        <span className="text-primary">#{h.tagLine}</span>
                        <span className="ml-2 text-[9px] tracking-wider text-muted-foreground">{h.region}</span>
                      </button>
                      <button
                        onClick={() => {
                          const updated = history.filter(e => !(e.gameName === h.gameName && e.tagLine === h.tagLine && e.region === h.region));
                          setHistory(updated);
                          saveHistory(updated);
                        }}
                        className="pr-2.5 pl-1 text-muted-foreground/40 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="data-label">Szybki podgląd:</span>
              {QUICK_SEARCH.map(q => (
                <button
                  key={q.name}
                  onClick={() => handleQuick(q)}
                  className="text-[11px] px-3 py-1.5 rounded-[6px] transition-all hover:scale-105"
                  style={{
                    background: "#121926",
                    border: "1px solid #233047",
                    color: "#a8b0bf",
                    fontFamily: "'Rajdhani',sans-serif",
                    fontWeight: 600,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  {q.name}<span className="text-primary">#{q.tag}</span>
                </button>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-4 mb-2 flex items-center gap-3"
        >
          <div className="h-px flex-1 max-w-16" style={{ background: "linear-gradient(to right, transparent, #233047)" }} />
          <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground/50" style={{ fontFamily: "'Rajdhani',sans-serif" }}>
            Powered by Riot API
          </span>
          <div className="h-px flex-1 max-w-16" style={{ background: "linear-gradient(to left, transparent, #233047)" }} />
        </motion.div>
      </div>
    </div>
  );
}
