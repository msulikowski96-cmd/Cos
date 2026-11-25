import type { Article } from "../types";

export const article: Article = {
  slug: "power-spiki-krzywa-sily",
  title: "Power spiki i krzywa siły: kiedy twoja drużyna powinna walczyć",
  description:
    "Czym są power spiki w League of Legends, jak czytać krzywą siły drużyny i jak zamienić przewagę czasową w obiektywy. Wczesna, środkowa i późna faza gry.",
  category: "Rozgrywka",
  updated: "2026-11-25",
  lead:
    "Ten sam skład może być w 10. minucie bezbronny, a w 30. nie do zatrzymania. Zrozumienie, kiedy twoja drużyna jest silniejsza od przeciwnika, to jedna z najprostszych dróg do lepszych decyzji: wiesz, kiedy naciskać, a kiedy grać na czas.",
  body: `
## Co to jest power spike

Power spike to moment, w którym champion nagle staje się wyraźnie silniejszy. Najczęściej wynika z jednego z trzech powodów:

- **Poziom postaci** — na przykład odblokowanie umiejętności ostatecznej albo kolejnego jej poziomu.
- **Przedmioty** — ukończenie pierwszego lub drugiego dużego przedmiotu, który zmienia sposób walki.
- **Obiektywy i wzmocnienia** — buff z Barona, dusza smoka czy przewaga w liczbie smoków.

Każdy champion ma inny rozkład tych momentów. Niektórzy są bardzo groźni od pierwszej minuty i słabną z czasem, inni są słabi na linii, ale w późnej fazie gry wygrywają walki niemal sami.

## Trzy fazy gry

W analizie draftu dzielimy grę na trzy umowne fazy. Granice są przybliżone, bo każdy mecz toczy się w innym tempie, ale dobrze oddają to, jak zmienia się siła składów.

| Faza | Orientacyjny czas | Co decyduje |
| Wczesna | 0–14 minuta | pojedynki na liniach, presja junglera, pierwsze obiektywy |
| Środkowa | 14–25 minuta | rotacje, walki o smoki, pierwsze duże przedmioty |
| Późna | od 25 minuty | komplet przedmiotów, Baron, walki całą drużyną, pojedyncze błędy |

## Jak czytać krzywą siły

Krzywa siły to wykres, który pokazuje, jak zmienia się względna moc obu składów w czasie. Liczymy ją na podstawie ocen każdego championa we wczesnej, środkowej i późnej fazie, a potem uśredniamy dla całej drużyny. Najważniejsze są nie same wartości, tylko **różnica między liniami** obu drużyn.

- Jeśli twoja linia jest wyraźnie wyżej w danym przedziale, to jest wasze **okno siły**. W tym czasie warto wymuszać walki i obiektywy.
- Jeśli linia przeciwnika jest wyżej, grajcie bezpiecznie: farmcie, stawiajcie wizję i oddawajcie obiektywy, których nie da się bronić bez ryzyka.
- Miejsce, w którym krzywe się przecinają, to punkt zwrotny. Od tego momentu plan gry powinien się zmienić.

> Przewaga czasowa jest warta tyle, ile obiektywów z niej zrobicie. Drużyna silniejsza wcześnie, która nie zamieni okna siły na wieże i smoki, oddaje grę składowi, który tylko czekał na swój moment.

## Skład wczesny: graj szybko i kończ

Drużyna z przewagą na początku powinna wykorzystać ją agresywnie. Oznacza to częste wspólne akcje junglera z liniami, walki o pierwsze obiektywy i niszczenie wież, zanim przeciwnik zdąży się wzmocnić. Najgorszy scenariusz to wygrana faza linii, po której drużyna zaczyna farmić i czekać. Każda minuta bez nacisku działa na korzyść przeciwnika.

## Skład późny: przetrwaj i nie oddawaj za dużo

Drużyna silna później ma odwrotne zadanie. Nie musi wygrywać linii, musi ich nie przegrać zbyt mocno. Liczy się bezpieczne farmienie, wizja wokół własnej dżungli i rozsądne oddawanie obiektywów, których nie da się obronić. Gdy kluczowi gracze skompletują przedmioty, role się odwracają i to przeciwnik musi unikać walki.

## Przecięcie krzywych w praktyce

Wyobraź sobie skład z silnym junglerem i agresywną dolną linią przeciwko drużynie z ADC, który rozkręca się dopiero przy trzech przedmiotach. Do mniej więcej 20. minuty przewaga należy do pierwszego składu. Jeśli w tym czasie zdobędzie dwa smoki i pierwsze wieże, ma szansę zamknąć grę, zanim przeciwnik osiągnie swój szczyt. Jeśli nie, około 25. minuty sytuacja się odwraca i każda kolejna walka staje się dla niego trudniejsza.

## Najczęstsze błędy przy czytaniu krzywej siły

- **Traktowanie krzywej jak wyroku.** Krzywa opisuje potencjał składu, a nie przebieg konkretnej gry. Drużyna, która przegrała linie, może osiągnąć swoje okno siły później, niż pokazuje wykres.
- **Ignorowanie złota.** Przewaga w przedmiotach przesuwa power spiki. Champion z dwoma przedmiotami w 18. minucie jest silniejszy, niż wynikałoby z samego czasu gry.
- **Czekanie w nieskończoność.** Skład późny nie musi unikać każdej walki. Jeśli przeciwnik popełni błąd, dobra walka w złym oknie nadal jest dobrą walką.
- **Zapominanie o obiektywach.** Okno siły bez planu, co z niego zabrać, mija bez śladu. Przed oknem przewagi ustalcie, który smok, wieża albo Baron jest celem.

## Jak to wykorzystać

Przed grą sprawdź oba składy w [analizatorze draftu](/draft). Zobaczysz krzywą siły, wyznaczone okna przewagi i gotowy plan na wczesną, środkową i późną fazę. Po grze w profilu gracza możesz porównać to z rzeczywistością — sekcja „Krzywa mocy” pokazuje, w których fazach gry ty sam wypadasz najlepiej, a w których najsłabiej. Więcej o tym, jak czytać te liczby, przeczytasz w artykule [Jak czytać statystyki gracza](/poradnik/jak-czytac-statystyki).
`,
  related: ["kompozycje-druzyn", "obiektywy-i-makro", "jak-wygrac-draft"],
  cta: { href: "/draft", label: "Zobacz krzywą siły swojego składu" },
};
