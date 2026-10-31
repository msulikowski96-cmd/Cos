// Pobiera aktualną listę championów z Data Dragon i zapisuje ją do src/data/champions.generated.ts.
// Uruchom po nowym patchu: npm run sync:champions
import { writeFileSync } from "node:fs";

const versions = await (await fetch("https://ddragon.leagueoflegends.com/api/versions.json")).json();
const version = versions[0];
const data = (await (await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/pl_PL/champion.json`)).json()).data;

const list = Object.values(data)
  .map((c) => ({ id: c.id, name: c.name, tags: c.tags, range: c.stats.attackrange, magic: c.info.magic, attack: c.info.attack }))
  .sort((a, b) => a.name.localeCompare(b.name, "pl"));

const out = `// Plik generowany przez scripts/sync-champions.mjs — nie edytuj ręcznie.
export const DDRAGON_VERSION = ${JSON.stringify(version)};

export interface RawChampion {
  id: string;
  name: string;
  tags: string[];
  range: number;
  magic: number;
  attack: number;
}

export const RAW_CHAMPIONS: RawChampion[] = ${JSON.stringify(list, null, 0).replace(/\},\{/g, "},\n  {")};
`;
writeFileSync(new URL("../src/data/champions.generated.ts", import.meta.url), out);
console.log(`Zapisano ${list.length} championów (patch ${version}).`);
