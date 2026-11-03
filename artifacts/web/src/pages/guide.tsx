import { Link } from "wouter";
import { ArrowLeft, BookOpen, BarChart3, Eye, Brain, Swords, Target, TrendingUp, Zap } from "lucide-react";
import { usePageTitle } from "@/lib/usePageTitle";

export default function Guide() {
  usePageTitle("Poradnik");
  return (
    <div className="bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/">
          <span className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-8 cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Powrót do strony głównej
          </span>
        </Link>

        <div className="flex items-center gap-3 mt-4 mb-6">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ background: "#262418", border: "1px solid #6b5a35" }}>
            <BookOpen className="w-6 h-6" style={{ color: "#d2ad62" }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Poradnik analizy statystyk
            </h1>
            <p className="text-sm text-muted-foreground">Jak czytać i wykorzystywać dane z Nexus Draft</p>
          </div>
        </div>

        <div className="prose-custom">
          <section>
            <h2>Dlaczego analiza statystyk jest ważna?</h2>
            <p>
              W League of Legends poprawa umiejętności wymaga świadomości własnych błędów. Większość graczy skupia
              się na mechanice, zapominając o fundamentalnych aspektach gry — kontroli wizji, zarządzaniu falami
              stworów czy podejmowaniu decyzji makro. Nexus Draft pomaga zidentyfikować te obszary za pomocą
              konkretnych liczb i wskaźników.
            </p>
            <p>
              Statystyki nie kłamią — jeśli Twoje średnie KDA wynosi 2.5 a w Twojej randze norma to 3.5,
              masz jasny sygnał, nad czym pracować. Nexus Draft przetwarza dane z wielu meczy, żeby wyeliminować
              przypadkowe wahania i pokazać prawdziwy obraz Twojej gry.
            </p>
          </section>

          <section>
            <h2><span className="inline-flex items-center gap-2"><BarChart3 className="w-5 h-5" style={{ color: "#d2ad62" }} /> Kluczowe wskaźniki</span></h2>

            <h3>KDA (Kill/Death/Assist Ratio)</h3>
            <p>
              Stosunek zabójstw i asyst do zgonów. KDA powyżej 3.0 uznaje się za dobre, a powyżej 4.0 za bardzo dobre.
              Niskie KDA (poniżej 2.0) oznacza nadmierną agresję bez odpowiedniego wsparca lub złe pozycjonowanie w teamfightach.
              Pamiętaj, że KDA różni się w zależności od roli — jungler i support naturalnie mają wyższe asyty,
              a toplaner może mieć mniej killów jeśli gra na tanku.
            </p>

            <h3>CS/min (Creep Score na minutę)</h3>
            <p>
              Miara efektywności farmienia. Benchmark dla różnych rang: Żelazo-Brąz: 4-5, Srebro-Złoto: 5-7,
              Platyna+: 7-8, Diament+: 8+. Jeśli Twoje CS/min jest poniżej normy dla Twojej rangi, tracisz dużo
              złota — nawet 1 CS/min różnicy to około 350 złota mniej w 15 minut gry.
            </p>

            <h3>Kill Participation (%)</h3>
            <p>
              Procent zabójstw drużyny, w których uczestniczyłeś (kill lub assist). Wartość powyżej 60% oznacza,
              że aktywnie pomagasz drużynie. Poniżej 40% sugeruje, że grasz zbyt pasywnie lub jesteś odcięty od drużyny.
              Dla supportów i junglerów naturalny KP jest wyższy (65-75%), a dla toplinerów niższy (45-55%).
            </p>

            <h3>Damage Share (%)</h3>
            <p>
              Twój procent obrażeń drużyny zadanych championom przeciwnika. Carry (ADC/mid) powinni mieć 25-35%.
              Jeśli grasz carry ale masz poniżej 20%, nie wypełniasz swojej roli. Jeśli grasz tanka z 30%+ damage share,
              Twoi carry nie dostarczają wystarczająco dużo obrażeń.
            </p>
          </section>

          <section>
            <h2><span className="inline-flex items-center gap-2"><Eye className="w-5 h-5" style={{ color: "#d2ad62" }} /> Vision Score i kontrola wizji</span></h2>
            <p>
              Vision Score to jeden z najbardziej niedocenianych wskaźników w grze. Wysoki Vision Score oznacza,
              że aktywnie stawiasz wardy, niszczysz wardy przeciwnika i kupujesz Control Wardy.
            </p>
            <p>
              Reguła kciuka: Twój Vision Score powinien być co najmniej równy długości gry w minutach.
              W 30-minutowym meczu celuj w VS 30+. Supporty powinny mieć 1.5-2× więcej. Kupuj minimum 1 Control Ward
              na każde 5 minut gry — to najtańsza inwestycja w bezpieczeństwo na mapie.
            </p>
          </section>

          <section>
            <h2><span className="inline-flex items-center gap-2"><Brain className="w-5 h-5" style={{ color: "#d2ad62" }} /> Analiza AI — jak z niej korzystać</span></h2>
            <p>
              Nexus Draft oferuje zaawansowaną analizę AI, która przetwarza dane z Twoich ostatnich meczy rankingowych
              i generuje spersonalizowany raport. Raport zawiera ocenę stylu gry (archetyp), radar umiejętności
              (makro, mikro, wizja, teamfight, laning, konsekwencja), listę priorytetów do poprawy z konkretnymi
              wartościami docelowymi, wskazówki coachingowe i rekomendacje championów.
            </p>
            <p>
              Aby uzyskać najdokładniejszą analizę, rozegraj minimum 15-20 meczy rankingowych. Im więcej danych,
              tym lepiej AI identyfikuje wzorce w Twojej grze — zarówno mocne strony, jak i powtarzające się błędy.
            </p>
          </section>

          <section>
            <h2><span className="inline-flex items-center gap-2"><Swords className="w-5 h-5" style={{ color: "#d2ad62" }} /> Kalkulator Buildu</span></h2>
            <p>
              Kalkulator Buildu w Nexus Draft to narzędzie algorytmiczne, które analizuje skład drużyny przeciwnej
              i sugeruje optymalne przedmioty, buty i runy dla Twojego championa. Działa na bazie ponad 140 profili
              championów z uwzględnieniem typu obrażeń (AD/AP/Hybrid), klasy (Tank, Fighter, Mage, Marksman, Assassin),
              tagów (mobilność, CC, sustain, poke) oraz specjalnych cech (leczenie, tarcze, procent HP).
            </p>
            <p>
              Wybierz swojego championa, dodaj do 5 przeciwników, a algorytm dobierze przedmioty przeciwdziałające
              największym zagrożeniom — Antyheal na przeciwników z leczeniem, Zhonya/QSS na dużo CC,
              penetrację pancerza lub MR w zależności od proporcji obrażeń drużyny przeciwnej.
            </p>
          </section>

          <section>
            <h2><span className="inline-flex items-center gap-2"><Zap className="w-5 h-5" style={{ color: "#d2ad62" }} /> Live Game — podgląd gry na żywo</span></h2>
            <p>
              Funkcja Live Game pozwala podejrzeć aktywny mecz dowolnego gracza w czasie rzeczywistym.
              Zobaczysz rangi SoloQ i Flex wszystkich 10 uczestników, ich runy, czarowniki przywołacza
              oraz zakazanych championów. Timer pokazuje aktualny czas meczu.
            </p>
            <p>
              Live Game jest szczególnie przydatny na początku meczu — możesz szybko ocenić siłę obu drużyn,
              zidentyfikować najsłabszych i najsilniejszych graczy, a także zobaczyć jakie runy i czarowniki wybrali
              Twoi przeciwnicy, żeby odpowiednio dostosować strategię.
            </p>
          </section>

          <section>
            <h2><span className="inline-flex items-center gap-2"><Target className="w-5 h-5" style={{ color: "#d2ad62" }} /> Jak wspinać się w rankingu</span></h2>
            <p>
              Na podstawie analizy tysięcy profili graczy, oto najskuteczniejsze sposoby na zdobywanie LP:
            </p>
            <ul>
              <li><strong>Ogranicz pulę championów</strong> — graj 2-3 postacie na swojej głównej roli. Specjalizacja daje lepsze wyniki niż wszechstronność.</li>
              <li><strong>Skup się na CS</strong> — poprawa farmienia o 1 CS/min daje około 350 złota więcej na 15 minut. To jak dodatkowy kill co 5 minut.</li>
              <li><strong>Kupuj Control Wardy</strong> — inwestycja 75 złota, która może uratować Ci życie lub pomóc w rozgrywce na cele.</li>
              <li><strong>Nie graj na tilcie</strong> — po 2 porażkach z rzędu zrób przerwę. Wskaźnik Tilt w Nexus Draft pokaże Ci, kiedy giniesz nadmiernie.</li>
              <li><strong>Analizuj swoje zgony</strong> — każdy zgon to stracone 20-50 sekund + złoto i doświadczenie dla przeciwnika. Celuj w mniej niż 5 zgonów na mecz.</li>
              <li><strong>Rozgrywaj cele</strong> — po wygranym teamfighcie bierz Barona/Smoka zamiast ganiać killów. Cele wygrywają gry.</li>
            </ul>
          </section>

          <section>
            <h2><span className="inline-flex items-center gap-2"><TrendingUp className="w-5 h-5" style={{ color: "#d2ad62" }} /> Benchmarki dla każdej rangi</span></h2>
            <div className="overflow-x-auto my-4">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #233047" }}>
                    <th style={{ textAlign: "left", padding: "8px", fontWeight: 700 }}>Ranga</th>
                    <th style={{ textAlign: "center", padding: "8px", fontWeight: 700 }}>KDA</th>
                    <th style={{ textAlign: "center", padding: "8px", fontWeight: 700 }}>CS/min</th>
                    <th style={{ textAlign: "center", padding: "8px", fontWeight: 700 }}>Vision Score/min</th>
                    <th style={{ textAlign: "center", padding: "8px", fontWeight: 700 }}>Kill Part.</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { rank: "Żelazo-Brąz", kda: "1.5-2.5", cs: "4.0-5.0", vs: "0.4-0.5", kp: "35-45%" },
                    { rank: "Srebro", kda: "2.5-3.0", cs: "5.5-6.5", vs: "0.5-0.7", kp: "45-55%" },
                    { rank: "Złoto", kda: "3.0-3.5", cs: "6.5-7.0", vs: "0.7-0.8", kp: "50-58%" },
                    { rank: "Platyna", kda: "3.2-3.8", cs: "7.0-7.5", vs: "0.8-1.0", kp: "55-62%" },
                    { rank: "Szmaragd", kda: "3.5-4.0", cs: "7.5-8.0", vs: "0.9-1.1", kp: "58-65%" },
                    { rank: "Diament+", kda: "3.8-5.0", cs: "8.0-9.0", vs: "1.0-1.3", kp: "60-70%" },
                  ].map((r) => (
                    <tr key={r.rank} style={{ borderBottom: "1px solid #233047" }}>
                      <td style={{ padding: "8px", fontWeight: 600 }}>{r.rank}</td>
                      <td style={{ textAlign: "center", padding: "8px" }}>{r.kda}</td>
                      <td style={{ textAlign: "center", padding: "8px" }}>{r.cs}</td>
                      <td style={{ textAlign: "center", padding: "8px" }}>{r.vs}</td>
                      <td style={{ textAlign: "center", padding: "8px" }}>{r.kp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Użyj powyższej tabeli jako punktu odniesienia. Porównaj swoje statystyki z Nexus Draft do benchmarków
              dla Twojej rangi. Obszary, w których wypadasz poniżej normy, to Twoje priorytety do poprawy.
            </p>
          </section>

          <section>
            <h2>Jak zacząć?</h2>
            <p>
              Wejdź na <Link href="/"><span className="text-primary hover:underline cursor-pointer">stronę główną</span></Link>,
              wybierz swój serwer (np. EUW1), wpisz Riot ID (nazwa#tag) i kliknij „Szukaj".
              Twój profil z pełnymi statystykami pojawi się w kilka sekund. Dla pogłębionej analizy AI
              przejdź do zakładki „AI Analiza" na stronie profilu.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
