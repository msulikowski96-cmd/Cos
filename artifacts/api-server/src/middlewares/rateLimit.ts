import type { Request, Response, NextFunction } from "express";

interface Window {
  timestamps: number[];
}

const store = new Map<string, Window>();

function getIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    return first.trim();
  }
  return req.socket?.remoteAddress ?? "unknown";
}

function slideWindow(ip: string, windowMs: number, maxRequests: number): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const cutoff = now - windowMs;

  let entry = store.get(ip);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(ip, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  const count = entry.timestamps.length;
  if (count >= maxRequests) {
    const oldest = entry.timestamps[0]!;
    return { allowed: false, remaining: 0, resetMs: oldest + windowMs - now };
  }

  entry.timestamps.push(now);
  return { allowed: true, remaining: maxRequests - count - 1, resetMs: windowMs };
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => t > now - 60_000);
    if (entry.timestamps.length === 0) store.delete(ip);
  }
}, 30_000);

export function createRateLimit(options: { windowMs: number; max: number; message?: string }) {
  const { windowMs, max, message = "Zbyt wiele zapytań. Spróbuj ponownie za chwilę." } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = getIp(req);
    const result = slideWindow(`${ip}:${windowMs}:${max}`, windowMs, max);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", result.remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil((Date.now() + result.resetMs) / 1000));

    if (!result.allowed) {
      const retryAfter = Math.ceil(result.resetMs / 1000);
      res.setHeader("Retry-After", retryAfter);
      res.status(429).json({ error: message, retryAfter });
      return;
    }

    next();
  };
}

export const generalLimit = createRateLimit({
  windowMs: 60_000,
  max: 200,
  message: "Zbyt wiele zapytań. Limit: 200/min.",
});

export const riotLimit = createRateLimit({
  windowMs: 60_000,
  max: 100,
  message: "Zbyt wiele zapytań do Riot API. Limit: 100/min.",
});
