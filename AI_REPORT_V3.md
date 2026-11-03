# Nexus Sight — AI Report V3

Raport AI korzysta z niezależnego Algorithm V2 jako źródła ocen i liczb. Model językowy interpretuje dane oraz przygotowuje raport coachingowy, ale nie przelicza ponownie głównego wyniku.

## Modele

Lista modeli i kolejność zapasowych są w `artifacts/api-server/src/lib/nvidia-models.ts`.

> 27.07.2026 NVIDIA wycofała `qwen/qwen3-next-80b-a3b-instruct`, `meta/llama-3.3-70b-instruct` i `meta/llama-3.1-8b-instruct` (odpowiadają 410 Gone). Kod pomija je, nawet jeśli wciąż są wpisane w zmiennych środowiskowych.

**Pełny raport AI** (jakość ważniejsza niż czas):

1. `NVIDIA_MODEL` / `NVIDIA_AI_MODEL` z ustawień (jeśli są),
2. `nvidia/nemotron-3-ultra-550b-a55b` — najlepsze porady po polsku, ok. 1,5–2,5 min,
3. `NVIDIA_AI_FALLBACK_MODEL` (jeśli jest),
4. `openai/gpt-oss-20b` — szybszy zapas.

**Trener na żywo i optymalizator** (liczy się czas): najpierw `openai/gpt-oss-20b` (albo `NVIDIA_FAST_MODEL`), potem `nemotron-3-ultra`.

Modele są wywoływane strumieniowo. Jeśli model nie zacznie odpowiadać w 15–30 s (darmowe API NVIDIA bywa zatkane), serwer przechodzi do kolejnego.

```text
NVIDIA_API_KEY=...
NVIDIA_MODEL=nvidia/nemotron-3-ultra-550b-a55b   # opcjonalnie
NVIDIA_FAST_MODEL=openai/gpt-oss-20b             # opcjonalnie
```

## Przepływ

1. API pobiera rangę, mastery i ostatnie rankedy.
2. Mecze trafiają do `analysis-engine-v2.ts`.
3. Model otrzymuje ustrukturyzowane dane V2.
4. Odpowiedź jest wycinana do jednego obiektu JSON.
5. Zod waliduje strukturę.
6. Backend ponownie uziemia score, rating, formę, radar, konsekwencję i roadmapę w V2.
7. Po błędzie następuje próba kolejnego modelu.
8. Gdy wszystkie modele zawiodą albo nie ma klucza, zwracany jest pełny raport deterministyczny z V2.

Endpoint `/api/summoner/:puuid/ai-report` zwraca pole `meta` z wersją pipeline, modelem, próbami fallbacku, czasem generowania i pewnością wyniku.
