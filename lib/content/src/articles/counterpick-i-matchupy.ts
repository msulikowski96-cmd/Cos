import type { Article } from "../types";

export const article: Article = {
  slug: "counterpick-i-matchupy",
  title: "Counterpick i matchupy w LoL: jak wybierać championa pod przeciwnika",
  description:
    "Jak działa counterpick w League of Legends, kiedy się opłaca, a kiedy lepiej zostać przy swoim championie. Matchupy na linii, zasięg, all-in, sustain i pula championów.",
  category: "Draft",
  updated: "2026-11-25",
  lead:
    "Counterpick to wybór championa, który ma przewagę nad konkretnym przeciwnikiem. W teorii daje łatwiejszą linię, w praktyce często kończy się porażką, bo gracz wybiera postać, której nie zna. Poniżej wyjaśniamy, skąd biorą się przewagi w matchupach i jak z nich rozsądnie korzystać.",
  body: `
## Skąd bierze się przewaga w matchupie

Pojedynek na linii rozstrzyga kilka powtarzalnych czynników. Znając je, możesz ocenić niemal każdy matchup, nawet jeśli nie grałeś go wcześniej.

- **Zasięg ataku i umiejętności.** Postać z większym zasięgiem może zadawać obrażenia, zanim przeciwnik w ogóle podejdzie. Na linii przekłada się to na przewagę w wymianach i trudniejsze farmienie dla wroga.
- **Siła all-in.** Niektórzy championowie wygrywają długie wymiany na pełne zdrowie, inni krótkie wymiany z wycofaniem. Kto narzuci swój rodzaj walki, ten zwykle wygrywa linię.
- **Regeneracja (sustain).** Leczenie i tarcze pozwalają odrobić straty bez powrotu do bazy. Przeciwko takiemu przeciwnikowi poke traci skuteczność.
- **Mobilność i ucieczki.** Champion z doskokiem może karać błędy w ustawieniu, a postać z ucieczką łatwiej przeżyje presję junglera.
- **Power spiki.** Ktoś, kto jest silniejszy na poziomach 1–3, powinien grać agresywnie na początku. Ktoś, kto rośnie z poziomem lub przedmiotami, powinien przetrwać i czekać.

## Rodzaje counterpicków

### Counter mechaniczny
Twoja postać wprost wygrywa wymiany, na przykład dzięki zasięgowi lub umiejętności, która neutralizuje najważniejsze narzędzie przeciwnika. To klasyczny counterpick, ale wymaga dobrej znajomości obu postaci.

### Counter strategiczny
Wybierasz championa, który nie musi wygrać linii, ale odbiera przeciwnikowi jego plan. Przykład: przeciwko postaci, która chce naciskać boczną linię, wybierasz kogoś, kto szybko czyści fale i dołącza do drużyny. Przeciwnik „wygrywa” linię, ale traci wpływ na grę.

### Counter do składu
Czasem najlepszym wyborem nie jest odpowiedź na przeciwnika z linii, tylko na cały skład wroga. Jeśli przeciwnicy mają trzech zabójców, postać z silną ochroną sojuszników może dać więcej niż champion wygrywający pojedynek.

## Kiedy counterpick się nie opłaca

> Champion, którego znasz, jest prawie zawsze lepszy od championa, który „wygrywa matchup na papierze”, ale grasz go pierwszy raz w rankedzie.

Counterpick traci sens, gdy:

1. Nie znasz wybranej postaci. Brak wiedzy o zasięgach, cooldownach i power spikach zniweluje każdą przewagę.
2. Psuje skład drużyny. Trzeci champion z obrażeniami fizycznymi albo kolejna postać bez frontline może kosztować więcej niż wygrana linia.
3. Przeciwnik może jeszcze zmienić linię. Gdy wróg wybrał flex picka, twój „counter” może wylądować na zupełnie innym przeciwniku.

## Blind pick: co wybrać, gdy nie znasz przeciwnika

Jeśli wybierasz wcześnie, nie wiesz jeszcze, z kim zagrasz na linii. Wtedy liczy się bezpieczeństwo, a nie maksymalna przewaga. Dobry blind pick ma kilka cech: nie ma wyraźnie przegranych matchupów, potrafi bezpiecznie farmić pod wieżą, ma jakąś formę ucieczki albo samoleczenia i daje drużynie coś przydatnego niezależnie od wyniku linii — na przykład kontrolę tłumu lub szybkie czyszczenie fal. Zostaw postacie, które świetnie wygrywają kilka matchupów, ale przegrywają wiele innych, na moment, gdy zobaczysz przeciwnika.

## Jak budować pulę championów pod matchupy

Najrozsądniejsze podejście to mała pula: dwóch lub trzech championów na główną rolę, którzy uzupełniają się nawzajem. Jeden powinien być bezpieczny w ciemno (blind pick), drugi skuteczny przeciwko postaciom, z którymi masz najwięcej problemów. Taka pula daje elastyczność w drafcie bez potrzeby uczenia się dwudziestu postaci.

W profilu gracza Nexus Draft, w zakładce „Rang”, zobaczysz swoje mistrzostwo i pulę postaci z procentem wygranych na każdej z nich. Z kolei sekcja „Wyniki na bohaterach” w zakładce „Analiza” pokaże, na kim twoje statystyki są najlepsze. To dobry punkt wyjścia do wyboru dwóch, trzech championów, na których warto się skupić.

## Matchup to nie tylko linia

Nawet idealny counterpick nie zagwarantuje wygranej, jeśli jungler przeciwnika regularnie odwiedza twoją linię. Patrz na całą mapę: przewaga na linii daje wartość dopiero wtedy, gdy zamieniasz ją w presję, wizję i obiektywy. Więcej na ten temat w artykule [Obiektywy i makro](/poradnik/obiektywy-i-makro).

## Wykorzystaj podpowiedzi przy drafcie

[Analizator draftu](/draft) podpowiada championów do wolnego miejsca w składzie, biorąc pod uwagę braki twojej drużyny i skład przeciwnika. Jeśli wczytasz swój Riot ID, podpowiedzi uwzględnią też twoją pulę championów, więc dostaniesz propozycje postaci, które faktycznie grasz.
`,
  related: ["jak-wygrac-draft", "kompozycje-druzyn", "role-w-lol"],
  cta: { href: "/draft", label: "Zobacz podpowiedzi do draftu" },
};
