import type { Article } from "../types";

export const article: Article = {
  slug: "tilt-i-mentalnosc",
  title: "Tilt w League of Legends: jak go rozpoznać i przestać przegrywać serie",
  description:
    "Czym jest tilt w LoL, jak rozpoznać go w swoich statystykach i jakie proste zasady pomagają przerwać serię porażek. Praktyczne nawyki dla graczy rankingowych.",
  category: "Ranked",
  updated: "2026-11-25",
  lead:
    "Prawie każdy gracz rankingowy zna ten scenariusz: jedna pechowa porażka, potem druga, a po kilku godzinach okazuje się, że stracony jest cały tydzień pracy nad rangą. Tilt to nie brak umiejętności, tylko stan, w którym emocje zaczynają podejmować decyzje za ciebie. Da się go zauważyć — także w liczbach.",
  body: `
## Czym jest tilt

Tilt to spadek jakości decyzji pod wpływem frustracji. Zmienia się sposób gry: podejmujesz większe ryzyko, częściej gonisz przeciwników, gorzej komunikujesz się z drużyną i szybciej się poddajesz. Co ważne, osoba na tilcie zwykle tego nie zauważa. Wydaje się jej, że po prostu trafia na gorszych sojuszników.

## Objawy, które warto znać

- Grasz kolejną grę natychmiast po porażce, „żeby się odegrać”.
- Wyciszasz czat dopiero po tym, jak sam już coś napisałeś.
- Wchodzisz w walki, których normalnie byś nie podjął, bo „i tak przegrywamy”.
- Liczba twoich zgonów rośnie, a udział w zabójstwach spada.
- Przestajesz kupować Control Wardy i patrzeć na minimapę.

## Jak tilt wygląda w statystykach

Tilt zostawia ślady w danych. W profilu gracza Nexus Draft sekcja **Wskaźnik tiltu** porównuje twoje wyniki w grach rozegranych tuż po porażce z grami po wygranej. Jeśli po przegranej twoje KDA, liczba zgonów albo procent wygranych wyraźnie się pogarszają, wskaźnik to pokaże. Sekcja **Analiza śmierci** podpowie z kolei, jak często masz mecze z dużą liczbą zgonów i ile czasu spędzasz martwy.

> Jeśli twój procent wygranych po porażce jest wyraźnie niższy niż po wygranej, najprostsza poprawa wyniku nie wymaga żadnego treningu: wystarczy zrobić przerwę po przegranej.

## Zasady, które przerywają serie porażek

1. **Limit porażek.** Ustal z góry, że po dwóch przegranych z rzędu kończysz granie rankingowe na dany dzień. To jedna z najskuteczniejszych zasad, bo działa zanim emocje przejmą kontrolę.
2. **Przerwa między grami.** Kilka minut bez komputera, szklanka wody, krótki spacer. Kolejka może poczekać.
3. **Wyciszony czat wszystkich graczy.** Nie musisz czytać prowokacji przeciwników ani komentarzy sojuszników. Pingi i krótkie wiadomości wystarczą do współpracy.
4. **Jeden cel na grę.** Zamiast „muszę wygrać” postaw sobie zadanie, na które masz wpływ, na przykład „mniej niż pięć zgonów” albo „Control Ward przy każdym powrocie”.
5. **Analiza po sesji, nie w trakcie.** Szukanie winnych w trakcie gry nic nie daje. Spokojna analiza kilku meczów następnego dnia daje bardzo dużo.

## Komunikacja, która pomaga drużynie

Gra drużynowa wymaga współpracy z ludźmi, których nie znasz. Kilka prostych nawyków zmniejsza napięcie po obu stronach: informuj o swoich planach zamiast oceniać innych, pinguj zagrożenia zamiast pisać pretensje i doceniaj dobre zagrania sojuszników. Drużyna, która ze sobą rozmawia, częściej odwraca przegrane gry.

## Tilt a długość sesji

Zmęczenie wzmacnia wszystkie objawy tiltu. Po kilku godzinach grania reakcje są wolniejsze, a decyzje gorsze, nawet jeśli wygrywasz. Krótsze sesje z przerwami zwykle dają lepszy wynik w skali tygodnia niż jedna bardzo długa sesja.

## Prosty plan na następną sesję

1. Przed pierwszą grą zapisz jeden cel, na przykład „najwyżej pięć zgonów na grę”.
2. Ustal limit: dwie porażki z rzędu kończą granie rankingowe na dziś.
3. Po każdej grze oceń tylko swój cel, a nie wynik meczu ani grę sojuszników.
4. Po sesji zajrzyj do profilu i sprawdź, czy wskaźnik tiltu i liczba zgonów idą w dobrą stronę.

Taki plan zajmuje minutę, a usuwa z sesji to, co najbardziej kosztuje: granie „na odegranie się”.

## Spokojna głowa to też umiejętność

Najlepsi gracze nie są odporni na frustrację, tylko mają sposób, żeby nie pozwolić jej decydować. Traktuj mentalność jak każdą inną umiejętność: obserwuj ją w statystykach, wprowadzaj jedną zasadę naraz i sprawdzaj, czy działa. Więcej praktycznych nawyków znajdziesz w artykule [Jak wspinać się w rankedach](/poradnik/jak-wspinac-sie-w-rankedach).

Jeśli granie przestaje sprawiać przyjemność albo zajmuje więcej czasu, niż chcesz, warto zrobić dłuższą przerwę. Gra ma być rozrywką, a ranga nigdzie nie ucieknie.
`,
  related: ["jak-wspinac-sie-w-rankedach", "jak-czytac-statystyki", "role-w-lol"],
  cta: { href: "/", label: "Sprawdź swój wskaźnik tiltu" },
};
