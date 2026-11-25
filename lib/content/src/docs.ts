// Strony informacyjne: O nas, Polityka prywatności, Regulamin.
// Ta sama treść trafia do aplikacji (React) i do HTML generowanego na serwerze.

export interface Doc {
  path: "/about" | "/privacy" | "/terms";
  title: string;
  description: string;
  updated: string;
  lead?: string;
  body: string;
}

const EMAIL = "nexussight.kontakt@gmail.com";

export const ABOUT: Doc = {
  path: "/about",
  title: "O Nexus Draft",
  description:
    "Nexus Draft to darmowe, polskojęzyczne narzędzie dla graczy League of Legends: analiza draftu, statystyki graczy, kalkulator buildu i poradniki.",
  updated: "2026-11-25",
  lead:
    "Nexus Draft to darmowe, polskojęzyczne narzędzie dla graczy League of Legends, którzy chcą lepiej rozumieć swoje gry. Łączymy analizę draftu, statystyki graczy i poradniki w jednym miejscu, bez instalowania czegokolwiek.",
  body: `
## Co robimy

Większość serwisów ze statystykami pokazuje liczby. My staramy się pokazać, co z nich wynika. Dlatego obok danych z meczów znajdziesz wyjaśnienia, porównania z twoją rangą i konkretne wskazówki.

- **Analizator draftu** — ocenia oba składy, pokazuje szansę na wygraną z samego draftu, krzywą siły, plan gry i podpowiedzi championów. Potrafi wczytać trwający mecz prosto z API Riot Games. [Otwórz analizator](/draft).
- **Statystyki graczy** — ranga, historia meczów, mistrzostwo, pula championów i kilkanaście autorskich wskaźników: ocena od A do F, wskaźnik tiltu, krzywa mocy, warunki zwycięstwa i porównanie z rangą.
- **Kalkulator buildu** — dobiera przedmioty, runy i czary pod konkretny skład przeciwnika, z uzasadnieniem każdego wyboru.
- **Analiza AI** — raport trenera przygotowany na podstawie policzonych statystyk.
- **Poradniki** — autorskie artykuły o drafcie, kompozycjach, makro, statystykach i mentalności. [Przejdź do poradników](/poradnik).

## Skąd bierzemy dane

Korzystamy wyłącznie z oficjalnego API Riot Games i z Data Dragon, oficjalnej bazy danych gry. Pobieramy dane, które Riot Games udostępnia publicznie: konto, rangi, mistrzostwo, historię meczów i trwające gry. Szczegółowy opis algorytmów i ich ograniczeń znajdziesz w artykule [Jak działa Nexus Draft](/poradnik/jak-dziala-nexus-draft).

## Obsługiwane serwery

Nexus Draft obsługuje wszystkie oficjalne serwery League of Legends: EUNE, EUW, NA, KR, BR, LAN, LAS, OCE, TR, RU, JP oraz serwery regionu SEA.

## Za darmo i po polsku

Wszystkie podstawowe funkcje są darmowe i nie wymagają rejestracji. Darmowe konto daje dostęp do szczegółów meczów, karty gracza oraz dziennego limitu analiz AI. Serwis utrzymujemy z reklam wyświetlanych zgodnie z naszą [polityką prywatności](/privacy).

## Kontakt

Masz pytanie, sugestię albo znalazłeś błąd? Napisz do nas: **${EMAIL}**. Odpowiadamy na wszystkie wiadomości, zwykle w ciągu kilku dni.

## Informacja prawna

Nexus Draft nie jest zatwierdzony przez Riot Games i nie odzwierciedla poglądów ani opinii Riot Games ani żadnej osoby oficjalnie zaangażowanej w tworzenie lub zarządzanie właściwościami Riot Games. Riot Games oraz wszystkie powiązane właściwości są znakami towarowymi lub zarejestrowanymi znakami towarowymi Riot Games, Inc.
`,
};

