const RIOT_API_KEY = process.env.RIOT_API_KEY ?? "";
if (!RIOT_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn("[riot-fetch] RIOT_API_KEY is not set — all Riot API requests will fail with 401.");
}
const MAX_RETRIES = 2;
const MIN_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 10000;

export class RiotApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: "rate_limited" | "not_found" | "unauthorized" | "riot_api_error"
  ) {
    super(message);
    this.name = "RiotApiError";
  }
}

export async function riotFetch(
  url: string,
  retries = MAX_RETRIES,
  signal?: AbortSignal
): Promise<Response> {
  const res = await fetch(url, {
    headers: { "X-Riot-Token": RIOT_API_KEY },
    signal,
  });

  if (res.ok) return res;

  if (res.status === 429 && retries > 0) {
    const retryAfterHeader = res.headers.get("Retry-After");
    const retryAfterSecs = retryAfterHeader ? Number(retryAfterHeader) : 1;
    const delay = Math.min(
      Math.max(retryAfterSecs * 1000, MIN_RETRY_DELAY_MS),
      MAX_RETRY_DELAY_MS
    );
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      }, delay);

      const onAbort = () => {
        clearTimeout(timeout);
        reject(new DOMException("The operation was aborted.", "AbortError"));
      };

      signal?.addEventListener("abort", onAbort, { once: true });
    });

    return riotFetch(url, retries - 1, signal);
  }

  const text = await res.text().catch(() => "");

  if (res.status === 429) {
    throw new RiotApiError(
      "Riot API rate limit exceeded. Spróbuj ponownie za chwilę.",
      429,
      "rate_limited"
    );
  }
  if (res.status === 404) {
    throw new RiotApiError(text || "Not found", 404, "not_found");
  }
  if (res.status === 403 || res.status === 401) {
    throw new RiotApiError("Nieprawidłowy klucz API Riot.", res.status, "unauthorized");
  }

  throw new RiotApiError(text || "Riot API error", res.status, "riot_api_error");
}

export function handleRiotError(err: unknown, res: any): void {
  if (err instanceof RiotApiError) {
    if (err.code === "not_found") {
      res.status(404).json({ error: "not_found", message: err.message });
    } else if (err.code === "rate_limited") {
      res.status(429).json({ error: "rate_limited", message: err.message });
    } else if (err.code === "unauthorized") {
      res.status(403).json({ error: "unauthorized", message: err.message });
    } else {
      res.status(500).json({ error: "riot_api_error", message: err.message });
    }
  } else {
    const e = err as any;
    res.status(500).json({ error: "riot_api_error", message: e?.message ?? "Unknown error" });
  }
}
