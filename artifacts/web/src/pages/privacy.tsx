import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { usePageTitle } from "@/lib/usePageTitle";

export default function Privacy() {
  usePageTitle("Polityka Prywatności");
  return (
    <div className="bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/">
          <span className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-8 cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Powrót do strony głównej
          </span>
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2 mt-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Polityka Prywatności
        </h1>
        <p className="text-sm text-muted-foreground mb-8">Ostatnia aktualizacja: 31 marca 2026 r.</p>

        <div className="prose-custom">
          <section>
            <h2>1. Informacje ogólne</h2>
            <p>
              Niniejsza Polityka Prywatności określa zasady przetwarzania i ochrony danych osobowych użytkowników serwisu
              Nexus Draft (dalej: „Serwis"), dostępnego pod adresem <strong>nexus-sight.com.pl</strong>.
              Administratorem Serwisu jest zespół Nexus Draft.
            </p>
            <p>
              Serwis umożliwia wyszukiwanie i analizę publicznie dostępnych statystyk graczy gry League of Legends,
              korzystając z oficjalnego API Riot Games. Korzystając z Serwisu, akceptujesz zasady opisane w niniejszej Polityce Prywatności.
            </p>
          </section>

          <section>
            <h2>2. Jakie dane zbieramy</h2>
            <p>Serwis może zbierać następujące dane:</p>
            <ul>
              <li><strong>Dane wyszukiwania</strong> — nazwy graczy (Riot ID) wpisywane w wyszukiwarkę Serwisu. Są one wykorzystywane wyłącznie do wykonania zapytań do API Riot Games i nie są trwale przechowywane na naszych serwerach.</li>
              <li><strong>Historia wyszukiwań</strong> — zapisywana lokalnie w przeglądarce użytkownika (localStorage) w celu ułatwienia ponownego wyszukiwania. Dane te nie są przesyłane na nasze serwery.</li>
              <li><strong>Dane techniczne</strong> — adres IP, typ przeglądarki, system operacyjny, czas wizyty. Dane te są zbierane automatycznie przez serwer hostingowy w celach diagnostycznych.</li>
              <li><strong>Pliki cookies</strong> — Serwis wykorzystuje pliki cookies niezbędne do prawidłowego działania oraz cookies podmiotów trzecich (Google AdSense, Google Analytics) w celach reklamowych i analitycznych.</li>
            </ul>
          </section>

          <section>
            <h2>3. Pliki cookies i technologie śledzenia</h2>
            <p>Serwis wykorzystuje następujące rodzaje plików cookies:</p>
            <ul>
              <li><strong>Cookies niezbędne</strong> — zapewniają prawidłowe działanie Serwisu (np. sesja użytkownika).</li>
              <li><strong>Cookies analityczne</strong> — pomagają zrozumieć, jak użytkownicy korzystają z Serwisu (np. Google Analytics).</li>
              <li><strong>Cookies reklamowe</strong> — wykorzystywane przez Google AdSense do wyświetlania spersonalizowanych reklam. Google może używać plików cookies do wyświetlania reklam na podstawie wcześniejszych wizyt użytkownika w Serwisie lub innych witrynach.</li>
            </ul>
            <p>
              Użytkownicy mogą zarządzać plikami cookies w ustawieniach swojej przeglądarki internetowej.
              Więcej informacji o tym, jak Google wykorzystuje dane z witryn partnerów, znajdziesz na stronie:{" "}
              <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
                policies.google.com/technologies/partner-sites
              </a>.
            </p>
          </section>

          <section>
            <h2>4. Google AdSense</h2>
            <p>
              Serwis korzysta z usługi Google AdSense do wyświetlania reklam. Google AdSense wykorzystuje pliki cookies
              do wyświetlania reklam dopasowanych do zainteresowań użytkowników. Plik cookie DART umożliwia firmie Google
              wyświetlanie reklam na podstawie wizyt użytkownika w Serwisie oraz w innych witrynach internetowych.
            </p>
            <p>
              Użytkownicy mogą zrezygnować z używania pliku cookie DART, odwiedzając stronę:{" "}
              <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
                adssettings.google.com
              </a>.
            </p>
          </section>

          <section>
            <h2>5. API Riot Games</h2>
            <p>
              Serwis korzysta z oficjalnego API Riot Games w celu pobierania publicznie dostępnych danych o graczach
              League of Legends, w tym: nazw przywoływaczy, rang, historii meczy, mistrzostwa bohaterów i statystyk gry.
            </p>
            <p>
              Nexus Draft nie jest powiązany z Riot Games ani przez Riot Games zatwierdzony. Riot Games oraz wszystkie
              powiązane właściwości są znakami towarowymi lub zarejestrowanymi znakami towarowymi Riot Games, Inc.
            </p>
          </section>

          <section>
            <h2>6. Udostępnianie danych</h2>
            <p>
              Nie sprzedajemy, nie wymieniamy ani nie przekazujemy danych osobowych użytkowników podmiotom trzecim,
              z wyjątkiem przypadków opisanych w niniejszej Polityce (np. Google AdSense, Google Analytics)
              lub gdy jest to wymagane przez prawo.
            </p>
          </section>

          <section>
            <h2>7. Bezpieczeństwo danych</h2>
            <p>
              Stosujemy odpowiednie środki techniczne i organizacyjne w celu ochrony danych przed nieautoryzowanym
              dostępem, utratą lub zniszczeniem. Połączenie z Serwisem jest szyfrowane protokołem HTTPS.
            </p>
          </section>

          <section>
            <h2>8. Prawa użytkowników</h2>
            <p>Każdy użytkownik ma prawo do:</p>
            <ul>
              <li>Dostępu do swoich danych osobowych</li>
              <li>Sprostowania nieprawidłowych danych</li>
              <li>Usunięcia danych (prawo do bycia zapomnianym)</li>
              <li>Ograniczenia przetwarzania danych</li>
              <li>Sprzeciwu wobec przetwarzania danych</li>
              <li>Przenoszenia danych</li>
            </ul>
            <p>
              W celu realizacji powyższych praw prosimy o kontakt pod adresem e-mail podanym na stronie{" "}
              <Link href="/about"><span className="text-primary hover:underline cursor-pointer">O nas</span></Link>.
            </p>
          </section>

          <section>
            <h2>9. Zmiany w Polityce Prywatności</h2>
            <p>
              Zastrzegamy sobie prawo do wprowadzania zmian w niniejszej Polityce Prywatności. Wszelkie zmiany
              będą publikowane na tej stronie wraz z datą ostatniej aktualizacji.
            </p>
          </section>

          <section>
            <h2>10. Kontakt</h2>
            <p>
              W razie pytań dotyczących Polityki Prywatności prosimy o kontakt poprzez stronę{" "}
              <Link href="/about"><span className="text-primary hover:underline cursor-pointer">O nas</span></Link>{" "}
              lub bezpośrednio pod adresem e-mail: <strong>kontakt@nexus-sight.com</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
