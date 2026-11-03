import { restoreTimers } from "./timers-shim";
import { httpServerHandler } from "cloudflare:node";
import app from "../artifacts/api-server/src/app";
import { requestScope, closeRequestClient } from "@workspace/db";
import { refreshDataDragon, getChampionMap } from "../artifacts/api-server/src/lib/ddragon";

restoreTimers();
app.set("trust proxy", true);
app.listen(3000);
// Lista championów z Data Dragon: w Node ładuje się przy starcie, na Workers dopiero w pierwszym żądaniu.
let ddragon: Promise<void> | null = null;
async function ensureDataDragon(): Promise<void> {
  if (Object.keys(getChampionMap()).length) return;
  ddragon ??= refreshDataDragon().finally(() => { if (!Object.keys(getChampionMap()).length) ddragon = null; });
  await Promise.race([ddragon, new Promise((r) => setTimeout(r, 4000))]);
}

const handler = httpServerHandler({ port: 3000 }) as { fetch: (r: Request, e: unknown, c: ExecutionContext) => Promise<Response> };

export default {
  async fetch(request: Request, env: unknown, ctx: ExecutionContext): Promise<Response> {
    // ffmpeg-core.wasm (32 MB, eksport wideo na /promo) przekracza limit 25 MB na plik — serwujemy z CDN.
    if (new URL(request.url).pathname.endsWith("/ffmpeg-core.wasm")) {
      return Response.redirect("https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm", 302);
    }
    // Express (trust proxy) bierze IP klienta z X-Forwarded-For — ustawiamy je z nagłówka Cloudflare,
    // żeby limity zapytań liczyły się per użytkownik, a nie wspólnie dla wszystkich.
    const ip = request.headers.get("cf-connecting-ip");
    if (ip) {
      const headers = new Headers(request.headers);
      headers.set("x-forwarded-for", ip);
      headers.set("x-forwarded-proto", "https");
      request = new Request(request, { headers });
    }
    if (new URL(request.url).pathname.startsWith("/api/")) await ensureDataDragon();
    const store = {};
    return requestScope.run(store, async () => {
      const res = await handler.fetch(request, env, ctx);
      // Odpowiedź może być jeszcze strumieniowana (trener AI), więc klienta bazy zamykamy w tle po chwili.
      ctx.waitUntil(new Promise((r) => setTimeout(r, 1000)).then(() => closeRequestClient(store)));
      return res;
    });
  },
};
