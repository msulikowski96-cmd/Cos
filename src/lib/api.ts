import { useEffect, useState } from "react";
import type { Draft, Side } from "./analysis";
import type { CoachReport } from "./coach";
import type { LiveDraft } from "./live";

export interface ServerStatus {
  riot: boolean;
  ai: boolean;
  regions: { id: string; label: string }[];
}

export interface PlayerResponse {
  account: { gameName: string; tagLine: string };
  pool: { id: string; level: number; points: number }[];
  live: LiveDraft | null;
  inUnsupportedGame: boolean;
}

export interface CoachResponse {
  report: CoachReport;
  model: string;
  cached: boolean;
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Błąd serwera (${res.status}).`);
  return data as T;
}

/** Sprawdza, czy działa serwer z kluczami. Wersja statyczna (bez serwera) po prostu ukrywa funkcje online. */
export function useServerStatus() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("api/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => alive && s && typeof s.riot === "boolean" && setStatus(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return status;
}

export const fetchPlayer = (region: string, riotId: string) =>
  call<PlayerResponse>(`api/riot/player?region=${encodeURIComponent(region)}&riotId=${encodeURIComponent(riotId)}`);

export type CoachProgress = { phase: "thinking" | "writing"; chars: number; expected: number };

/** Trener AI odpowiada strumieniowo (NDJSON), żeby pokazać postęp przy wolniejszych modelach. */
export async function fetchCoach(draft: Draft, mySide: Side, myChampion: string | null, onProgress: (p: CoachProgress) => void): Promise<CoachResponse> {
  const res = await fetch("api/ai/coach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ draft, mySide, myChampion }),
  });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Błąd serwera (${res.status}).`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let expected = 2200;
  for (;;) {
    const { value, done } = await reader.read();
    buf += decoder.decode(value, { stream: !done });
    let nl: number;
    while ((nl = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      const msg = JSON.parse(line);
      if (msg.type === "start") expected = msg.expected ?? expected;
      else if (msg.type === "progress") onProgress({ phase: msg.phase, chars: msg.chars, expected });
      else if (msg.type === "done") return { report: msg.report, model: msg.model, cached: msg.cached };
      else if (msg.type === "error") throw new Error(msg.error);
    }
    if (done) break;
  }
  throw new Error("Połączenie z serwerem zostało przerwane.");
}
