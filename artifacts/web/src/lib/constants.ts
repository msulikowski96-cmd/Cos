let _ddVersion = "14.24.1";

export function setDDVersion(v: string) { _ddVersion = v; }
export function getDDVersion() { return _ddVersion; }
export function getDDBase() { return `https://ddragon.leagueoflegends.com/cdn/${_ddVersion}/img`; }

export const DD = "https://ddragon.leagueoflegends.com/cdn/14.24.1/img";
export const FALLBACK_ICON = `${DD}/profileicon/29.png`;

export function champIconUrl(championName: string) {
  return `${getDDBase()}/champion/${championName}.png`;
}
export function itemIconUrl(itemId: number) {
  return `${getDDBase()}/item/${itemId}.png`;
}
export function profileIconUrl(iconId: number) {
  return `${getDDBase()}/profileicon/${iconId}.png`;
}

export const SPELL_IMG: Record<number, string> = {
  1: "SummonerBoost", 3: "SummonerExhaust", 4: "SummonerFlash",
  6: "SummonerHaste", 7: "SummonerHeal", 11: "SummonerSmite",
  12: "SummonerTeleport", 13: "SummonerMana", 14: "SummonerDot",
  21: "SummonerBarrier", 32: "SummonerSnowball", 55: "SummonerPoroRecall",
  39: "SummonerSnowURFSnowball_Mark", 2: "SummonerOldRecall",
};

export const RUNE_STYLE_ICON: Record<number, string> = {
  8000: "7201_Precision", 8100: "7200_Domination",
  8200: "7202_Sorcery", 8300: "7203_Whimsy", 8400: "7204_Resolve",
};

export const TIER_COLOR: Record<string, string> = {
  CHALLENGER: "#6b4f22", GRANDMASTER: "#E84057", MASTER: "#9D5FDB",
  DIAMOND: "#576BCE", EMERALD: "#2AD8A4", PLATINUM: "#22A6B3",
  GOLD: "#C8AA6E", SILVER: "#A0A8BC", BRONZE: "#8D6845", IRON: "#6B6B6B",
};

export const TIER_LABEL: Record<string, string> = {
  CHALLENGER: "Challenger", GRANDMASTER: "Grandmaster", MASTER: "Master",
  DIAMOND: "Diament", EMERALD: "Szmaragd", PLATINUM: "Platyna",
  GOLD: "Złoto", SILVER: "Srebro", BRONZE: "Brąz", IRON: "Żelazo",
};
