import { existsSync } from "node:fs";
import app from "./app";
import { riotEnabled } from "./riot";
import { aiEnabled } from "./ai";

// Lokalnie: wczytaj .env, jeśli istnieje (na hostingu zmienne ustawia panel).
// Klucze są czytane dopiero przy zapytaniu, więc kolejność importów nie ma znaczenia.
if (existsSync(".env")) process.loadEnvFile(".env");

const port = Number(process.env.PORT ?? 8787);
app.listen(port, "0.0.0.0", () => {
  console.log(`Nexus Draft: http://localhost:${port} · Riot API: ${riotEnabled() ? "tak" : "brak klucza"} · AI: ${aiEnabled() ? "tak" : "brak klucza"}`);
});
