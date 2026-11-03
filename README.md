# Nexus Draft — statystyki graczy i analiza draftu League of Legends

Jedna aplikacja po polsku, w ciemnym stylu Nexus Draft. Łączy dwa dawne projekty:

- **Gracze** (dawny Nexus Sight): wyszukiwanie po Riot ID, profil z rangą i historią meczy, statystyki championów, szczegóły meczu, mecz na żywo, autorskie algorytmy oceny gry (OP Score, archetyp, tilt, benchmarki rang), raport AI i optymalizator buildu.
- **Draft**: analiza składów 5v5 z banami — szansa na wygraną, krzywa siły, plan gry, AD/AP, styl składu, podpowiedzi picków, import meczu na żywo, Twoja pula championów i trener AI.

Części są połączone: strona główna prowadzi do Draft, a z meczu na żywo przycisk **Analizuj draft** od razu wczytuje ten mecz do analizatora.

## Struktura

```
artifacts/web/            frontend (React + Vite + Tailwind), wspólny motyw w src/index.css
  src/pages/              strony graczy (home, profile, live, champion, match, ai-analysis…)
  src/draft/              strona /draft i jej komponenty
artifacts/api-server/     serwer Express (/api/*)
  src/routes/draft.ts     /api/draft/status, /api/draft/player, /api/draft/coach
lib/draft-core/           silnik Draft: baza championów, analiza składu, import meczu, prompt AI
lib/db/                   PostgreSQL + Drizzle (konta, limity dzienne)
lib/api-spec, api-zod, api-client-react   kontrakt API graczy (OpenAPI → klient React)
server.ts                 punkt startowy: baza → konta → API + frontend
```

## Uruchomienie

```bash
npm install
cp .env.example .env   # wpisz klucze
npm run dev            # serwer + Vite na :3000
npm test               # testy silnika Draft, importu meczu, trenera AI i tras /api/draft
npm run build          # frontend + serwer do dist/
npm start              # produkcja
```

Po nowym patchu LoL: `npm run sync:champions` (lista championów dla Draft).

## Wdrożenie (Render)

`render.yaml` — Build: `npm ci --include=dev && npm run build`, Start: `npm start`. W panelu ustaw `DATABASE_URL`, `SESSION_SECRET`, `RIOT_API_KEY`, `NVIDIA_API_KEY` (opcjonalnie `ADMIN_PASSWORD`). Stan bazy: `/api/status`.

Logowanie przez Google wymaga dodania domeny strony w Firebase Console → Authentication → Settings → Authorized domains.

Szczegóły algorytmów: `ALGORITHM_V2.md`, raport AI: `AI_REPORT_V3.md`.

---

Nexus Draft nie jest powiązany z Riot Games. League of Legends i grafiki championów są własnością Riot Games, Inc.
