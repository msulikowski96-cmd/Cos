// Zamiennik @workspace/db dla Cloudflare Workers.
// Workers nie pozwalają dzielić połączeń TCP między zapytaniami HTTP, więc zamiast globalnej puli
// (pg.Pool) każde zapytanie HTTP dostaje własnego klienta pg, otwieranego dopiero przy pierwszym
// zapytaniu SQL. Drizzle dostaje "leniwego klienta", który przekazuje query() do tego klienta.
import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../../lib/db/src/schema";

type Store = { client?: Promise<pg.Client> };
export const requestScope = new AsyncLocalStorage<Store>();

let lastDbError: string | null = null;
let everConnected = false;

function connectionString(): string {
  const url = (process.env.DATABASE_URL || "").trim();
  if (!url) throw new Error("Brak DATABASE_URL");
  return url;
}

function clientForRequest(): Promise<pg.Client> {
  const store = requestScope.getStore();
  if (!store) throw new Error("Zapytanie do bazy poza obsługą żądania HTTP");
  if (!store.client) {
    store.client = (async () => {
      const raw = connectionString();
      const cleaned = raw.replace(/([?&])(sslmode|channel_binding)=[^&]*(&?)/g, (_m, a, _k, b) => (b ? a : "")).replace(/[?&]$/, "");
      const c = new pg.Client({ connectionString: cleaned, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
      try {
        await c.connect();
        everConnected = true;
        lastDbError = null;
      } catch (e: any) {
        lastDbError = e?.message ?? String(e);
        store.client = undefined;
        throw e;
      }
      return c;
    })();
  }
  return store.client;
}

/** Zamyka klienta po zakończeniu żądania (wywoływane z punktu wejścia Workera). */
export async function closeRequestClient(store: Store): Promise<void> {
  if (!store.client) return;
  try { (await store.client).end().catch(() => {}); } catch {}
}

const lazyClient = {
  async query(...args: any[]) {
    const c = await clientForRequest();
    return (c.query as any)(...args);
  },
};

export const db: any = drizzle(lazyClient as any, { schema });
export const pool = null;
export const dbMode: "postgres" | "local" = "postgres";

export function dbStatus() {
  return { mode: dbMode, ready: Boolean(process.env.DATABASE_URL) && (everConnected || !lastDbError), error: lastDbError };
}

/** Tabele tworzy już serwis na Render (ta sama baza) — tu tylko sprawdzamy połączenie. */
export async function initDatabase(): Promise<void> {
  await db.execute("select 1");
}

export function sslConfigFor(_cs: string) { return { rejectUnauthorized: false }; }

export * from "../../lib/db/src/schema";
