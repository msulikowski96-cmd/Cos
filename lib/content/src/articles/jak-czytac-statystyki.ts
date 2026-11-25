import type { Article } from "../types";

export const article: Article = {
  slug: "jak-czytac-statystyki",
  title: "Jak czytać statystyki gracza LoL: KDA, CS/min, KP, wizja i obrażenia",
  description:
    "Co naprawdę mówią KDA, CS na minutę, udział w zabójstwach, Vision Score i udział w obrażeniach. Normy dla ról i rang oraz typowe pułapki w interpretacji.",
  category: "Statystyki",
  updated: "2026-11-25",
  lead:
    "Statystyki to lustro, w którym widać nawyki niewidoczne w trakcie gry. Problem w tym, że pojedyncza liczba bez kontekstu łatwo wprowadza w błąd. Ten poradnik wyjaśnia, co oznaczają najważniejsze wskaźniki, jakie wartości są typowe dla poszczególnych ról i jak wyciągać z nich wnioski, które faktycznie pomagają wygrywać.",
  body: `
## Zasada pierwsza: patrz na trendy, nie na jedną grę

Jedna gra to za mało, żeby cokolwiek ocenić. Zła seria przeciwników, przegrana linia przez błąd sojusznika albo bardzo krótki mecz potrafią zniekształcić każdy wskaźnik. Dlatego profil w Nexus Draft liczy średnie z ostatnich meczów rankingowych i porównuje je z typowymi wartościami dla twojej rangi. Wnioski mają sens dopiero przy kilkunastu grach.

## KDA — zabójstwa, zgony i asysty

KDA to stosunek sumy zabójstw i asyst do liczby zgonów. Wartość około 3 uznaje się za dobrą, a powyżej 4 za bardzo dobrą, ale wiele zależy od roli i stylu gry.

- **Supporty i junglerzy** naturalnie mają więcej asyst, więc ich KDA bywa wyższe.
- **Toplanerzy grający tanki** mogą mieć niskie KDA i nadal świetnie wykonywać swoje zadanie.
- **Bardzo wysokie KDA przy niskim udziale w zabójstwach** często oznacza zbyt pasywną grę: unikasz ryzyka, ale nie pomagasz drużynie.

Ważniejsza od samego KDA jest liczba zgonów. Średnio więcej niż sześć zgonów na grę to sygnał, że warto przyjrzeć się pozycjonowaniu i decyzjom o wejściu w walkę.

## CS/min — efektywność farmienia

CS (creep score) to liczba zabitych stworów i potworów. Na minutę gry pokazuje, jak dobrze zbierasz złoto bez walki. Orientacyjne normy dla ról zbierających stwory:

| Ranga | Typowe CS/min |
| Żelazo–Brąz | 4–5 |
| Srebro–Złoto | 5–7 |
| Platyna–Szmaragd | 7–8 |
| Diament i wyżej | 8 i więcej |

Każdy stwór to darmowe złoto. Różnica jednego CS na minutę w 25-minutowej grze to kilkaset sztuk złota, czyli mniej więcej równowartość jednego mniejszego przedmiotu. Supporty i część junglerów mają z założenia niższe CS, więc dla nich ten wskaźnik ma mniejsze znaczenie.

## KP — udział w zabójstwach

KP (kill participation) mówi, w ilu procentach zabójstw drużyny brałeś udział. Powyżej 60% oznacza, że jesteś tam, gdzie dzieje się gra. Poniżej 40% sugeruje, że grasz w oderwaniu od drużyny. Junglerzy i supporty zwykle mają 65–75%, toplanerzy 45–55%, bo spędzają więcej czasu na bocznej linii.

Niski KP nie zawsze jest błędem. Gracz, który świadomie naciska boczną linię i zabiera wieże, może mieć niski udział w zabójstwach i jednocześnie wygrywać mecze. Dlatego KP warto czytać razem z obrażeniami zadanymi budynkom i wynikiem meczu.

## Udział w obrażeniach

Ten wskaźnik pokazuje, jaki procent obrażeń drużyny zadanych championom pochodzi od ciebie. Postacie typu carry na środkowej i dolnej linii powinny mieć zwykle 25–35%. Jeśli grasz carry i masz wyraźnie mniej niż 20%, nie wypełniasz swojej roli: albo giniesz przed walką, albo stoisz za daleko. Jeśli tank ma ponad 30%, to często znak, że twoje carry nie dostarcza obrażeń.

## Vision Score — kontrola wizji

Vision Score łączy postawione wardy, zniszczone wardy przeciwnika i czas, przez jaki twoja wizja dawała drużynie informacje. To jeden z najbardziej niedocenianych wskaźników. Prosta reguła: wynik wizji powinien być co najmniej równy długości gry w minutach, a u supportów półtora do dwóch razy większy. Kupowanie Control Warda przy każdym powrocie do bazy to najtańsza inwestycja w bezpieczeństwo całej drużyny.

## Wskaźniki, które liczy Nexus Draft

Oprócz klasycznych statystyk profil gracza zawiera wskaźniki wyliczane z wielu meczów jednocześnie, między innymi:

- **Ocena gracza od A do F** — zbiorczy wynik z kilkunastu wskaźników ważonych zależnie od roli.
- **Porównanie z rangą** — o ile twoje KDA, CS/min czy KP odbiegają od średniej dla twojej rangi.
- **Wskaźnik tiltu** — czy po przegranej twoje wyniki w kolejnych grach wyraźnie spadają.
- **Comeback i snowball** — jak często wygrywasz gry, w których przegrywałeś wczesną fazę, i jak często zamieniasz przewagę w wygraną.
- **Krzywa mocy** — w której fazie gry (krótkie, średnie, długie mecze) radzisz sobie najlepiej.
- **Warunki zwycięstwa** — które statystyki najbardziej różnią się między twoimi wygranymi a przegranymi.

> Najcenniejszy wniosek to zwykle ten z „warunków zwycięstwa”. Jeśli w wygranych masz średnio 3 zgony, a w przegranych 8, wiesz dokładnie, nad czym pracować — i nie jest to mechanika, tylko decyzje.

## Typowe pułapki

1. **Porównywanie się z innymi rolami.** Support z KDA 4 i ADC z KDA 4 to zupełnie inne gry.
2. **Ocena po wyniku jednego meczu.** Zawsze patrz na średnie z wielu gier.
3. **Pogoń za jedną liczbą.** Sztuczne podbijanie KDA przez unikanie walk kończy się przegranymi meczami.
4. **Ignorowanie długości gry.** W bardzo krótkich meczach CS/min i Vision Score są zaniżone.

## Od czego zacząć

Wpisz swój Riot ID na [stronie głównej](/) i otwórz zakładkę „Analiza”. Zacznij od sekcji „Obszary do poprawy” i wybierz jedną rzecz, nad którą będziesz pracować przez najbliższe dziesięć gier. Jedna konkretna zmiana daje więcej niż pięć ogólnych postanowień. Jeśli szukasz pomysłów, zajrzyj do artykułu [Jak wspinać się w rankedach](/poradnik/jak-wspinac-sie-w-rankedach).
`,
  related: ["jak-wspinac-sie-w-rankedach", "tilt-i-mentalnosc", "role-w-lol"],
  cta: { href: "/", label: "Sprawdź swoje statystyki" },
};
