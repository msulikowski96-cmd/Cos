import type { Article } from "../types";

export const article: Article = {
  slug: "role-w-lol",
  title: "Role w League of Legends: obowiązki topa, junglera, mida, ADC i supporta",
  description:
    "Co należy do każdej roli w LoL na każdym etapie gry: top, jungle, mid, ADC i support. Zadania, typowe statystyki i najczęstsze błędy na każdej pozycji.",
  category: "Rozgrywka",
  updated: "2026-11-25",
  lead:
    "Pięć ról w League of Legends to pięć zupełnie różnych zestawów obowiązków. Zrozumienie, czego drużyna oczekuje od każdej pozycji, pomaga grać lepiej na własnej roli i lepiej współpracować z resztą zespołu — także wtedy, gdy trafisz na pozycję, której zwykle nie grasz.",
  body: `
## Górna linia (top)

Toplaner spędza najwięcej czasu sam, na najdłuższej linii, z dala od reszty drużyny. Najczęściej gra wojowników lub tanki, którzy dobrze radzą sobie w pojedynkach.

- **Wczesna gra:** wygrać lub bezpiecznie przetrwać linię, kontrolować falę stworów i uważać na junglera przeciwnika.
- **Środek gry:** naciskać boczną linię, wymuszać reakcję przeciwnika albo dołączać do walki przy obiektywach z użyciem teleportacji lub szybkiej rotacji.
- **Późna gra:** być frontline dla drużyny albo splitpusherem, który odciąga uwagę wroga.
- **Typowy błąd:** walka o linię za wszelką cenę, nawet gdy przeciwnik ma przewagę liczebną dzięki junglerowi.

## Dżungla (jungle)

Jungler nie ma własnej linii. Zdobywa złoto w dżungli i decyduje o tempie gry: gdzie pojawia się presja, które obiektywy są bronione i które linie dostają pomoc.

- **Wczesna gra:** efektywna ścieżka po obozach, akcje na liniach z przewagą i kontrola pierwszych obiektywów.
- **Środek gry:** prowadzenie walk o smoki i obiektywy, wizja w dżungli przeciwnika, łapanie pojedynczych graczy.
- **Późna gra:** kontrola Barona i smoków, ochrona carry lub polowanie na carry przeciwnika.
- **Typowy błąd:** pomaganie przegranym liniom zamiast tym, które mogą zamienić przewagę na obiektyw.

## Środkowa linia (mid)

Mid ma najkrótszą linię i najłatwiejszy dostęp do obu stron mapy. Dlatego jego obecność w walkach o smoka i obiektywy po stronie Barona ma ogromne znaczenie.

- **Wczesna gra:** kontrola linii i szybkie czyszczenie fal, żeby móc ruszać się po mapie przed przeciwnikiem.
- **Środek gry:** rotacje do bocznych linii i do obiektywów razem z junglerem.
- **Późna gra:** główne źródło obrażeń magicznych lub zabójca tylnej linii, zależnie od championa.
- **Typowy błąd:** zostawanie na linii, gdy dwie inne osoby walczą przy smoku.

## Dolna linia — ADC

ADC (strzelec) to zwykle główne źródło stałych obrażeń fizycznych w późnej fazie gry. Jest bardzo silny z przedmiotami, ale też bardzo kruchy.

- **Wczesna gra:** farma przede wszystkim. Każdy stwór przybliża kolejny przedmiot.
- **Środek gry:** udział w walkach o smoki i niszczenie wież, które otwierają mapę.
- **Późna gra:** pozycjonowanie. ADC powinien atakować najbliższy bezpieczny cel, a nie szukać idealnego celu na tyłach wroga.
- **Typowy błąd:** samotne farmienie bocznej linii w późnej fazie gry bez wizji.

## Support

Support zapewnia drużynie wizję, ochronę i kontrolę tłumu. Nie potrzebuje dużo złota, ale ma ogromny wpływ na mapę.

- **Wczesna gra:** wspieranie ADC na linii, wizja w rzece i reagowanie na akcje junglera.
- **Środek gry:** wizja przed obiektywami razem z junglerem, inicjowanie walk lub ochrona carry.
- **Późna gra:** kontrola wizji wokół Barona i smoków, ochrona najważniejszej osoby w drużynie.
- **Typowy błąd:** zostawanie przy ADC przez całą grę, zamiast przygotowywać wizję przed obiektywami.

## Gra na nieulubionej roli

Gdy trafisz na rolę, której zwykle nie grasz, nie próbuj grać „jak główną”. Wybierz najprostszego championa, jakiego znasz na tej pozycji, najlepiej takiego, który nie wymaga wygrywania linii, i skup się na podstawach: bezpiecznym farmieniu, wizji i byciu przy drużynie podczas walk o obiektywy. Powiedz drużynie na czacie, że grasz poza główną rolą — sojusznicy częściej pomogą, zamiast oczekiwać od ciebie przewagi. Taka gra rzadko będzie twoją najlepszą, ale nie musi być przegrana.

## Statystyki różnią się zależnie od roli

Te same liczby oznaczają co innego na różnych pozycjach. Orientacyjne wartości:

| Rola | KP (udział w zabójstwach) | CS/min | Vision Score |
| Top | 45–55% | wysokie | niższe |
| Jungle | 60–75% | średnie | średnie |
| Mid | 55–65% | wysokie | średnie |
| ADC | 55–65% | najwyższe | niższe |
| Support | 65–80% | bardzo niskie | najwyższe |

Profil gracza w Nexus Draft wykrywa twoją główną rolę i porównuje twoje wyniki z normami dla tej roli i twojej rangi, dlatego wnioski są sprawiedliwe także dla supportów i toplanerów. Więcej o samych wskaźnikach w artykule [Jak czytać statystyki gracza](/poradnik/jak-czytac-statystyki).

## Jak role tworzą skład

Dobry draft zapewnia każdej roli championa, który wypełnia jej podstawowe zadania, a jednocześnie pasuje do planu całej drużyny. Toplaner i support często odpowiadają za frontline i inicjację, jungler za tempo, a mid i ADC za obrażenia. Jeśli któraś z tych funkcji jest pusta, warto ją uzupełnić w kolejnych pickach — zobacz [Jak wygrać draft](/poradnik/jak-wygrac-draft).
`,
  related: ["jak-wygrac-draft", "jak-czytac-statystyki", "obiektywy-i-makro"],
  cta: { href: "/draft", label: "Ułóż skład z podziałem na role" },
};
