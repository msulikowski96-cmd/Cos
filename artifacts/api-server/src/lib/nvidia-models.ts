import OpenAI from "openai";

// Modele, które NVIDIA wycofała (odpowiadają 410 Gone). Pomijamy je, nawet jeśli
// stara konfiguracja na serwerze (np. NVIDIA_AI_MODEL) wciąż je wskazuje.
export const RETIRED_MODELS = new Set([
  "qwen/qwen3-next-80b-a3b-instruct",
  "meta/llama-3.3-70b-instruct",
  "meta/llama-3.1-8b-instruct",
]);

// Sprawdzone na darmowym API NVIDIA (październik 2026):
// - nemotron-3-ultra: najlepsza jakość po polsku, ale wolny (ok. 1,5–2,5 min na duży raport),
// - gpt-oss-20b: szybki (ok. 20–50 s), słabszy merytorycznie.
export const QUALITY_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
export const FAST_MODEL = "openai/gpt-oss-20b";

const env = (name: string) => process.env[name]?.trim() || undefined;

function chain(models: (string | undefined)[]): string[] {
  return [...new Set(models.filter((m): m is string => !!m && !RETIRED_MODELS.has(m)))];
}

/** Kolejność modeli dla pełnego raportu AI (jakość ważniejsza niż czas). */
export function qualityModels(): string[] {
  return chain([env("NVIDIA_MODEL"), env("NVIDIA_AI_MODEL"), QUALITY_MODEL, env("NVIDIA_AI_FALLBACK_MODEL"), FAST_MODEL]);
}

/** Kolejność modeli dla funkcji na żywo (optymalizator, analiza meczu) — liczy się czas. */
export function fastModels(): string[] {
  return chain([env("NVIDIA_FAST_MODEL"), FAST_MODEL, env("NVIDIA_MODEL"), QUALITY_MODEL]);
}

export function getNvidiaClient(): OpenAI {
  return new OpenAI({
    baseURL: "https://integrate.api.nvidia.com/v1",
    apiKey: process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY || "dummy_key",
    maxRetries: 0,
  });
}

export interface StreamOptions {
  maxTokens: number;
  temperature?: number;
  topP?: number;
  signal?: AbortSignal;
  /** Jeśli model nie wyśle nic w tym czasie, przechodzimy do następnego. */
  firstTokenMs?: number;
}

/**
 * Wywołuje model strumieniowo. Strumień utrzymuje połączenie przy wolnych modelach
 * i pozwala szybko wykryć model, który w ogóle nie zaczął odpowiadać.
 * Nowe modele najpierw „myślą” (reasoning) — dokładamy im zapas tokenów, żeby nie
 * skończyły limitu, zanim napiszą właściwą odpowiedź.
 */
export async function streamChat(client: OpenAI, model: string, messages: OpenAI.Chat.ChatCompletionMessageParam[], opts: StreamOptions): Promise<string> {
  const local = new AbortController();
  const onAbort = () => local.abort(opts.signal?.reason);
  opts.signal?.addEventListener("abort", onAbort, { once: true });
  let started = false;
  const firstToken = setTimeout(() => !started && local.abort(new Error("model nie zaczął odpowiadać")), opts.firstTokenMs ?? 30_000);

  try {
    const stream = await client.chat.completions.create(
      {
        model,
        messages,
        temperature: opts.temperature ?? 0.3,
        top_p: opts.topP ?? 0.8,
        max_tokens: opts.maxTokens + 3000,
        stream: true,
      },
      { signal: local.signal },
    );
    let text = "";
    for await (const chunk of stream) {
      const delta = (chunk.choices?.[0]?.delta ?? {}) as { content?: string | null; reasoning_content?: string; reasoning?: string };
      if (delta.content || delta.reasoning_content || delta.reasoning) started = true;
      if (delta.content) text += delta.content;
    }
    // Przerwany strumień potrafi zakończyć się bez wyjątku — nie zwracamy wtedy urwanego tekstu.
    if (opts.signal?.aborted) throw new Error("Przekroczono limit czasu generowania");
    if (local.signal.aborted) throw new Error(`${model}: ${started ? "przerwano generowanie" : "model nie zaczął odpowiadać"}`);
    if (!text.trim()) throw new Error("Model zwrócił pustą odpowiedź");
    return text;
  } catch (e) {
    if (opts.signal?.aborted) throw e;
    if (local.signal.aborted && !started) throw new Error(`${model}: model nie zaczął odpowiadać`);
    throw e;
  } finally {
    clearTimeout(firstToken);
    opts.signal?.removeEventListener("abort", onAbort);
  }
}

/** Usuwa „myślenie” modelu (<think>…</think>), jeśli trafiło do treści. */
export function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}
