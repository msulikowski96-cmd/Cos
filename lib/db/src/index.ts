import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import fs from "fs";
import path from "path";
import * as schema from "./schema";
import { usersTable, usageTable, conversations, messages } from "./schema";

const { Pool } = pg;

// In-memory data store fallback & persistence interfaces
export interface MemoryUser {
  id: number;
  email: string;
  passwordHash: string;
  displayName: string | null;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface MemoryUsage {
  id: number;
  userId: number;
  feature: string;
  day: string;
  count: number;
}

export interface MemoryConversation {
  id: number;
  title: string;
  createdAt: Date;
}

export interface MemoryMessage {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  createdAt: Date;
}

const DB_FILE = path.resolve(process.cwd(), ".local", "db.json");

const memoryStore = {
  users: [] as MemoryUser[],
  usage: [] as MemoryUsage[],
  conversations: [] as MemoryConversation[],
  messages: [] as MemoryMessage[],
  nextUserId: 1,
  nextUsageId: 1,
  nextConvId: 1,
  nextMsgId: 1,
};

function saveStoreToDisk(): void {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryStore, null, 2), "utf8");
  } catch {
    // Non-fatal if filesystem is read-only
  }
}

function loadStoreFromDisk(): void {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      const data = JSON.parse(raw);
      if (Array.isArray(data.users)) {
        memoryStore.users = data.users.map((u: any) => ({
          ...u,
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
          lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : null,
        }));
      }
      if (Array.isArray(data.usage)) memoryStore.usage = data.usage;
      if (Array.isArray(data.conversations)) {
        memoryStore.conversations = data.conversations.map((c: any) => ({
          ...c,
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
        }));
      }
      if (Array.isArray(data.messages)) {
        memoryStore.messages = data.messages.map((m: any) => ({
          ...m,
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
        }));
      }
      memoryStore.nextUserId = Math.max(1, ...(memoryStore.users.map((u) => u.id) || [0])) + 1;
      memoryStore.nextUsageId = Math.max(1, ...(memoryStore.usage.map((u) => u.id) || [0])) + 1;
      memoryStore.nextConvId = Math.max(1, ...(memoryStore.conversations.map((c) => c.id) || [0])) + 1;
      memoryStore.nextMsgId = Math.max(1, ...(memoryStore.messages.map((m) => m.id) || [0])) + 1;
    }
  } catch {
    // Fall back to empty store
  }

}

// Initial load
loadStoreFromDisk();

let poolInstance: any = null;
let realDrizzleDb: any = null;

/** "postgres" gdy ustawiono DATABASE_URL, w przeciwnym razie lokalny plik (tylko do developmentu). */
export const dbMode: "postgres" | "local" = process.env.DATABASE_URL?.trim() ? "postgres" : "local";
let postgresReady = false;
let lastDbError: string | null = null;

/**
 * SSL zależnie od adresu bazy:
 * - wewnętrzny host Render (np. "dpg-abc123-a", bez kropek) i localhost — bez SSL (sieć wewnętrzna),
 * - zewnętrzny adres (np. *.render.com, Neon, Supabase) — SSL,
 * - parametr ?sslmode=… w adresie ma pierwszeństwo.
 */
export function sslConfigFor(connectionString: string): false | { rejectUnauthorized: boolean } {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    return { rejectUnauthorized: false };
  }
  const mode = url.searchParams.get("sslmode");
  if (mode === "disable") return false;
  if (mode) return { rejectUnauthorized: false };
  const host = url.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") return false;
  if (!host.includes(".")) return false;
  return { rejectUnauthorized: false };
}

if (dbMode === "postgres") {
  const connectionString = process.env.DATABASE_URL!.trim();
  // pg nie lubi sslmode w adresie razem z obiektem ssl — usuwamy go, konfigurację ustawiamy sami.
  const cleaned = connectionString.replace(/([?&])sslmode=[^&]*(&?)/, (_m, a, b) => (b ? a : "")).replace(/[?&]$/, "");
  poolInstance = new Pool({
    connectionString: cleaned,
    ssl: sslConfigFor(connectionString),
    connectionTimeoutMillis: 8000,
    max: 10,
  });
  poolInstance.on("error", (err: any) => {
    lastDbError = err?.message ?? String(err);
    console.error("[db] PostgreSQL pool error:", lastDbError);
  });
  realDrizzleDb = drizzle(poolInstance, { schema });
} else {
  console.warn("[db] Brak DATABASE_URL — konta zapisują się w lokalnym pliku .local/db.json (tylko do developmentu; na hostingu znikną po restarcie).");
}

