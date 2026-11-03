import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, usageTable } from "@workspace/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";

const router: Router = Router();

function requireAdmin(req: Request, res: Response, next: () => void) {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: "forbidden", message: "Brak uprawnień administratora." });
    return;
  }
  next();
}

router.use(requireAdmin);

// GET /api/admin/users — list all users with today's usage
router.get("/users", async (_req: Request, res: Response) => {
  try {
    const users = await db
      .select()
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt));

    const today = new Date().toISOString().slice(0, 10);

    const usageRows = await db
      .select()
      .from(usageTable)
      .where(gte(usageTable.day, today));

    const usageByUser: Record<number, Record<string, number>> = {};
    for (const row of usageRows) {
      if (!usageByUser[row.userId]) usageByUser[row.userId] = {};
      usageByUser[row.userId][row.feature] = row.count;
    }

    const result = users.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      isAdmin: u.isAdmin,
      isActive: u.isActive,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      todayUsage: {
        search: usageByUser[u.id]?.search ?? 0,
        ai_analysis: usageByUser[u.id]?.ai_analysis ?? 0,
        optimizer: usageByUser[u.id]?.optimizer ?? 0,
      },
    }));

    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: "server_error", message: e?.message });
  }
});

// PATCH /api/admin/users/:id — update isAdmin or isActive
router.patch("/users/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { isAdmin, isActive } = req.body as { isAdmin?: boolean; isActive?: boolean };

    // Protect own admin status
    if (req.user!.uid === id && isAdmin === false) {
      res.status(400).json({ error: "self_demote", message: "Nie możesz odebrać sobie uprawnień administratora." });
      return;
    }

    const updates: Partial<typeof usersTable.$inferInsert> = {};
    if (typeof isAdmin === "boolean") updates.isAdmin = isAdmin;
    if (typeof isActive === "boolean") updates.isActive = isActive;

    const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
    if (!updated) {
      res.status(404).json({ error: "not_found", message: "Użytkownik nie znaleziony." });
      return;
    }

    res.json({ id: updated.id, email: updated.email, isAdmin: updated.isAdmin, isActive: updated.isActive });
  } catch (e: any) {
    res.status(500).json({ error: "server_error", message: e?.message });
  }
});

// DELETE /api/admin/users/:id — delete user
router.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (req.user!.uid === id) {
      res.status(400).json({ error: "self_delete", message: "Nie możesz usunąć własnego konta." });
      return;
    }
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: "server_error", message: e?.message });
  }
});

// GET /api/admin/stats — summary stats
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const users = await db.select().from(usersTable);
    const total = users.length;
    const admins = users.filter((u) => u.isAdmin).length;
    const active = users.filter((u) => u.isActive).length;

    const today = new Date().toISOString().slice(0, 10);
    const todayUsage = await db.select().from(usageTable).where(gte(usageTable.day, today));
    const totalSearches = todayUsage.filter((u) => u.feature === "search").reduce((s, u) => s + u.count, 0);
    const totalAi = todayUsage.filter((u) => u.feature === "ai_analysis").reduce((s, u) => s + u.count, 0);
    const totalOptimizer = todayUsage.filter((u) => u.feature === "optimizer").reduce((s, u) => s + u.count, 0);

    res.json({ total, admins, active, todaySearches: totalSearches, todayAi: totalAi, todayOptimizer: totalOptimizer });
  } catch (e: any) {
    res.status(500).json({ error: "server_error", message: e?.message });
  }
});

export default router;
