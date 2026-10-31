# Nexus Draft — analizator draftu League of Legends

Siostrzany projekt [Nexus Sight](https://github.com/msulikowski96-cmd/lol). Nexus Sight analizuje **gracza**, Nexus Draft analizuje **draft**: ułóż oba składy w champ selekcie, a aplikacja pokaże, kto wygrywa w której fazie gry, czego wam brakuje i kogo wybrać następnego.

Działa w całości w przeglądarce — bez backendu, bez klucza Riot API, bez logowania. Całość po polsku.

## Funkcje

| Funkcja | Co robi |
|---|---|
| **Tablica draftu** | 5 picków + 5 banów na stronę, wyszukiwarka z filtrem ról, wszystkie 173 championy z aktualnego patcha |
| **Prognoza** | Szansa na wygraną wynikająca z samego draftu (celowo ograniczona do 25–75%) + kluczowe przewagi |
| **Krzywa siły** | Wykres siły obu składów od 0 do 40 minuty i „okna mocy” — kiedy warto wymuszać walki |
| **Plan gry** | Co robić we wczesnej grze, w środku i w końcówce, z celami (Larwy, smoki, Herold, Baron) |
| **Profil drużyn** | Radar 7 cech: inicjacja, ochrona, kontrola, poke, frontline, mobilność, split push |
| **AD kontra AP** | Rozkład obrażeń i ostrzeżenie przed jednostronnym składem |
| **Styl gry** | Automatyczne rozpoznanie archetypu: Teamfight 5v5, Dive, Poke, Ochrona carry, Łapanie, Split push |
| **Wnioski** | Atuty i zagrożenia obu składów (brak frontline'u, carry bez ochrony, słabsza końcówka…) |
| **Podpowiedzi picków** | Ranking championów na wolną rolę, z uzasadnieniem („dodaje frontline”, „balansuje obrażenia”) |
| **Udostępnianie** | Cały draft zapisany w linku — wyślij go drużynie na Discordzie |

## Jak to działa

1. **Baza ocen** (`src/data/ratings.ts`) — każdy champion ma role, typ obrażeń i 10 ocen w skali 0–3: siła w trzech fazach gry oraz 7 cech składu. Champion bez ręcznej oceny (np. nowość po patchu) dostaje szacunek z tagów Data Dragon.
2. **Analiza drużyny** — sumy cech przeliczone na pełny skład, rozkład AD/AP, krzywa siły w czasie.
3. **Archetypy** — surowe wyniki stylów są normalizowane względem 2000 losowych składów, więc „70” znaczy to samo dla dive'a i split pusha.
4. **Ocena składu (0–100)** — kary za braki (frontline, inicjacja, CC, ochrona, balans obrażeń) i bonusy za wyraźną tożsamość. Wyraźny styl łagodzi część kar (poke nie musi mieć inicjacji).
5. **Matchup** — reguły typu „mocne wejście kontra skład bez ochrony” albo „poke bez kary” przesuwają prognozę.
6. **Podpowiedzi** — dla każdego kandydata liczymy, o ile poprawi ocenę składu i matchup.

## Uruchomienie

```bash
npm install
npm run dev        # serwer deweloperski
npm test           # testy silnika analizy
npm run build      # build produkcyjny do dist/
```

Po nowym patchu zaktualizuj listę championów:

```bash
npm run sync:champions
```

Nowy champion od razu działa (z szacowanymi ocenami). Żeby był dokładniej oceniany, dopisz go do `src/data/ratings.ts`.

## Wdrożenie

Gotowy workflow GitHub Pages leży w `docs/github-pages-deploy.yml`. Żeby go włączyć:

1. Przenieś plik do `.github/workflows/deploy.yml` (na GitHubie: otwórz plik → ołówek → zmień ścieżkę).
2. W ustawieniach repo: **Settings → Pages → Source: GitHub Actions**.

Od tej chwili każdy push na `main` uruchamia testy, buduje stronę i publikuje ją na GitHub Pages.

Strona jest statyczna, więc zadziała też na Netlify, Vercel, Firebase Hosting albo jako podstrona Nexus Sight.

## Stos

React 19 · Vite 7 · TypeScript · Tailwind CSS 4 · Lucide · Vitest. Wykresy (krzywa siły, radar) to własne SVG, bez bibliotek.

---

Nexus Draft nie jest powiązany z Riot Games. League of Legends i grafiki championów są własnością Riot Games, Inc.