export function dbStatus() {
  return { mode: dbMode, ready: dbMode === "local" || postgresReady, error: postgresReady ? null : lastDbError };
}

function getTableName(table: any): string {
  if (!table) return "";
  if (table === usersTable) return "users";
  if (table === usageTable) return "usage";
  if (table === conversations) return "conversations";
  if (table === messages) return "messages";

  const symName = table[Symbol.for("drizzle:Name")];
  if (typeof symName === "string") return symName;

  const baseName = table[Symbol.for("drizzle:BaseName")];
  if (typeof baseName === "string") return baseName;

  if (table._?.name) return table._.name;
  if (table.name) return table.name;
  return "";
}

function getStoreForTable(table: any): any[] {
  const name = getTableName(table);
  if (name === "users") return memoryStore.users;
  if (name === "usage") return memoryStore.usage;
  if (name === "conversations") return memoryStore.conversations;
  if (name === "messages") return memoryStore.messages;
  return [];
}

const FIELD_MAP: Record<string, string> = {
  password_hash: "passwordHash",
  display_name: "displayName",
  is_admin: "isAdmin",
  is_active: "isActive",
  created_at: "createdAt",
  last_login_at: "lastLoginAt",
  user_id: "userId",
  conversation_id: "conversationId",
};

export function matchCondition(item: any, sqlObj: any): boolean {
  if (!sqlObj) return true;
  if (!item) return false;

  // Handle Drizzle SQL objects with queryChunks
  if (sqlObj.queryChunks && Array.isArray(sqlObj.queryChunks)) {
    const chunks = sqlObj.queryChunks;

    // Handle parentheses wrapping: [ "(", SQL, ")" ]
    if (chunks.length === 3 && chunks[0]?.value?.[0] === "(" && chunks[2]?.value?.[0] === ")") {
      return matchCondition(item, chunks[1]);
    }

    // Handle AND expressions
    const hasAnd = chunks.some(
      (c: any) => typeof c?.value?.[0] === "string" && c.value[0].toLowerCase().includes(" and ")
    );
    if (hasAnd) {
      const parts: any[] = [];
      let current: any[] = [];
      for (const c of chunks) {
        if (typeof c?.value?.[0] === "string" && c.value[0].toLowerCase().includes(" and ")) {
          if (current.length === 1 && current[0].queryChunks) parts.push(current[0]);
          else parts.push({ queryChunks: current });
          current = [];
        } else {
          current.push(c);
        }
      }
      if (current.length > 0) {
        if (current.length === 1 && current[0].queryChunks) parts.push(current[0]);
        else parts.push({ queryChunks: current });
      }
      return parts.every((part) => matchCondition(item, part));
    }

    // Handle single condition: column + operator + param
    let colName: string | null = null;
    let op = "=";
    let paramVal: any = undefined;

    for (const c of chunks) {
      if (c && typeof c.name === "string") {
        colName = c.name;
      } else if (c && c.value && Array.isArray(c.value) && typeof c.value[0] === "string") {
        const s = c.value[0].trim();
        if (["=", "!=", "<", "<=", ">", ">=", "<>"].includes(s)) {
          op = s;
        }
      } else if (c && "value" in c && !Array.isArray(c.value)) {
        paramVal = c.value;
      }
    }

    if (colName) {
      const key = FIELD_MAP[colName] || colName;
      const actual = item[key];

      if (op === "=") return actual == paramVal;
      if (op === "!=" || op === "<>") return actual != paramVal;
      if (op === ">") return actual > paramVal;
      if (op === ">=") return actual >= paramVal;
      if (op === "<") return actual < paramVal;
      if (op === "<=") return actual <= paramVal;
      return true;
    }
  }

  // Handle plain condition objects if passed directly
  if (sqlObj.operator === "=" || sqlObj.name === "eq") {
    const fieldName = sqlObj.left?.name || sqlObj.column?.name;
    const value = sqlObj.right?.value !== undefined ? sqlObj.right.value : sqlObj.value;
    if (fieldName) {
      const key = FIELD_MAP[fieldName] || fieldName;
      return item[key] == value;
    }
  }

  return true;
}