export const PRIVACY: Doc = {
  path: "/privacy",
  title: "Polityka prywatności",
  description: "Jakie dane przetwarza Nexus Draft, w jakim celu, jak działają pliki cookies i reklamy oraz jakie masz prawa.",
  updated: "2026-11-25",
  body: `
## 1. Informacje ogólne

Niniejsza Polityka prywatności określa zasady przetwarzania danych użytkowników serwisu Nexus Draft (dalej: „Serwis”), dostępnego pod adresem **nexus-sight.com.pl**. Administratorem Serwisu jest zespół Nexus Draft, z którym można skontaktować się pod adresem **${EMAIL}**.

Serwis umożliwia wyszukiwanie i analizę publicznie dostępnych statystyk graczy League of Legends z wykorzystaniem oficjalnego API Riot Games.

## 2. Jakie dane przetwarzamy

- **Dane wyszukiwania** — Riot ID (nazwa gracza i tag) wpisywane w wyszukiwarkę. Używamy ich do wykonania zapytań do API Riot Games. Odpowiedzi API mogą być krótko przechowywane w pamięci podręcznej serwera, żeby przyspieszyć działanie Serwisu.
- **Dane konta** — jeśli zakładasz konto: adres e-mail, opcjonalna nazwa wyświetlana, zaszyfrowane (zahashowane) hasło albo identyfikator konta Google przy logowaniu przez Google, a także liczniki dziennego wykorzystania funkcji z limitem. Nie przechowujemy haseł w formie jawnej.
- **Historia wyszukiwań i ustawienia** — zapisywane lokalnie w przeglądarce (localStorage), na przykład ostatnio wyszukiwani gracze czy wybrany serwer. Te dane nie trafiają na nasze serwery.
- **Dane techniczne** — adres IP, typ przeglądarki i czas wizyty, zapisywane w logach serwera w celach bezpieczeństwa i diagnostyki.

## 3. Cele przetwarzania

Dane przetwarzamy, aby świadczyć usługi Serwisu (wyszukiwanie, analizy, konto użytkownika), zapewnić bezpieczeństwo i ochronę przed nadużyciami (limity zapytań), prowadzić statystyki odwiedzin oraz wyświetlać reklamy.

## 4. Pliki cookies

- **Niezbędne** — utrzymanie sesji zalogowanego użytkownika (plik cookie sesji) i zapamiętanie wyboru dotyczącego zgody na cookies.
- **Analityczne** — pomagają zrozumieć, jak użytkownicy korzystają z Serwisu (Google Analytics, Google Tag Manager).
- **Reklamowe** — używane przez Google AdSense do wyświetlania reklam, w tym reklam dopasowanych do zainteresowań.

Zgodę na cookies analityczne i reklamowe możesz wyrazić lub odrzucić w okienku zgody. Plikami cookies możesz też zarządzać w ustawieniach przeglądarki.

## 5. Google AdSense i reklamy

Serwis korzysta z Google AdSense. Dostawcy zewnętrzni, w tym Google, używają plików cookies do wyświetlania reklam na podstawie wcześniejszych wizyt użytkownika w Serwisie lub w innych witrynach. Dzięki plikom cookies reklamowym Google i jego partnerzy mogą wyświetlać reklamy na podstawie odwiedzin w Serwisie i w innych miejscach w internecie.

Możesz wyłączyć reklamy spersonalizowane w [ustawieniach reklam Google](https://adssettings.google.com). Więcej o tym, jak Google wykorzystuje dane z witryn partnerów, przeczytasz na stronie [policies.google.com/technologies/partner-sites](https://policies.google.com/technologies/partner-sites).

## 6. Logowanie przez Google

Jeśli logujesz się przez Google, otrzymujemy od Google twój adres e-mail, nazwę wyświetlaną i identyfikator konta. Logowanie obsługuje usługa Firebase Authentication firmy Google.

## 7. Analiza AI

Funkcje analizy AI (raport gracza, trener draftu) przesyłają do zewnętrznego dostawcy modeli językowych wyłącznie policzone statystyki z meczów i opis składów. Nie przesyłamy adresu e-mail ani innych danych konta.

## 8. API Riot Games

Dane o graczach pochodzą z oficjalnego API Riot Games i są publicznie dostępne. Nexus Draft nie jest powiązany z Riot Games ani przez Riot Games zatwierdzony.

## 9. Udostępnianie danych

Nie sprzedajemy danych użytkowników. Dane mogą być przetwarzane przez dostawców usług, z których korzysta Serwis: hosting i bazę danych, Google (AdSense, Analytics, Firebase) oraz dostawcę modeli AI — wyłącznie w zakresie opisanym powyżej — lub gdy wymaga tego prawo.

## 10. Przechowywanie i bezpieczeństwo

Dane konta przechowujemy do czasu usunięcia konta. Połączenie z Serwisem jest szyfrowane (HTTPS), hasła są hashowane, a dostęp do bazy danych jest ograniczony.

## 11. Twoje prawa

Masz prawo dostępu do swoich danych, ich sprostowania, usunięcia (w tym usunięcia konta), ograniczenia przetwarzania, przenoszenia danych oraz sprzeciwu wobec przetwarzania. Masz też prawo wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych. Aby skorzystać z tych praw, napisz na adres **${EMAIL}**.

## 12. Zmiany polityki

Zmiany tej polityki publikujemy na tej stronie wraz z datą aktualizacji.
`,
};

