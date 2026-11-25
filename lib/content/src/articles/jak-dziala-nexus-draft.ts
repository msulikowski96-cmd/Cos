import type { Article } from "../types";

export const article: Article = {
  slug: "jak-dziala-nexus-draft",
  title: "Jak działa Nexus Draft: metodologia oceny draftu i statystyk",
  description:
    "Skąd biorą się oceny składów, szansa na wygraną, krzywa siły i wskaźniki w profilu gracza. Opis danych, algorytmów i ich ograniczeń.",
  category: "Nexus Draft",
  updated: "2026-11-25",
  lead:
    "Liczby mają sens tylko wtedy, gdy wiadomo, skąd się wzięły. Na tej stronie opisujemy, jak Nexus Draft ocenia składy, jak liczy szansę na wygraną z samego draftu i jak powstają wskaźniki w profilu gracza — razem z tym, czego te liczby nie mówią.",
  body: `
## Źródła danych

Nexus Draft korzysta wyłącznie z publicznie dostępnych danych udostępnianych przez oficjalne API Riot Games: informacji o koncie, rangach, mistrzostwie championów, historii meczów i trwających grach. Lista championów i ich podstawowe dane pochodzą z Data Dragon, oficjalnej bazy danych gry, i są aktualizowane po każdym patchu. Nie zbieramy danych z klienta gry ani z żadnych nieoficjalnych źródeł.

## Ocena championów

Podstawą analizatora draftu jest własna baza ocen championów. Każda postać ma oceny w skali od 0 do 3 w dziesięciu cechach:

| Cecha | Co opisuje |
| Wczesna gra | siła mniej więcej do 14. minuty |
| Środek gry | siła między 14. a 25. minutą |
| Późna gra | siła po 25. minucie |
| Engage | zdolność rozpoczynania walk |
| Peel | ochrona sojuszników i odpychanie wroga |
| Kontrola tłumu | ogłuszenia, spowolnienia, podrzucenia |
| Poke | obrażenia zadawane z dystansu przed walką |
| Frontline | wytrzymałość i zdolność przyjmowania obrażeń |
| Mobilność | doskoki, przyspieszenia, ucieczki |
| Split push | presja na bocznych liniach |

Oprócz tego każdy champion ma przypisane role i rodzaj obrażeń (fizyczne, magiczne lub mieszane). Nowi championowie, których nie ma jeszcze w bazie, dostają oceny wyliczone automatycznie z oficjalnych tagów, dopóki nie zostaną ocenieni ręcznie.

## Ocena składu

Dla każdej drużyny sumujemy cechy championów i porównujemy je z poziomem, którego potrzebuje typowy, zbalansowany skład. Ocena składu (w skali od 10 do 96) uwzględnia między innymi:

- **frontline** — czy ktoś przyjmie obrażenia,
- **engage i kontrolę tłumu** — czy drużyna potrafi zacząć walkę i ją wygrać,
- **peel** — czy carry ma ochronę,
- **zróżnicowanie obrażeń** — czy przeciwnik nie zablokuje większości obrażeń jednym rodzajem odporności,
- **siłę w fazach gry** — czy skład ma wyraźne okno przewagi,
- **tożsamość** — jak wyraźnie skład pasuje do jednego z sześciu archetypów: teamfight, dive, poke, ochrona carry, łapanie i split push.

Na tej podstawie powstają też komunikaty o mocnych i słabych stronach składu, na przykład brak frontline albo jednolite obrażenia. Archetypy opisujemy szerzej w artykule [Kompozycje drużyn](/poradnik/kompozycje-druzyn).

## Szansa na wygraną z samego draftu

Szansa na wygraną to porównanie ocen obu składów z uwzględnieniem bezpośrednich zależności między nimi — na przykład silnej inicjacji przeciwko drużynie bez ochrony albo split pusha przeciwko składowi, który wolno reaguje na bocznych liniach. Różnicę przeliczamy na procent funkcją logistyczną i celowo ograniczamy wynik do przedziału **25–75%**.

> Ograniczenie jest zamierzone. Draft daje przewagę, ale nie rozstrzyga meczu. Umiejętności graczy, forma danego dnia i decyzje w trakcie gry mają większy wpływ niż sam wybór championów.

## Krzywa siły i plan gry

Krzywa siły pokazuje, jak zmienia się względna moc obu drużyn od pierwszej do 40. minuty. Dla każdej minuty łączymy oceny championów we wczesnej, środkowej i późnej fazie gry. Przedziały, w których jedna drużyna ma wyraźną przewagę, oznaczamy jako okna siły, a na ich podstawie powstaje plan gry na każdą fazę. Więcej w artykule [Power spiki i krzywa siły](/poradnik/power-spiki-krzywa-sily).

## Podpowiedzi championów

Przy wolnym miejscu w składzie sprawdzamy, jak każdy dostępny champion zmieniłby ocenę twojej drużyny i jej pozycję względem przeciwnika. Bierzemy pod uwagę rolę, brakujące cechy i rodzaj obrażeń. Jeśli wczytasz swój Riot ID, podpowiedzi preferują championów z twojej puli według mistrzostwa.

## Wskaźniki w profilu gracza

Profil gracza analizuje ostatnie mecze rankingowe pobrane z API Riot Games. Wskaźniki takie jak KDA, CS na minutę, udział w zabójstwach, Vision Score czy udział w obrażeniach porównujemy z orientacyjnymi wartościami dla twojej roli i rangi. Na ich podstawie liczymy między innymi ocenę od A do F, wskaźnik tiltu (wyniki po porażkach w porównaniu z wynikami po wygranych), krzywą mocy według długości gry oraz warunki zwycięstwa, czyli statystyki najbardziej różniące twoje wygrane od przegranych. Szczegółowe wyjaśnienie poszczególnych liczb znajdziesz w artykule [Jak czytać statystyki gracza](/poradnik/jak-czytac-statystyki).

## Analiza AI

Raport AI i trener draftu korzystają z modelu językowego, któremu przekazujemy wyłącznie policzone wcześniej statystyki i opis składów. Model nie ma dostępu do twojego konta ani do danych, których nie widać w profilu. Odpowiedzi AI mogą zawierać błędy, dlatego zawsze opierają się na liczbach widocznych obok i warto traktować je jako wskazówki, a nie wyrocznię.

## Ograniczenia

- Oceny championów są uogólnieniem. Ten sam champion może działać inaczej w rękach różnych graczy i po zmianach w patchu.
- Profil opiera się na ograniczonej liczbie ostatnich meczów, więc przy małej liczbie gier wyniki są mniej wiarygodne.
- Mecze na żywo są widoczne dopiero od ekranu ładowania, a gracze z włączonym trybem ukrywania przed aplikacjami nie są widoczni w ogóle.
- Nexus Draft nie jest powiązany z Riot Games i nie ma dostępu do danych niedostępnych publicznie.

## Kontakt

Jeśli uważasz, że ocena jakiegoś championa jest nietrafiona albo znalazłeś błąd w obliczeniach, napisz do nas: nexussight.kontakt@gmail.com. Każde zgłoszenie czytamy i bierzemy pod uwagę przy kolejnych aktualizacjach.
`,
  related: ["kompozycje-druzyn", "power-spiki-krzywa-sily", "jak-czytac-statystyki"],
  cta: { href: "/draft", label: "Wypróbuj analizator draftu" },
};
