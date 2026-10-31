import OpenAI from "openai";
import { coachPrompt, extractJson, normalizeReport, type CoachReport } from "../src/lib/coach";
import { encodeDraft } from "../src/lib/share";
import type { Draft, Side } from "../src/lib/analysis";

// Dowolny dostawca zgodny z API OpenAI. Domyślnie NVIDIA (jak w Nexus Sight).
const apiKey = () => (process.env.AI_API_KEY || process.env.NVIDIA_API_KEY || "").trim();
const baseURL = () => process.env.AI_BASE_URL?.trim() || "https://integrate.api.nvidia.com/v1";

// Sprawdzone w październiku 2026 na darmowym API NVIDIA: gpt-oss-20b odpowiada stabilnie (~25 s),
// wcześniejsze qwen3-next i llama-3.3-70b zostały wycofane. Zmienne środowiskowe mają pierwszeństwo.
const DEFAULT_MODELS = ["openai/gpt-oss-20b", "mistralai/mistral-large-4-1t-a52b"];
const models = () =>
  [...new Set([process.env.AI_MODEL, process.env.NVIDIA_AI_MODEL, ...DEFAULT_MODELS].map((m) => m?.trim()).filter(Boolean) as string[])].slice(0, 3);

export const aiEnabled = () => apiKey().length > 0;

/** Ile czasu czekamy na pierwszy token, zanim przejdziemy do kolejnego modelu. */
const FIRST_TOKEN_MS = 20_000;
const TOTAL_MS = 100_000;
/** Typowa długość odpowiedzi (znaki treści) — do paska postępu. */
export const EXPECTED_CHARS = 2200;

const cache = new Map<string, { at: number; report: CoachReport; model: string }>();
const TTL = 30 * 60_000;

export interface CoachResult {
  report: CoachReport;
  model: string;
  cached: boolean;
}

export type Progress = { phase: "thinking" | "writing"; chars: number };

async function runModel(client: OpenAI, model: string, system: string, user: string, onProgress: (p: Progress) => void) {
  const ctrl = new AbortController();
  const total = setTimeout(() => ctrl.abort(), TOTAL_MS);
  let started = false;
  const first = setTimeout(() => !started && ctrl.abort(), FIRST_TOKEN_MS);
  try {
    const stream = await client.chat.completions.create(
      {
        model,
        stream: true,
        temperature: 0.4,
        max_tokens: 4000,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      },
      { signal: ctrl.signal },
    );
    let text = "";
    let thinking = 0;
    let last = 0;
    for await (const chunk of stream) {
      const delta = (chunk.choices[0]?.delta ?? {}) as { content?: string | null; reasoning_content?: string; reasoning?: string };
      const r = delta.reasoning_content ?? delta.reasoning ?? "";
      if (delta.content || r) started = true;
      text += delta.content ?? "";
      thinking += r.length;
      // nie zalewamy klienta — aktualizacja co ~120 znaków
      const size = text.length + thinking;
      if (size - last > 120) {
        last = size;
        onProgress(text.length ? { phase: "writing", chars: text.length } : { phase: "thinking", chars: thinking });
      }
    }
    return text;
  } catch (e) {
    if (ctrl.signal.aborted) throw new Error(started ? "przekroczono czas generowania" : "model nie zaczął odpowiadać");
    throw e;
  } finally {
    clearTimeout(total);
    clearTimeout(first);
  }
}

export async function coach(d: Draft, mySide: Side, myChampion: string | null, onProgress: (p: Progress) => void = () => {}): Promise<CoachResult> {
  const cacheKey = `${encodeDraft(d)}|${mySide}|${myChampion ?? ""}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL) return { report: hit.report, model: hit.model, cached: true };

  const client = new OpenAI({ apiKey: apiKey(), baseURL: baseURL(), maxRetries: 0, timeout: TOTAL_MS });
  const { system, user } = coachPrompt(d, mySide, myChampion);
  const errors: string[] = [];

  for (const model of models()) {
    try {
      const text = await runModel(client, model, system, user, onProgress);
      const report = normalizeReport(extractJson(text), d, mySide);
      cache.set(cacheKey, { at: Date.now(), report, model });
      if (cache.size > 300) cache.delete(cache.keys().next().value!);
      return { report, model, cached: false };
    } catch (e) {
      errors.push(`${model}: ${(e as Error).message.slice(0, 200)}`);
    }
  }
  throw new Error(errors.join(" | "));
}