export const TERMS: Doc = {
  path: "/terms",
  title: "Regulamin",
  description: "Zasady korzystania z serwisu Nexus Draft: opis usług, konto użytkownika, limity, treści, reklamy i odpowiedzialność.",
  updated: "2026-11-25",
  body: `
## 1. Postanowienia ogólne

Regulamin określa zasady korzystania z serwisu Nexus Draft (dalej: „Serwis”), dostępnego pod adresem **nexus-sight.com.pl**. Serwis jest darmowym narzędziem do analizy draftu i statystyk graczy League of Legends, korzystającym z oficjalnego API Riot Games. Korzystanie z Serwisu oznacza akceptację Regulaminu.

## 2. Usługi

Serwis umożliwia między innymi:

- wyszukiwanie graczy po Riot ID na wszystkich oficjalnych serwerach,
- przeglądanie rang, historii meczów, mistrzostwa i autorskich wskaźników gry,
- analizę draftu: ocenę składów, szansę na wygraną z samego draftu, krzywą siły, plan gry i podpowiedzi championów,
- wczytywanie trwających meczów,
- kalkulator buildu,
- raporty i podpowiedzi AI,
- czytanie poradników.

## 3. Konto użytkownika

Część funkcji (szczegóły meczów, karta gracza, analizy AI) wymaga darmowego konta. Użytkownik odpowiada za poufność swojego hasła. Funkcje AI mają dzienne limity użycia. Konto można usunąć w każdej chwili, pisząc na adres **${EMAIL}**.

## 4. Zasady korzystania

Użytkownik zobowiązuje się korzystać z Serwisu zgodnie z prawem, nie zakłócać jego działania, nie wykonywać zautomatyzowanych zapytań (scraping, boty) bez zgody administratora i nie próbować obchodzić zabezpieczeń ani limitów.

## 5. Dane i treści

Dane o graczach pochodzą z oficjalnego API Riot Games. Oceny, wskaźniki, szansa na wygraną i raporty AI są wynikiem obliczeń algorytmicznych, mają charakter informacyjny i mogą zawierać błędy. Nie są oficjalnymi ocenami Riot Games. Opis metodologii znajduje się w artykule [Jak działa Nexus Draft](/poradnik/jak-dziala-nexus-draft).

## 6. Własność intelektualna

Interfejs, algorytmy i treści redakcyjne Serwisu, w tym poradniki, są chronione prawem autorskim. League of Legends, Riot Games, nazwy i grafiki championów są własnością Riot Games, Inc. i są wykorzystywane zgodnie z zasadami API Riot Games. Nexus Draft nie jest zatwierdzony przez Riot Games i nie odzwierciedla poglądów ani opinii Riot Games.

## 7. Reklamy

Serwis wyświetla reklamy Google AdSense. Informacje o plikach cookies i reklamach znajdują się w [polityce prywatności](/privacy).

## 8. Odpowiedzialność

Serwis jest udostępniany w stanie „takim, jaki jest”. Administrator nie odpowiada za przerwy w działaniu, w tym wynikające z ograniczeń API Riot Games, za dokładność danych zewnętrznych ani za decyzje podjęte na podstawie informacji z Serwisu.

## 9. Zmiany Regulaminu

Zmiany Regulaminu publikujemy na tej stronie. Wchodzą w życie z chwilą publikacji.

## 10. Kontakt

Pytania dotyczące Regulaminu prosimy kierować na adres **${EMAIL}**.
`,
};

export const DOCS: Doc[] = [ABOUT, PRIVACY, TERMS];
