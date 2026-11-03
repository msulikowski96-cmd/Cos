import { DDRAGON_VERSION } from "@workspace/draft-core";

/** Ikona championa z Data Dragon (wersja patcha zapisana w bazie championów Draft). */
export function iconUrl(id: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${id}.png`;
}