function parseOrder(orderClause: any): { key: string; isDesc: boolean } | null {
  if (!orderClause) return null;
  const chunks = orderClause.queryChunks || [];
  let colName: string | null = null;
  let isDesc = true;
  for (const c of chunks) {
    if (c && typeof c.name === "string") colName = c.name;
    if (c && c.value && Array.isArray(c.value) && typeof c.value[0] === "string") {
      const s = c.value[0].toLowerCase();
      if (s.includes("asc")) isDesc = false;
      if (s.includes("desc")) isDesc = true;
    }
  }
  if (!colName) return null;
  return { key: FIELD_MAP[colName] || colName, isDesc };
}

const memoryDb: any = {
  select: () => {
    let targetTable: any = null;
    let whereCondition: any = null;
    let limitVal: number | null = null;
    let orderClause: any = null;

    const queryBuilder: any = {
      from: (table: any) => {
        targetTable = table;
        return queryBuilder;
      },
      where: (condition: any) => {
        whereCondition = condition;
        return queryBuilder;
      },
      limit: (n: number) => {
        limitVal = n;
        return queryBuilder;
      },
      orderBy: (order: any) => {
        orderClause = order;
        return queryBuilder;
      },
      then: (resolve: any, reject?: any) => {
        try {
          const store = getStoreForTable(targetTable);
          let filtered = store.filter((item) => matchCondition(item, whereCondition));

          if (orderClause) {
            const parsed = parseOrder(orderClause);
            if (parsed) {
              filtered = [...filtered].sort((a: any, b: any) => {
                const va = a[parsed.key];
                const vb = b[parsed.key];
                if (va == null && vb == null) return 0;
                if (va == null) return parsed.isDesc ? 1 : -1;
                if (vb == null) return parsed.isDesc ? -1 : 1;
                if (va < vb) return parsed.isDesc ? 1 : -1;
                if (va > vb) return parsed.isDesc ? -1 : 1;
                return 0;
              });
            } else {
              filtered = [...filtered].reverse();
            }
          }

          if (limitVal !== null) {
            filtered = filtered.slice(0, limitVal);
          }
          return resolve(filtered);
        } catch (e) {
          if (reject) reject(e);
          else throw e;
        }
      },
      catch: (reject: any) => queryBuilder.then((res: any) => res, reject),
    };
    return queryBuilder;
  },

  insert: (table: any) => {
    let insertValues: any = null;
    let onConflictAction: any = null;

    const insertBuilder: any = {
      values: (val: any) => {
        insertValues = val;
        return insertBuilder;
      },
      onConflictDoUpdate: (config: any) => {
        onConflictAction = config;
        return insertBuilder;
      },
      onConflictDoNothing: () => insertBuilder,
      returning: () => insertBuilder,
      then: (resolve: any, reject?: any) => {
        try {
          const tableName = getTableName(table);
          const store = getStoreForTable(table);

          if (tableName === "users") {
            const id = memoryStore.nextUserId++;
            const user: MemoryUser = {
              id,
              email: insertValues.email,
              passwordHash: insertValues.passwordHash,
              displayName: insertValues.displayName ?? null,
              isAdmin: insertValues.isAdmin ?? (insertValues.email === "msulikowski96@gmail.com"),
              isActive: insertValues.isActive ?? true,
              createdAt: new Date(),
              lastLoginAt: null,
            };
            store.push(user);
            saveStoreToDisk();
            return resolve([user]);
          }

          if (tableName === "usage") {
            const existing = memoryStore.usage.find(
              (u) =>
                u.userId === insertValues.userId &&
                u.feature === insertValues.feature &&
                u.day === insertValues.day
            );
            if (existing && onConflictAction) {
              existing.count += 1;
              saveStoreToDisk();
              return resolve([existing]);
            }
            const id = memoryStore.nextUsageId++;
            const row: MemoryUsage = {
              id,
              userId: insertValues.userId,
              feature: insertValues.feature,
              day: insertValues.day,
              count: insertValues.count ?? 1,
            };
            store.push(row);
            saveStoreToDisk();
            return resolve([row]);
          }

          const id = Date.now();
          const item = { id, ...insertValues, createdAt: new Date() };
          store.push(item);
          saveStoreToDisk();
          return resolve([item]);
        } catch (e) {
          if (reject) reject(e);
          else throw e;
        }
      },
      catch: (reject: any) => insertBuilder.then((res: any) => res, reject),
    };
    return insertBuilder;
  },

  update: (table: any) => {
    let updateSet: any = null;
    let whereCondition: any = null;

    const updateBuilder: any = {
      set: (val: any) => {
        updateSet = val;
        return updateBuilder;
      },
      where: (condition: any) => {
        whereCondition = condition;
        return updateBuilder;
      },
      returning: () => updateBuilder,
      then: (resolve: any, reject?: any) => {
        try {
          const store = getStoreForTable(table);
          const updatedItems: any[] = [];
          for (let i = 0; i < store.length; i++) {
            if (matchCondition(store[i], whereCondition)) {
              store[i] = { ...store[i], ...updateSet };
              updatedItems.push(store[i]);
            }
          }
          saveStoreToDisk();
          return resolve(updatedItems);
        } catch (e) {
          if (reject) reject(e);
          else throw e;
        }
      },
      catch: (reject: any) => updateBuilder.then((res: any) => res, reject),
    };
    return updateBuilder;
  },

  delete: (table: any) => {
    let whereCondition: any = null;
    const deleteBuilder: any = {
      where: (condition: any) => {
        whereCondition = condition;
        return deleteBuilder;
      },
      then: (resolve: any, reject?: any) => {
        try {
          const store = getStoreForTable(table);
          for (let i = store.length - 1; i >= 0; i--) {
            if (matchCondition(store[i], whereCondition)) {
              store.splice(i, 1);
            }
          }
          saveStoreToDisk();
          return resolve([]);
        } catch (e) {
          if (reject) reject(e);
          else throw e;
        }
      },
      catch: (reject: any) => deleteBuilder.then((res: any) => res, reject),
    };
    return deleteBuilder;
  },
};

