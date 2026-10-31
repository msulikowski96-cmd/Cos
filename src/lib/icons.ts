import inline from "virtual:inline-icons";
import { DDRAGON_VERSION } from "./champs";

const INLINE = inline as Record<string, string>;

/** Ikona championa: z Data Dragon albo (w wersji jednoplikowej) osadzona w buildzie. */
export function iconUrl(id: string): string {
  return INLINE[id] ?? `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${id}.png`;
}
