import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { db } from "@workspace/db";
import { usersTable, usageTable, type User } from "@workspace/db/schema";
import { and, eq, sql } from "drizzle-orm";

// ===== SECRET =====
function loadSecret(): string {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    console.warn("[auth] Brak SESSION_SECRET (min. 16 znaków) — po każdym restarcie serwera wszyscy zostaną wylogowani.");
  }
  const file = path.resolve(process.cwd(), ".local", "session-secret");
  try {
    if (fs.existsSync(file)) return fs.readFileSync(file, "utf8").trim();
  } catch {}
  const generated = crypto.randomBytes(48).toString("hex");
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, generated, { mode: 0o600 });
  } catch {}
  return generated;
}

const SECRET = loadSecret();
const COOKIE_NAME = "ns_session";
const TOKEN_TTL = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  uid: number;
  email: string;
  isAdmin: boolean;
  displayName?: string | null;
  iat?: number;
  exp?: number;
}

export function signSession(user: Pick<User, "id" | "email" | "isAdmin">): string {
  return jwt.sign({ uid: user.id, email: user.email, isAdmin: user.isAdmin }, SECRET, { expiresIn: TOKEN_TTL });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: any, token: string): void {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: TOKEN_TTL * 1000,
    path: "/",
  });
}

export function clearSessionCookie(res: any): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function readSessionCookie(req: any): string | null {
  return req.cookies?.[COOKIE_NAME] ?? null;
}

// ===== ADMIN =====
/** Adresy, które dostają uprawnienia admina po zalogowaniu przez Google (zweryfikowany email). */
export const ADMIN_EMAILS = new Set<string>(
  (process.env.ADMIN_EMAILS ?? "msulikowski96@gmail.com,sulikowskim96@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

// Hash hasła "admin123456", które było kiedyś wpisane w kod (publicznie znane).
const LEAKED_DEFAULT_HASH = "$2b$10$RSaOXDhLm3FFeQT2Eo9MQOZodD27KToV.jfqLBAC52KQVy68p77jm";

/**
 * Uruchamiane raz przy starcie serwera:
 * 1. Unieważnia publicznie znane domyślne hasło admina (jeśli wciąż jest w bazie).
 * 2. Jeśli ustawiono ADMIN_PASSWORD (min. 12 znaków), ustawia je dla pierwszego adresu z ADMIN_EMAILS.
 */
export async function bootstrapAuth(): Promise<void> {
  try {
    const leaked = await db.select().from(usersTable).where(eq(usersTable.passwordHash, LEAKED_DEFAULT_HASH));
    for (const u of leaked) {
      await db
        .update(usersTable)
        .set({ passwordHash: await hashPassword(crypto.randomBytes(32).toString("hex")) })
        .where(eq(usersTable.id, u.id));
      console.warn(`[auth] Unieważniono domyślne hasło konta ${u.email} — zaloguj się przez Google albo ustaw ADMIN_PASSWORD.`);
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminEmail = [...ADMIN_EMAILS][0];
    if (adminPassword && adminEmail) {
      if (adminPassword.length < 12) {
        console.warn("[auth] ADMIN_PASSWORD jest za krótkie (min. 12 znaków) — pominięto.");
      } else {
        const passwordHash = await hashPassword(adminPassword);
        const rows = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail)).limit(1);
        if (rows[0]) {
          await db.update(usersTable).set({ passwordHash, isAdmin: true, isActive: true }).where(eq(usersTable.id, rows[0].id));
        } else {
          await db.insert(usersTable).values({ email: adminEmail, passwordHash, displayName: "Admin", isAdmin: true, isActive: true });
        }
        console.log(`[auth] Hasło admina (${adminEmail}) ustawione z ADMIN_PASSWORD.`);
      }
    }
  } catch (e: any) {
    console.error("[auth] bootstrapAuth nieudany:", e?.message ?? e);
  }
}

// ===== HASH =====
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ===== USAGE =====
export type FeatureKey = "search" | "ai_analysis" | "optimizer";

export const DAILY_LIMITS: Record<FeatureKey, number> = {
  search: 3,
  ai_analysis: 1,
  optimizer: 2,
};

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  search: "wyszukiwań graczy",
  ai_analysis: "analiz AI",
  optimizer: "optymalizatorów / live insights",
};

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getUsageCount(userId: number, feature: FeatureKey): Promise<number> {
  const day = todayUTC();
  const rows = await db
    .select()
    .from(usageTable)
    .where(and(eq(usageTable.userId, userId), eq(usageTable.feature, feature), eq(usageTable.day, day)))
    .limit(1);
  return rows[0]?.count ?? 0;
}

export async function getAllUsage(userId: number): Promise<Record<FeatureKey, { used: number; limit: number }>> {
  const features: FeatureKey[] = ["search", "ai_analysis", "optimizer"];
  const out: any = {};
  for (const f of features) {
    const used = await getUsageCount(userId, f);
    out[f] = { used, limit: DAILY_LIMITS[f] };
  }
  return out;
}

export async function incrementUsage(userId: number, feature: FeatureKey): Promise<void> {
  const day = todayUTC();
  // Atomic upsert (avoids race conditions)
  await db
    .insert(usageTable)
    .values({ userId, feature, day, count: 1 })
    .onConflictDoUpdate({
      target: [usageTable.userId, usageTable.feature, usageTable.day],
      set: { count: sql`${usageTable.count} + 1` },
    });
}
