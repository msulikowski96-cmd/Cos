import { Router, type Request, type Response } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  signSession,
  setSessionCookie,
  clearSessionCookie,
  getAllUsage,
  DAILY_LIMITS,
} from "../lib/auth";
import { requireAuth } from "../middlewares/auth";
import { verifyFirebaseIdToken, FirebaseTokenError } from "../lib/firebase-verify";
import { ADMIN_EMAILS } from "../lib/auth";
import { createRateLimit } from "../middlewares/rateLimit";

const router: Router = Router();

const authBruteforceLimit = createRateLimit({
  windowMs: 60_000,
  max: 10,
  message: "Zbyt wiele prób logowania. Spróbuj za chwilę.",
});

const emailSchema = z.string().trim().toLowerCase().email("Nieprawidłowy adres email").max(200);
const passwordSchema = z.string().min(8, "Hasło musi mieć co najmniej 8 znaków").max(200);

// POST /api/auth/register
router.post("/register", authBruteforceLimit, async (req: Request, res: Response) => {
  try {
    const parsed = z.object({
      email: emailSchema,
      password: passwordSchema,
      displayName: z.string().trim().min(1).max(60).optional(),
    }).safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "validation_error", message: parsed.error.issues[0]?.message ?? "Błąd walidacji" });
      return;
    }
    const { email, password, displayName } = parsed.data;

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "email_taken", message: "Ten email jest już zarejestrowany. Zaloguj się albo użyj logowania przez Google." });
      return;
    }

    const passwordHash = await hashPassword(password);
    // Rejestracja hasłem nie potwierdza właściciela adresu, więc nigdy nie nadaje uprawnień admina.
    // Admin: logowanie przez Google na adres z listy ADMIN_EMAILS albo zmienna ADMIN_PASSWORD.
    const [user] = await db
      .insert(usersTable)
      .values({ email, passwordHash, displayName: displayName ?? null, isAdmin: false })
      .returning();

    const token = signSession(user!);
    setSessionCookie(res, token);
    res.json({
      user: { id: user!.id, email: user!.email, displayName: user!.displayName, isAdmin: user!.isAdmin },
      limits: DAILY_LIMITS,
    });
  } catch (e: any) {
    console.error("[auth/register]", e);
    res.status(500).json({ error: "server_error", message: "Błąd serwera. Spróbuj ponownie za chwilę." });
  }
});

// POST /api/auth/login
router.post("/login", authBruteforceLimit, async (req: Request, res: Response) => {
  try {
    const parsed = z.object({ email: emailSchema, password: z.string().min(1).max(200) }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation_error", message: "Podaj email i hasło" });
      return;
    }
    const { email, password } = parsed.data;

    const rows = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    const user = rows[0];
    if (!user || !user.isActive) {
      res.status(401).json({ error: "invalid_credentials", message: "Nieprawidłowy email lub hasło." });
      return;
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: "invalid_credentials", message: "Nieprawidłowy email lub hasło." });
      return;
    }

    await db.update(usersTable).set({ lastLoginAt: new Date() }).where(eq(usersTable.id, user.id));

    const token = signSession(user);
    setSessionCookie(res, token);
    res.json({
      user: { id: user.id, email: user.email, displayName: user.displayName, isAdmin: user.isAdmin },
      limits: DAILY_LIMITS,
    });
  } catch (e: any) {
    console.error("[auth/login]", e);
    res.status(500).json({ error: "server_error", message: "Błąd serwera. Spróbuj ponownie za chwilę." });
  }
});

// POST /api/auth/firebase
// Body: { idToken } — token z Firebase Auth (user.getIdToken()). Serwer sam weryfikuje podpis
// Google i bierze email z tokenu; nie ufa emailowi przysłanemu przez przeglądarkę.
router.post("/firebase", authBruteforceLimit, async (req: Request, res: Response) => {
  try {
    const parsed = z.object({ idToken: z.string().min(20).max(5000) }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation_error", message: "Brak tokenu logowania Firebase." });
      return;
    }

    let fb;
    try {
      fb = await verifyFirebaseIdToken(parsed.data.idToken);
    } catch (e: any) {
      const status = e instanceof FirebaseTokenError ? 401 : 503;
      res.status(status).json({ error: "invalid_token", message: e?.message ?? "Nie udało się zweryfikować logowania." });
      return;
    }
    if (!fb.emailVerified) {
      res.status(403).json({ error: "email_not_verified", message: "Potwierdź adres email w Firebase albo zaloguj się przez Google." });
      return;
    }

    const email = fb.email;
    const displayName = fb.name?.trim().slice(0, 100) || undefined;
    const isAdmin = ADMIN_EMAILS.has(email);
    const rows = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    let user = rows[0];

    if (!user) {
      // Konto bez hasła (logowanie tylko przez Google) — losowy hash, którego nikt nie zna.
      const unusableHash = await hashPassword(crypto.randomBytes(32).toString("hex"));
      const [created] = await db
        .insert(usersTable)
        .values({ email, passwordHash: unusableHash, displayName: displayName ?? null, isAdmin, isActive: true })
        .returning();
      user = created;
    } else {
      if (!user.isActive) {
        res.status(403).json({ error: "account_disabled", message: "To konto zostało zablokowane." });
        return;
      }
      const updates: { lastLoginAt: Date; isAdmin?: boolean; displayName?: string } = { lastLoginAt: new Date() };
      if (isAdmin && !user.isAdmin) {
        updates.isAdmin = true;
        user.isAdmin = true;
      }
      if (displayName && !user.displayName) {
        updates.displayName = displayName;
        user.displayName = displayName;
      }
      await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id));
    }

    const token = signSession(user!);
    setSessionCookie(res, token);
    res.json({
      user: { id: user!.id, email: user!.email, displayName: user!.displayName, isAdmin: user!.isAdmin },
      limits: DAILY_LIMITS,
    });
  } catch (e: any) {
    console.error("[auth/firebase]", e);
    res.status(500).json({ error: "server_error", message: "Błąd serwera podczas logowania." });
  }
});

// POST /api/auth/logout
router.post("/logout", (_req: Request, res: Response) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.uid)).limit(1);
    const user = rows[0];
    if (!user) {
      clearSessionCookie(res);
      res.status(401).json({ error: "unauthorized", message: "Sesja wygasła" });
      return;
    }
    const usage = await getAllUsage(user.id);
    res.json({
      user: { id: user.id, email: user.email, displayName: user.displayName, isAdmin: user.isAdmin },
      usage,
      limits: DAILY_LIMITS,
    });
  } catch (e: any) {
    console.error("[auth/me]", e);
    res.status(500).json({ error: "server_error", message: "Błąd serwera. Spróbuj ponownie za chwilę." });
  }
});

export default router;
