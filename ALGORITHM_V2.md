# Nexus Sight — niezależny Algorithm V2

Algorithm V2 nie jest nakładką na wynik V1. Endpoint pobiera surowe dane meczowe z Riot Match API i przekazuje je bezpośrednio do `artifacts/api-server/src/lib/analysis-engine-v2.ts`.

Aktywny router korzysta z `routes/analysis-v2.ts`. Stary `routes/analysis.ts` pozostaje w repo jako wersja referencyjna.

## V2 liczy od zera

- ocenę każdego meczu i całego profilu,
- walkę, ekonomię, teamplay, wizję, przeżywalność, obiektywy i presję linii,
- mocne i słabe strony,
- krytyczne błędy oraz wzorce gry,
- archetyp i plan poprawy,
- oceny championów,
- formę, konsekwencję, tilt i warunki zwycięstwa.

## Profile ról

- Top: linia, ekonomia, side lane i przeżywalność,
- Jungle: KP, tempo, wizja i obiektywy,
- Mid: obrażenia, ekonomia, presja oraz rotacje,
- ADC: ekonomia, DPS i pozycjonowanie,
- Support: wizja, KP, przygotowanie celów i ograniczenie śmierci.

Support nie jest oceniany za CS jak ADC, a jungler nie używa wag lanera.

## Stabilizacja

- większa waga nowszych meczów,
- stabilizacja wyniku przy małej próbce,
- Bayesian shrinkage win rate,
- stabilizacja wyników championów,
- poziom pewności zależny od liczby gier i stabilności roli.

Dodatkowe pola API:

- `algorithmVersion: "2.1-independent"`,
- `scoreConfidence`,
- `scoreBreakdown`,
- `roleInsights`.
