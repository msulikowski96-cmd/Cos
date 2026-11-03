import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { usePageTitle } from "@/lib/usePageTitle";

export default function Terms() {
  usePageTitle("Regulamin");
  return (
    <div className="bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/">
          <span className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-8 cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Powrót do strony głównej
          </span>
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2 mt-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Regulamin
        </h1>
        <p className="text-sm text-muted-foreground mb-8">Ostatnia aktualizacja: 31 marca 2026 r.</p>

        <div className="prose-custom">
          <section>
            <h2>1. Postanowienia ogólne</h2>
            <p>
              Niniejszy Regulamin określa zasady korzystania z serwisu internetowego Nexus Draft (dalej: „Serwis"),
              dostępnego pod adresem <strong>nexus-sight.com.pl</strong>.
            </p>
            <p>
              Serwis jest darmowym narzędziem do wyszukiwania i analizy publicznie dostępnych statystyk graczy
              gry League of Legends, korzystającym z oficjalnego API Riot Games.
            </p>
            <p>
              Korzystanie z Serwisu oznacza akceptację niniejszego Regulaminu. Jeśli nie zgadzasz się z postanowieniami
              Regulaminu, prosimy o zaprzestanie korzystania z Serwisu.
            </p>
          </section>

          <section>
            <h2>2. Opis usługi</h2>
            <p>Serwis Nexus Draft umożliwia użytkownikom:</p>
            <ul>
              <li>Wyszukiwanie graczy League of Legends po Riot ID (nazwa gracza i tag) na dowolnym serwerze regionalnym</li>
              <li>Przeglądanie rang i statystyk rankingowych (Solo/Duo, Flex)</li>
              <li>Analizę historii meczy z szczegółowymi statystykami każdej gry</li>
              <li>Przeglądanie mistrzostwa bohaterów i puli postaci</li>
              <li>Głęboką analizę AI obejmującą: archetyp stylu gry, wskaźnik tiltu, analizę early game, statystyki obiektywów, wzorce rozgrywki, warunki zwycięstwa i krzywą mocy</li>
              <li>Szacowanie realnej rangi gracza na podstawie algorytmu AI</li>
              <li>Podgląd aktywnej gry (live game) z informacjami o wszystkich uczestnikach</li>
            </ul>
          </section>

          <section>
            <h2>3. Zasady korzystania</h2>
            <p>Użytkownik zobowiązuje się do:</p>
            <ul>
              <li>Korzystania z Serwisu zgodnie z obowiązującym prawem i dobrymi obyczajami</li>
              <li>Niekorzystania z Serwisu w sposób, który mógłby zakłócić jego prawidłowe funkcjonowanie</li>
              <li>Niewykonywania zautomatyzowanych zapytań (scraping, boty) bez wyraźnej zgody administratora</li>
              <li>Niepodejmowania prób obejścia zabezpieczeń Serwisu</li>
              <li>Niekorzystania z danych uzyskanych za pośrednictwem Serwisu w celach niezgodnych z prawem</li>
            </ul>
          </section>

          <section>
            <h2>4. Dane i treści</h2>
            <p>
              Wszystkie dane o graczach wyświetlane w Serwisie pochodzą z oficjalnego API Riot Games i są publicznie
              dostępne. Serwis nie przechowuje trwale danych osobowych graczy na własnych serwerach.
            </p>
            <p>
              Analiza AI (archetypy stylu gry, szacowana ranga, wskaźniki) jest generowana algorytmicznie na podstawie
              statystyk z ostatnich meczy i ma charakter wyłącznie informacyjny. Wyniki analizy nie stanowią oficjalnych
              ocen Riot Games.
            </p>
          </section>

          <section>
            <h2>5. Własność intelektualna</h2>
            <p>
              Serwis Nexus Draft, jego interfejs, algorytmy analizy i treści redakcyjne są własnością zespołu Nexus Draft
              i podlegają ochronie prawem autorskim.
            </p>
            <p>
              League of Legends, Riot Games oraz wszystkie powiązane znaki graficzne, nazwy bohaterów i materiały
              graficzne są własnością Riot Games, Inc. i są wykorzystywane zgodnie z warunkami API Riot Games.
            </p>
            <p>
              Nexus Draft nie jest zatwierdzony przez Riot Games i nie odzwierciedla poglądów ani opinii Riot Games
              ani żadnej osoby oficjalnie zaangażowanej w tworzenie lub zarządzanie właściwościami Riot Games.
            </p>
          </section>

          <section>
            <h2>6. Reklamy</h2>
            <p>
              Serwis może wyświetlać reklamy za pośrednictwem Google AdSense i innych sieci reklamowych.
              Reklamy mogą wykorzystywać pliki cookies do personalizacji treści reklamowych.
              Szczegółowe informacje na temat cookies i reklam znajdują się w naszej{" "}
              <Link href="/privacy"><span className="text-primary hover:underline cursor-pointer">Polityce Prywatności</span></Link>.
            </p>
          </section>

          <section>
            <h2>7. Ograniczenie odpowiedzialności</h2>
            <p>
              Serwis jest udostępniany w stanie „takim, jaki jest" (as-is), bez jakichkolwiek gwarancji.
              Administrator nie ponosi odpowiedzialności za:
            </p>
            <ul>
              <li>Przerwy w dostępności Serwisu wynikające z przyczyn technicznych lub konserwacji</li>
              <li>Dokładność, kompletność lub aktualność danych pobieranych z API Riot Games</li>
              <li>Decyzje podjęte przez użytkownika na podstawie informacji z Serwisu</li>
              <li>Szkody wynikające z korzystania lub niemożności korzystania z Serwisu</li>
            </ul>
          </section>

          <section>
            <h2>8. Dostępność Serwisu</h2>
            <p>
              Administrator dokłada starań, aby Serwis był dostępny nieprzerwanie, jednak nie gwarantuje jego
              ciągłej dostępności. Serwis korzysta z zewnętrznego API Riot Games, które może podlegać ograniczeniom
              (rate limiting), przerwom technicznym lub zmianom.
            </p>
          </section>

          <section>
            <h2>9. Zmiany Regulaminu</h2>
            <p>
              Administrator zastrzega sobie prawo do zmiany niniejszego Regulaminu w dowolnym czasie.
              Zmiany wchodzą w życie z chwilą ich publikacji na tej stronie.
              Dalsze korzystanie z Serwisu po wprowadzeniu zmian oznacza ich akceptację.
            </p>
          </section>

          <section>
            <h2>10. Kontakt</h2>
            <p>
              W razie pytań dotyczących Regulaminu prosimy o kontakt poprzez stronę{" "}
              <Link href="/about"><span className="text-primary hover:underline cursor-pointer">O nas</span></Link>{" "}
              lub bezpośrednio pod adresem e-mail: <strong>kontakt@nexus-sight.com</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