// Jedno źródło danych na cały czas działania serwera: PostgreSQL (gdy jest DATABASE_URL)
// albo lokalny plik. Dawniej błąd zapytania po cichu przełączał na plik, co rozdwajało
// konta (część w bazie, część w pliku znikającym po restarcie).
export const db: any = dbMode === "postgres" ? realDrizzleDb : memoryDb;

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "last_login_at" TIMESTAMP WITH TIME ZONE
  );
  CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");

  CREATE TABLE IF NOT EXISTS "usage" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "feature" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0
  );
  CREATE UNIQUE INDEX IF NOT EXISTS "usage_user_feature_day_unique" ON "usage" ("user_id", "feature", "day");
  CREATE INDEX IF NOT EXISTS "usage_user_day_idx" ON "usage" ("user_id", "day");

  CREATE TABLE IF NOT EXISTS "conversations" (
    "id" SERIAL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS "messages" (
    "id" SERIAL PRIMARY KEY,
    "conversation_id" INTEGER NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  );
`;

async function connectOnce(): Promise<void> {
  const client = await poolInstance.connect();
  try {
    await client.query(SCHEMA_SQL);
  } finally {
    client.release();
  }
}

/**
 * Łączy z PostgreSQL i tworzy tabele. Przy błędzie próbuje ponownie (baza na Render
 * potrafi wstawać dłużej niż serwer), a potem dalej w tle co 30 s. Do czasu połączenia
 * zapytania zwracają błąd — nie zapisujemy kont w miejscu, z którego znikną.
 */
export async function initDatabase(attempts = 6): Promise<void> {
  if (dbMode === "local") {
    console.log("[db] Tryb lokalny (.local/db.json)");
    return;
  }
  for (let i = 1; i <= attempts; i++) {
    try {
      await connectOnce();
      postgresReady = true;
      lastDbError = null;
      console.log("[db] PostgreSQL połączony, tabele gotowe");
      return;
    } catch (err: any) {
      lastDbError = err?.message ?? String(err);
      console.error(`[db] Próba ${i}/${attempts} połączenia z PostgreSQL nieudana: ${lastDbError}`);
      if (i < attempts) await new Promise((r) => setTimeout(r, Math.min(1000 * 2 ** (i - 1), 10_000)));
    }
  }
  console.error("[db] Nie udało się połączyć z PostgreSQL. Sprawdź DATABASE_URL (na Render: Internal Database URL). Ponawiam w tle co 30 s.");
  const timer = setInterval(async () => {
    try {
      await connectOnce();
      postgresReady = true;
      lastDbError = null;
      clearInterval(timer);
      console.log("[db] PostgreSQL połączony (ponowna próba w tle)");
    } catch (err: any) {
      lastDbError = err?.message ?? String(err);
    }
  }, 30_000);
  timer.unref?.();
}

export const pool = poolInstance;
export * from "./schema";

