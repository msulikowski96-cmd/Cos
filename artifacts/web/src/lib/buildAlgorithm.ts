export type ChampClass = "MARKSMAN" | "MAGE" | "ASSASSIN" | "FIGHTER" | "TANK" | "SUPPORT";
export type DamageType = "AD" | "AP" | "HYBRID";

export interface ChampProfile {
  class: ChampClass;
  damageType: DamageType;
  hasHealing?: boolean;
  isRanged?: boolean;
  tags?: string[];
}

export const CHAMP_DB: Record<string, ChampProfile> = {
  "Aatrox": { class: "FIGHTER", damageType: "AD", hasHealing: true },
  "Ahri": { class: "MAGE", damageType: "AP", tags: ["mobility", "burst"] },
  "Akali": { class: "ASSASSIN", damageType: "HYBRID", tags: ["burst", "mobility"] },
  "Akshan": { class: "MARKSMAN", damageType: "AD", isRanged: true, tags: ["mobility"] },
  "Alistar": { class: "SUPPORT", damageType: "AP", tags: ["cc", "engage"], hasHealing: true },
  "Ambessa": { class: "FIGHTER", damageType: "AD", tags: ["mobility"] },
  "Amumu": { class: "TANK", damageType: "AP", tags: ["cc", "engage"] },
  "Anivia": { class: "MAGE", damageType: "AP", tags: ["cc"] },
  "Annie": { class: "MAGE", damageType: "AP", tags: ["burst", "cc"] },
  "Aphelios": { class: "MARKSMAN", damageType: "AD", isRanged: true },
  "Ashe": { class: "MARKSMAN", damageType: "AD", isRanged: true, tags: ["cc"] },
  "AurelionSol": { class: "MAGE", damageType: "AP" },
  "Aurora": { class: "MAGE", damageType: "AP", tags: ["mobility"] },
  "Azir": { class: "MAGE", damageType: "AP", isRanged: true },
  "Bard": { class: "SUPPORT", damageType: "AP", tags: ["cc"] },
  "Belveth": { class: "MARKSMAN", damageType: "AD", tags: ["mobility"] },
  "Blitzcrank": { class: "SUPPORT", damageType: "AP", tags: ["cc", "engage"] },
  "Brand": { class: "MAGE", damageType: "AP", tags: ["poke"] },
  "Braum": { class: "SUPPORT", damageType: "AD", tags: ["cc", "engage"] },
  "Briar": { class: "FIGHTER", damageType: "AD", hasHealing: true },
  "Caitlyn": { class: "MARKSMAN", damageType: "AD", isRanged: true, tags: ["poke"] },
  "Camille": { class: "FIGHTER", damageType: "AD", tags: ["cc", "mobility"] },
  "Cassiopeia": { class: "MAGE", damageType: "AP", tags: ["poke", "cc"] },
  "Chogath": { class: "TANK", damageType: "AP", tags: ["cc"] },
  "Corki": { class: "MARKSMAN", damageType: "HYBRID", isRanged: true, tags: ["poke"] },
  "Darius": { class: "FIGHTER", damageType: "AD", hasHealing: true },
  "Diana": { class: "FIGHTER", damageType: "AP", tags: ["burst", "mobility"] },
  "DrMundo": { class: "TANK", damageType: "AD", hasHealing: true },
  "Draven": { class: "MARKSMAN", damageType: "AD", isRanged: true },
  "Ekko": { class: "ASSASSIN", damageType: "AP", tags: ["burst", "mobility"] },
  "Elise": { class: "MAGE", damageType: "AP", tags: ["burst"] },
  "Evelynn": { class: "ASSASSIN", damageType: "AP", tags: ["burst", "mobility"] },
  "Ezreal": { class: "MARKSMAN", damageType: "HYBRID", isRanged: true, tags: ["poke", "mobility"] },
  "Fiddlesticks": { class: "MAGE", damageType: "AP", tags: ["cc"] },
  "Fiora": { class: "FIGHTER", damageType: "AD", hasHealing: true, tags: ["mobility"] },
  "Fizz": { class: "ASSASSIN", damageType: "AP", tags: ["burst", "mobility"] },
  "Galio": { class: "TANK", damageType: "AP", tags: ["cc", "engage"] },
  "Gangplank": { class: "FIGHTER", damageType: "AD", tags: ["poke"] },
  "Garen": { class: "FIGHTER", damageType: "AD" },
  "Gnar": { class: "FIGHTER", damageType: "HYBRID", isRanged: true, tags: ["cc"] },
  "Gragas": { class: "FIGHTER", damageType: "AP", tags: ["cc"] },
  "Graves": { class: "MARKSMAN", damageType: "AD", isRanged: false },
  "Gwen": { class: "FIGHTER", damageType: "AP" },
  "Hecarim": { class: "FIGHTER", damageType: "AD", tags: ["mobility", "cc"] },
  "Heimerdinger": { class: "MAGE", damageType: "AP", isRanged: true, tags: ["poke"] },
  "Hwei": { class: "MAGE", damageType: "AP", tags: ["poke"] },
  "Illaoi": { class: "FIGHTER", damageType: "AD", hasHealing: true },
  "Irelia": { class: "FIGHTER", damageType: "AD", tags: ["mobility", "cc"] },
  "Janna": { class: "SUPPORT", damageType: "AP", tags: ["cc"], hasHealing: true },
  "JarvanIV": { class: "FIGHTER", damageType: "AD", tags: ["cc", "engage"] },
  "Jax": { class: "FIGHTER", damageType: "HYBRID" },
  "Jayce": { class: "FIGHTER", damageType: "AD", isRanged: true, tags: ["poke"] },
  "Jhin": { class: "MARKSMAN", damageType: "AD", isRanged: true },
  "Jinx": { class: "MARKSMAN", damageType: "AD", isRanged: true },
  "KSante": { class: "TANK", damageType: "AD", tags: ["cc"] },
  "Kaisa": { class: "MARKSMAN", damageType: "HYBRID", isRanged: true, tags: ["mobility"] },
  "Kalista": { class: "MARKSMAN", damageType: "AD", isRanged: true },
  "Karma": { class: "MAGE", damageType: "AP", isRanged: true, tags: ["poke"], hasHealing: true },
  "Karthus": { class: "MAGE", damageType: "AP" },
  "Kassadin": { class: "ASSASSIN", damageType: "AP", tags: ["burst", "mobility"] },
  "Katarina": { class: "ASSASSIN", damageType: "AP", tags: ["burst", "mobility"] },
  "Kayle": { class: "MARKSMAN", damageType: "HYBRID", isRanged: true },
  "Kayn": { class: "FIGHTER", damageType: "HYBRID", tags: ["mobility"] },
  "Kennen": { class: "MAGE", damageType: "AP", isRanged: true, tags: ["cc"] },
  "Khazix": { class: "ASSASSIN", damageType: "AD", tags: ["burst", "mobility"] },
  "Kindred": { class: "MARKSMAN", damageType: "AD", isRanged: true },
  "Kled": { class: "FIGHTER", damageType: "AD" },
  "KogMaw": { class: "MARKSMAN", damageType: "HYBRID", isRanged: true, tags: ["poke"] },
  "Leblanc": { class: "ASSASSIN", damageType: "AP", tags: ["burst", "mobility"] },
  "LeeSin": { class: "FIGHTER", damageType: "AD", tags: ["mobility"] },
  "Leona": { class: "SUPPORT", damageType: "AD", tags: ["cc", "engage"] },
  "Lillia": { class: "FIGHTER", damageType: "AP", tags: ["mobility", "cc"] },
  "Lissandra": { class: "MAGE", damageType: "AP", tags: ["cc"] },
  "Lucian": { class: "MARKSMAN", damageType: "AD", isRanged: true, tags: ["mobility"] },
  "Lulu": { class: "SUPPORT", damageType: "AP", tags: ["cc"], hasHealing: true },
  "Lux": { class: "MAGE", damageType: "AP", isRanged: true, tags: ["poke", "cc"] },
  "Malphite": { class: "TANK", damageType: "AP", tags: ["cc", "engage"] },
  "Malzahar": { class: "MAGE", damageType: "AP", tags: ["cc"] },
  "Maokai": { class: "TANK", damageType: "AP", tags: ["cc"] },
  "MasterYi": { class: "FIGHTER", damageType: "HYBRID", tags: ["mobility"], hasHealing: true },
  "MissFortune": { class: "MARKSMAN", damageType: "AD", isRanged: true, tags: ["poke"] },
  "Milio": { class: "SUPPORT", damageType: "AP", hasHealing: true },
  "Mordekaiser": { class: "FIGHTER", damageType: "AP" },
  "Morgana": { class: "MAGE", damageType: "AP", isRanged: true, tags: ["cc"] },
  "Nami": { class: "SUPPORT", damageType: "AP", tags: ["cc", "poke"], hasHealing: true },
  "Naafiri": { class: "ASSASSIN", damageType: "AD", tags: ["burst"] },
  "Nasus": { class: "FIGHTER", damageType: "AD", hasHealing: true, tags: ["cc"] },
  "Nautilus": { class: "SUPPORT", damageType: "AP", tags: ["cc", "engage"] },
  "Neeko": { class: "MAGE", damageType: "AP", isRanged: true, tags: ["cc"] },
  "Nidalee": { class: "ASSASSIN", damageType: "AP", tags: ["poke", "mobility"], isRanged: true },
  "Nilah": { class: "FIGHTER", damageType: "AD", hasHealing: true },
  "Nocturne": { class: "ASSASSIN", damageType: "AD", tags: ["mobility"] },
  "Nunu": { class: "TANK", damageType: "AP", tags: ["cc"], hasHealing: true },
  "Olaf": { class: "FIGHTER", damageType: "AD", hasHealing: true },
  "Orianna": { class: "MAGE", damageType: "AP", isRanged: true, tags: ["cc"] },
  "Ornn": { class: "TANK", damageType: "AD", tags: ["cc", "engage"] },
  "Pantheon": { class: "FIGHTER", damageType: "AD", tags: ["burst"] },
  "Poppy": { class: "TANK", damageType: "AD", tags: ["cc"] },
  "Pyke": { class: "SUPPORT", damageType: "AD", tags: ["cc", "engage"] },
  "Qiyana": { class: "ASSASSIN", damageType: "AD", tags: ["burst", "cc", "mobility"] },
  "Quinn": { class: "MARKSMAN", damageType: "AD", isRanged: true, tags: ["mobility"] },
  "Rakan": { class: "SUPPORT", damageType: "AP", tags: ["cc", "engage"] },
  "Rammus": { class: "TANK", damageType: "AD", tags: ["cc"] },
  "RekSai": { class: "FIGHTER", damageType: "AD", tags: ["mobility"] },
  "Rell": { class: "SUPPORT", damageType: "AP", tags: ["cc", "engage"] },
  "RenataGlasc": { class: "SUPPORT", damageType: "AP", tags: ["cc"], hasHealing: true },
  "Renekton": { class: "FIGHTER", damageType: "AD", hasHealing: true },
  "Rengar": { class: "ASSASSIN", damageType: "AD", tags: ["burst"] },
  "Riven": { class: "FIGHTER", damageType: "AD", tags: ["mobility", "cc"] },
  "Rumble": { class: "FIGHTER", damageType: "AP", tags: ["poke"] },
  "Ryze": { class: "MAGE", damageType: "AP", tags: ["cc"] },
  "Samira": { class: "MARKSMAN", damageType: "AD", tags: ["mobility"] },
  "Sejuani": { class: "TANK", damageType: "AP", tags: ["cc", "engage"] },
  "Senna": { class: "SUPPORT", damageType: "AD", isRanged: true, tags: ["poke"], hasHealing: true },
  "Seraphine": { class: "MAGE", damageType: "AP", isRanged: true, tags: ["poke", "cc"], hasHealing: true },
  "Sett": { class: "FIGHTER", damageType: "AD", tags: ["cc"] },
  "Shaco": { class: "ASSASSIN", damageType: "HYBRID", tags: ["mobility"] },
  "Shen": { class: "TANK", damageType: "AD", tags: ["cc"] },
  "Shyvana": { class: "FIGHTER", damageType: "HYBRID" },
  "Singed": { class: "TANK", damageType: "AP" },
  "Sion": { class: "TANK", damageType: "AD", tags: ["cc", "engage"] },
  "Sivir": { class: "MARKSMAN", damageType: "AD", isRanged: true },
  "Skarner": { class: "TANK", damageType: "AD", tags: ["cc"] },
  "Smolder": { class: "MARKSMAN", damageType: "HYBRID", isRanged: true, tags: ["poke"] },
  "Sona": { class: "SUPPORT", damageType: "AP", tags: ["cc", "poke"], hasHealing: true },
  "Soraka": { class: "SUPPORT", damageType: "AP", hasHealing: true },
  "Swain": { class: "FIGHTER", damageType: "AP", tags: ["cc"], hasHealing: true },
  "Sylas": { class: "FIGHTER", damageType: "AP", tags: ["burst"], hasHealing: true },
  "Syndra": { class: "MAGE", damageType: "AP", isRanged: true, tags: ["burst", "cc"] },
  "TahmKench": { class: "SUPPORT", damageType: "AP", hasHealing: true },
  "Taliyah": { class: "MAGE", damageType: "AP", tags: ["poke"] },
  "Talon": { class: "ASSASSIN", damageType: "AD", tags: ["burst", "mobility"] },
  "Taric": { class: "SUPPORT", damageType: "AD", tags: ["cc", "engage"], hasHealing: true },
  "Thresh": { class: "SUPPORT", damageType: "AP", tags: ["cc", "engage"] },
  "Tristana": { class: "MARKSMAN", damageType: "AD", isRanged: true, tags: ["mobility"] },
  "Trundle": { class: "FIGHTER", damageType: "AD", hasHealing: true },
  "Tryndamere": { class: "FIGHTER", damageType: "AD", hasHealing: true, tags: ["mobility"] },
  "TwistedFate": { class: "MAGE", damageType: "AP", isRanged: true, tags: ["cc"] },
  "Twitch": { class: "MARKSMAN", damageType: "AD", isRanged: true },
  "Udyr": { class: "FIGHTER", damageType: "HYBRID", tags: ["cc"], hasHealing: true },
  "Urgot": { class: "FIGHTER", damageType: "AD", tags: ["cc"] },
  "Varus": { class: "MARKSMAN", damageType: "HYBRID", isRanged: true, tags: ["poke", "cc"] },
  "Vayne": { class: "MARKSMAN", damageType: "AD", isRanged: true, tags: ["mobility"] },
  "Veigar": { class: "MAGE", damageType: "AP", isRanged: true, tags: ["burst", "cc"] },
  "Velkoz": { class: "MAGE", damageType: "AP", isRanged: true, tags: ["poke"] },
  "Vex": { class: "MAGE", damageType: "AP", tags: ["burst", "cc"] },
  "Vi": { class: "FIGHTER", damageType: "AD", tags: ["cc", "mobility"] },
  "Viego": { class: "FIGHTER", damageType: "AD", tags: ["mobility"], hasHealing: true },
  "Viktor": { class: "MAGE", damageType: "AP", isRanged: true, tags: ["poke"] },
  "Vladimir": { class: "MAGE", damageType: "AP", tags: ["sustain"], hasHealing: true },
  "Volibear": { class: "FIGHTER", damageType: "AP", tags: ["cc"] },
  "Warwick": { class: "FIGHTER", damageType: "AD", hasHealing: true },
  "Wukong": { class: "FIGHTER", damageType: "AD", tags: ["cc"] },
  "Xayah": { class: "MARKSMAN", damageType: "AD", isRanged: true },
  "Xerath": { class: "MAGE", damageType: "AP", isRanged: true, tags: ["poke"] },
  "XinZhao": { class: "FIGHTER", damageType: "AD", hasHealing: true, tags: ["cc"] },
  "Yasuo": { class: "FIGHTER", damageType: "AD", tags: ["mobility"] },
  "Yorick": { class: "FIGHTER", damageType: "AD", hasHealing: true },
  "Yone": { class: "FIGHTER", damageType: "HYBRID", tags: ["burst", "mobility"] },
  "Yuumi": { class: "SUPPORT", damageType: "AP", hasHealing: true },
  "Zac": { class: "TANK", damageType: "AP", tags: ["cc", "engage"] },
  "Zed": { class: "ASSASSIN", damageType: "AD", tags: ["burst", "mobility"] },
  "Zeri": { class: "MARKSMAN", damageType: "AD", isRanged: true, tags: ["mobility"] },
  "Ziggs": { class: "MAGE", damageType: "AP", isRanged: true, tags: ["poke"] },
  "Zilean": { class: "SUPPORT", damageType: "AP", tags: ["cc"] },
  "Zoe": { class: "MAGE", damageType: "AP", isRanged: true, tags: ["burst"] },
  "Zyra": { class: "MAGE", damageType: "AP", isRanged: true, tags: ["poke"] },
};

export interface ItemRec {
  id: number;
  name: string;
  reason?: string;
}

export interface RuneData {
  keystone: { id: number; name: string; imgPath: string; description: string };
  primaryPath: { id: number; name: string; icon: string };
  secondaryPath: { id: number; name: string; icon: string };
  primaryRunes: { name: string; imgPath: string }[];
  secondaryRunes: { name: string; imgPath: string }[];
  shards: string[];
}

export interface BuildResult {
  coreItems: ItemRec[];
  boots: ItemRec;
  situationalItems: ItemRec[];
  runes: RuneData;
  reasoning: string[];
  teamAnalysis: TeamAnalysis;
}

const DD_RUNES = "https://ddragon.leagueoflegends.com/cdn/img/perk-images";

const RUNE_KEYSTONES = {
  conqueror:        { id: 8010, name: "Zdobywca",              imgPath: `${DD_RUNES}/Styles/Precision/Conqueror/Conqueror.png`,                       description: "Zbieraj stosy w walce, zyskując %AP/%AD i leczenie" },
  pressTheAttack:   { id: 8005, name: "Nacisk Ataku",          imgPath: `${DD_RUNES}/Styles/Precision/PressTheAttack/PressTheAttack.png`,               description: "3 ataki → wróg dostaje 12% więcej obrażeń przez 6s" },
  lethalTempo:      { id: 8008, name: "Śmiertelne Tempo",      imgPath: `${DD_RUNES}/Styles/Precision/LethalTempo/LethalTempo.png`,                     description: "Atak zwiększa szybkość ataku, limit AS przekroczony" },
  fleetFootwork:    { id: 8021, name: "Zwinne Ruchy",          imgPath: `${DD_RUNES}/Styles/Precision/FleetFootwork/FleetFootwork.png`,                 description: "Naenergetyzowane ataki leczą i dają MS" },
  electrocute:      { id: 8112, name: "Elektrokuza",           imgPath: `${DD_RUNES}/Styles/Domination/Electrocute/Electrocute.png`,                    description: "3 ataki/czary → wybuch obrażeń" },
  darkHarvest:      { id: 8128, name: "Mroczne Żniwa",         imgPath: `${DD_RUNES}/Styles/Domination/DarkHarvest/DarkHarvest.png`,                   description: "Zbieraj dusze od wrogów poniżej 50% HP" },
  predator:         { id: 8120, name: "Drapieżnik",            imgPath: `${DD_RUNES}/Styles/Domination/Predator/Predator.png`,                          description: "Aktywny sprint do celu z obrażeniami" },
  hailOfBlades:     { id: 9923, name: "Grad Ostrzy",           imgPath: `${DD_RUNES}/Styles/Domination/HailOfBlades/HailOfBlades.png`,                  description: "Pierwsze 3 ataki z 110% szybkością ataku" },
  arcaneComet:      { id: 8229, name: "Arkana Kometa",         imgPath: `${DD_RUNES}/Styles/Sorcery/ArcaneComet/ArcaneComet.png`,                       description: "Trafienie czarem → komet lecący do celu" },
  phaseRush:        { id: 8214, name: "Skok Fazy",             imgPath: `${DD_RUNES}/Styles/Sorcery/PhaseRush/PhaseRush.png`,                           description: "3 ataki/czary → ogromny MS przez 4s" },
  summonAery:       { id: 8230, name: "Przywołaj Aery",        imgPath: `${DD_RUNES}/Styles/Sorcery/SummonAery/SummonAery.png`,                         description: "Ataki i czary wysyłają Aery do poranionego wroga lub sojusznika" },
  graspOfTheUndying:{ id: 8437, name: "Uchwyt Nieśmiertelności",imgPath: `${DD_RUNES}/Styles/Resolve/GraspOfTheUndying/GraspOfTheUndying.png`,          description: "Co 4s następny atak leczy, zwiększa max HP" },
  aftershock:       { id: 8439, name: "Weteran Wstrząsu",      imgPath: `${DD_RUNES}/Styles/Resolve/VeteranAftershock/VeteranAftershock.png`,            description: "Zaimmobilizuj wroga → chwilowy armor/MR i eksplozja" },
  guardian:         { id: 8465, name: "Strażnik",              imgPath: `${DD_RUNES}/Styles/Resolve/Guardian/Guardian.png`,                             description: "Chroń sojusznika → tarcza dla was obojga" },
  glacialAugment:   { id: 8351, name: "Lodowe Wspomaganie",    imgPath: `${DD_RUNES}/Styles/Inspiration/GlacialAugment/GlacialAugment.png`,             description: "Podstawowe ataki spowalniają, tworząc lodowe strefy" },
  firstStrike:      { id: 8360, name: "Pierwszy Cios",         imgPath: `${DD_RUNES}/Styles/Inspiration/FirstStrike/FirstStrike.png`,                   description: "Inicjuj walkę → złoto za obrażenia" },
};

const RUNE_PATHS = {
  precision: { id: 8000, name: "Precyzja", icon: "7201_Precision" },
  domination: { id: 8100, name: "Dominacja", icon: "7200_Domination" },
  sorcery: { id: 8200, name: "Czarnoksięstwo", icon: "7202_Sorcery" },
  inspiration: { id: 8300, name: "Inspiracja", icon: "7203_Whimsy" },
  resolve: { id: 8400, name: "Wytrwałość", icon: "7204_Resolve" },
};

const SUBRUNES: Record<string, { name: string; imgPath: string }[]> = {
  precision: [
    { name: "Triumf",               imgPath: `${DD_RUNES}/Styles/Precision/Triumph/Triumph.png` },
    { name: "Leg. Żywotność",       imgPath: `${DD_RUNES}/Styles/Precision/LegendBloodline/LegendBloodline.png` },
    { name: "Zamach",               imgPath: `${DD_RUNES}/Styles/Precision/CoupDeGrace/CoupDeGrace.png` },
  ],
  dominationSub: [
    { name: "Smak Krwi",            imgPath: `${DD_RUNES}/Styles/Domination/TasteOfBlood/GreenTerror_TasteOfBlood.png` },
    { name: "Kolekcja Gałek",       imgPath: `${DD_RUNES}/Styles/Domination/EyeballCollection/EyeballCollection.png` },
    { name: "Łowca Skarbów",        imgPath: `${DD_RUNES}/Styles/Domination/TreasureHunter/TreasureHunter.png` },
  ],
  sorcerySub: [
    { name: "Przepływ Many",        imgPath: `${DD_RUNES}/Styles/Sorcery/ManaflowBand/ManaflowBand.png` },
    { name: "Transcendencja",       imgPath: `${DD_RUNES}/Styles/Sorcery/Transcendence/Transcendence.png` },
    { name: "Zbieranie Burz",       imgPath: `${DD_RUNES}/Styles/Sorcery/GatheringStorm/GatheringStorm.png` },
  ],
  resolveSub: [
    { name: "Zbroja Kości",         imgPath: `${DD_RUNES}/Styles/Resolve/BonePlating/BonePlating.png` },
    { name: "Drugi Oddech",         imgPath: `${DD_RUNES}/Styles/Resolve/SecondWind/SecondWind.png` },
    { name: "Nieugięty",            imgPath: `${DD_RUNES}/Styles/Resolve/Unflinching/Unflinching.png` },
  ],
  inspirationSub: [
    { name: "Magiczne Obuwie",      imgPath: `${DD_RUNES}/Styles/Inspiration/MagicalFootwear/MagicalFootwear.png` },
    { name: "Kosmiczny Wgląd",      imgPath: `${DD_RUNES}/Styles/Inspiration/CosmicInsight/CosmicInsight.png` },
    { name: "Dostawa Herbatników",  imgPath: `${DD_RUNES}/Styles/Inspiration/BiscuitDelivery/BiscuitDelivery.png` },
  ],
};

export function getChampProfile(championId: string): ChampProfile {
  if (CHAMP_DB[championId]) return CHAMP_DB[championId];
  const lower = championId.toLowerCase();
  if (lower.includes("sup") || lower.includes("ard") || lower.includes("sor")) return { class: "SUPPORT", damageType: "AP" };
  return { class: "FIGHTER", damageType: "HYBRID" };
}

// Champions with suppression abilities (QSS is the only counter)
export const SUPPRESSION_CHAMPS = new Set([
  "Malzahar", "Warwick", "Skarner", "Urgot", "Mordekaiser",
]);

// Champions dealing % of current/max HP as damage
const PERCENT_HP_CHAMPS = new Set([
  "Vayne", "Fiora", "KogMaw", "Chogath", "Garen", "Darius", "Viego",
  "Belveth", "Kayle", "Gangplank",
]);

// Champions who are strong split-pushers
const SPLIT_PUSH_CHAMPS = new Set([
  "Tryndamere", "Fiora", "Jax", "Camille", "Nasus", "Yorick", "Garen",
  "Riven", "Renekton", "Irelia", "Shen",
]);

// Champions with notable shields
const SHIELD_CHAMPS = new Set([
  "Janna", "Lulu", "Karma", "Sona", "Seraphine", "Milio", "Rakan",
  "Sivir", "Taric", "Sett", "Garen",
]);

interface TeamAnalysis {
  apThreat: number;         // 0–5 weighted AP damage score
  adThreat: number;         // 0–5 weighted AD damage score
  tankCount: number;        // full tanks + 0.5 for fighters
  squishyCount: number;     // mages + marksmen + assassins
  assassinCount: number;    // dive/burst one-shot threats
  pokeCount: number;        // ranged sustained poke sources
  diverCount: number;       // fighters diving backline
  healingPresence: boolean;
  shieldPresence: boolean;
  heavyCC: boolean;         // 2+ champions with CC tag
  engageHeavy: boolean;     // 2+ champions with engage tag
  percentHPThreat: boolean; // Vayne, Fiora, Kog'Maw, etc.
  splitPushThreat: boolean; // split-push heavy enemy
  suppressionPresence: boolean; // Malzahar, Warwick, Skarner, Urgot — only QSS removes
}

function analyzeEnemyTeam(enemies: string[]): TeamAnalysis {
  let apThreat = 0, adThreat = 0, tankCount = 0, squishyCount = 0;
  let assassinCount = 0, pokeCount = 0, diverCount = 0;
  let healingPresence = false, shieldPresence = false;
  let ccCount = 0, engageCount = 0;
  let percentHPThreat = false, splitPushThreat = false, suppressionPresence = false;

  for (const e of enemies) {
    if (!e) continue;
    const p = getChampProfile(e);

    // Damage type weighting
    if (p.damageType === "AP") apThreat += 1;
    else if (p.damageType === "AD") adThreat += 1;
    else { apThreat += 0.5; adThreat += 0.5; }

    // Tankiness
    if (p.class === "TANK") tankCount += 1;
    else if (p.class === "FIGHTER") { tankCount += 0.5; diverCount += 0.5; }
    else if (p.class === "ASSASSIN") { squishyCount += 1; assassinCount += 1; }
    else if (p.class === "MAGE") { squishyCount += 1; if (p.isRanged && p.tags?.includes("poke")) pokeCount += 1; }
    else if (p.class === "MARKSMAN") { squishyCount += 1; if (p.tags?.includes("poke")) pokeCount += 0.5; }
    else if (p.class === "SUPPORT") { /* supports don't add to squishy/tank */ }

    // Specials
    if (p.hasHealing) healingPresence = true;
    if (SHIELD_CHAMPS.has(e)) shieldPresence = true;
    if (PERCENT_HP_CHAMPS.has(e)) percentHPThreat = true;
    if (SPLIT_PUSH_CHAMPS.has(e)) splitPushThreat = true;
    if (SUPPRESSION_CHAMPS.has(e)) suppressionPresence = true;
    if (p.tags?.includes("cc")) ccCount++;
    if (p.tags?.includes("engage")) engageCount++;

    // Divers: fighters/tanks who jump on backline
    if (p.tags?.includes("mobility") && (p.class === "FIGHTER" || p.class === "TANK")) diverCount += 0.5;
  }

  return {
    apThreat: Math.round(apThreat),
    adThreat: Math.round(adThreat),
    tankCount: Math.round(tankCount),
    squishyCount: Math.round(squishyCount),
    assassinCount,
    pokeCount: Math.round(pokeCount),
    diverCount: Math.round(diverCount),
    healingPresence,
    shieldPresence,
    heavyCC: ccCount >= 2,
    engageHeavy: engageCount >= 2,
    percentHPThreat,
    splitPushThreat,
    suppressionPresence,
  };
}

// ─── MARKSMAN ────────────────────────────────────────────────────────────────
function buildMarksman(ta: TeamAnalysis, profile: ChampProfile): Omit<BuildResult, "teamAnalysis"> {
  const reasoning: string[] = [];
  const coreItems: ItemRec[] = [];
  const situational: ItemRec[] = [];
  let boots: ItemRec = { id: 3006, name: "Buty Berserkera" };

  // BOOTS
  if (ta.heavyCC || ta.assassinCount >= 2) {
    boots = { id: 3111, name: "Trzewiki Merkurego" };
    reasoning.push(ta.assassinCount >= 2 ? "Dużo assassinów — Trzewiki Merkurego dla tenacity i MR." : "Wiele CC — Trzewiki Merkurego kluczowe dla przeżycia.");
  } else if (ta.engageHeavy || ta.diverCount >= 2) {
    boots = { id: 3047, name: "Płytowane Nagolenniki" };
    reasoning.push("Ciężki engage/diverzy — Nagolenniki zmniejszają obrażenia od AA o 12%.");
  } else {
    reasoning.push("Buty Berserkera — standardowy wybór, dają AS dla ADC.");
  }

  // MYTHIC / FIRST ITEM
  if (ta.tankCount >= 2) {
    coreItems.push({ id: 6672, name: "Niszczyciel Krakena", reason: "Zadaje % aktualnego HP — niezbędny vs grubych wrogów" });
    reasoning.push("2+ tanki w składzie — Niszczyciel Krakena rozbija ich punkty życia.");
    coreItems.push({ id: 3036, name: "Władanie Lorda Dominika", reason: "40% ArPen + bonus vs wysokiego HP — must vs tanki" });
  } else if (profile.tags?.includes("poke")) {
    coreItems.push({ id: 3095, name: "Opróżniacz Burz", reason: "Spowalnia i zadaje obrażenia z naładowania — dobry na otwartej przestrzeni" });
    reasoning.push("Opróżniacz Burz wzmacnia ataki AA i spowalnia cel.");
    coreItems.push({ id: 3031, name: "Ostrze Nieskończoności", reason: "Maksymalizuje critta — 2. item dla ADC crit" });
  } else {
    coreItems.push({ id: 3031, name: "Ostrze Nieskończoności", reason: "Core crit ADC — ogromne obrażenia z każdego critta" });
    reasoning.push("Infinity Edge jako 1. item — fundament buildu crit dla ADC.");
    coreItems.push({ id: 3085, name: "Huragan Runaan", reason: "Trafienia obszarowe — raises DPS w teamfightach" });
  }
  coreItems.push({ id: 3046, name: "Tancerz Widm", reason: "Tarcza przy niskim HP — chroni przed zostaniem oneshot" });

  // SITUACYJNE
  if (ta.healingPresence) {
    situational.push({ id: 3033, name: "Przypomnienie Śmiertelnika", reason: "Antyheal na trafieniu — kup 2. lub 3. vs heal comp" });
    reasoning.push("Wróg ma leczenie — Śmiertelnik jest priorytetem zaraz po core.");
  }
  if (ta.assassinCount >= 1 || ta.diverCount >= 2) {
    situational.push({ id: 3026, name: "Anioł Strażnik", reason: "Drugie życie — niezbędne gdy assassini lub diverzy cię ścigają" });
    reasoning.push("Assassini/diverzy celują w ciebie — Anioł Strażnik daje drugie życie.");
  }
  if (ta.apThreat >= 2 || ta.assassinCount >= 1) {
    situational.push({ id: 3156, name: "Paszcza Malmortusa", reason: "Tarcza vs AP burst — ratuje przed oneshot assassina AP" });
    reasoning.push("AP/assassin zagrożenie — Paszcza Malmortusa blokuje burst.");
  }
  if (ta.suppressionPresence) {
    situational.push({ id: 3139, name: "Scimitar Merkurego", reason: "JEDYNA możliwość wyjścia z supresji (Malzahar/Warwick/Skarner) — kup zaraz po bucie" });
    reasoning.push("Supresja na składzie wroga — Scimitar Merkurego to jedyna opcja, Flash nie pomoże.");
  } else if (ta.heavyCC || ta.engageHeavy) {
    situational.push({ id: 3139, name: "Scimitar Merkurego", reason: "Aktywne usuwanie CC — kluczowe gdy wróg cię zamrozi" });
    reasoning.push("Dużo CC — Scimitar aktywnie usuwa stany.");
  }
  if (ta.tankCount < 2) {
    situational.push({ id: 3094, name: "Szybkostrzał Cannona", reason: "Zwiększony zasięg AA — bezpieczne strzelanie z daleka" });
  }
  if (ta.tankCount >= 2 && !coreItems.find(i => i.id === 3036)) {
    situational.push({ id: 3036, name: "Władanie Lorda Dominika", reason: "Penetracja pancerza + bonus vs HP — wymagany vs full tank" });
  }

  const runes = buildRunesMarksman(ta, profile);
  return { coreItems, boots, situationalItems: situational, runes, reasoning };
}

function buildRunesMarksman(ta: TeamAnalysis, profile: ChampProfile): RuneData {
  const hasMobility = profile.tags?.includes("mobility");
  let keystone = RUNE_KEYSTONES.fleetFootwork;
  if (ta.tankCount >= 2) keystone = RUNE_KEYSTONES.lethalTempo;
  else if (ta.squishyCount >= 3) keystone = hasMobility ? RUNE_KEYSTONES.fleetFootwork : RUNE_KEYSTONES.pressTheAttack;
  else if (ta.engageHeavy || ta.assassinCount >= 1) keystone = RUNE_KEYSTONES.fleetFootwork;

  return {
    keystone,
    primaryPath: RUNE_PATHS.precision,
    secondaryPath: (ta.apThreat >= 2 || ta.assassinCount >= 1) ? RUNE_PATHS.resolve : RUNE_PATHS.domination,
    primaryRunes: SUBRUNES.precision,
    secondaryRunes: (ta.apThreat >= 2 || ta.assassinCount >= 1) ? SUBRUNES.resolveSub.slice(0, 2) : SUBRUNES.dominationSub.slice(0, 2),
    shards: ["Szybkość Ataku", "AD Adaptacyjne", "HP"],
  };
}

// ─── MAGE ─────────────────────────────────────────────────────────────────────
function buildMage(ta: TeamAnalysis, profile: ChampProfile): Omit<BuildResult, "teamAnalysis"> {
  const reasoning: string[] = [];
  const coreItems: ItemRec[] = [];
  const situational: ItemRec[] = [];
  const isPoke = profile.tags?.includes("poke");
  const isBurst = profile.tags?.includes("burst");
  let boots: ItemRec = { id: 3020, name: "Buty Czarnoksiężnika" };

  // BOOTS
  if (ta.heavyCC || ta.assassinCount >= 1) {
    boots = { id: 3111, name: "Trzewiki Merkurego" };
    reasoning.push(ta.assassinCount >= 1 ? "Assassin w składzie — Trzewiki Merkurego dla tenacity i MR." : "Wiele CC — Trzewiki Merkurego kluczowe dla maga.");
  } else if (ta.adThreat >= 3 && ta.assassinCount === 0) {
    boots = { id: 3158, name: "Buty Lucidity" };
    reasoning.push("Mało burst-threat — Buty Lucidity dla CDR i częstszych czarów.");
  } else {
    reasoning.push("Buty Czarnoksiężnika — standardowy wybór, dają penetrację magiczną.");
  }

  // CORE
  if (ta.tankCount >= 2) {
    coreItems.push({ id: 6653, name: "Udręka Liandry", reason: "Obrażenia % max HP — niszczy tanki z dużym HP" });
    coreItems.push({ id: 3135, name: "Laska Próżni", reason: "40% penetracji magicznej — obowiązkowa vs tanki z MR" });
    reasoning.push("2+ tanki — Udręka Liandry + Laska Próżni to najlepszy anty-tank core dla maga.");
    coreItems.push({ id: 3089, name: "Czapka Rabadona", reason: "35% bonus AP — skaluje wszystkie obrażenia" });
  } else if (isBurst) {
    coreItems.push({ id: 4645, name: "Shadowflame", reason: "Flat AP + penetracja — eksploduje squishies" });
    coreItems.push({ id: 3089, name: "Czapka Rabadona", reason: "Mnoży AP o 35% — obowiązkowy 2. item" });
    coreItems.push({ id: 3135, name: "Laska Próżni", reason: "Penetracja magiczna — gdy wróg zbiera MR" });
    reasoning.push("Burst mage: Shadowflame → Rabadon → Laska Próżni — maksymalny oneshot.");
  } else if (isPoke) {
    coreItems.push({ id: 3285, name: "Towarzyszy Ludena", reason: "Eksplodujący pocisk co czar — idealny do poke" });
    coreItems.push({ id: 4645, name: "Shadowflame", reason: "Wzmacnia każdy czar flat AP" });
    coreItems.push({ id: 3089, name: "Czapka Rabadona", reason: "Mnoży AP — 3. item priorytet" });
    reasoning.push("Poke mage: Luden → Shadowflame → Rabadon — obrażenia z dystansu.");
  } else {
    coreItems.push({ id: 4645, name: "Shadowflame", reason: "Core większości magów — AP + MagPen" });
    coreItems.push({ id: 3089, name: "Czapka Rabadona", reason: "35% bonus AP — obowiązkowy zawsze" });
    coreItems.push({ id: 3135, name: "Laska Próżni", reason: "40% penetracji magicznej — vs MR" });
    reasoning.push("Standard mage: Shadowflame → Rabadon → Laska Próżni.");
  }

  // SITUACYJNE
  if (ta.suppressionPresence) {
    situational.push({ id: 3139, name: "Scimitar Merkurego", reason: "Jedyna ucieczka z supresji (Malzahar/Warwick/Skarner) — priorytet nad wszystkim" });
    reasoning.push("Supresja w składzie wroga — Scimitar to jedyna opcja, Zhonya nie pomoże.");
  }
  if (ta.assassinCount >= 1 || ta.adThreat >= 3) {
    situational.push({ id: 3157, name: "Klepsydra Zhonya", reason: "Aktywna nietykalność — ratuje przed assassinem/AD" });
    reasoning.push("Assassin/AD — Klepsydra Zhonya jest absolutnie konieczna.");
  }
  if (ta.pokeCount >= 2 || ta.apThreat >= 2) {
    situational.push({ id: 3102, name: "Zasłona Banshee", reason: "Blokuje jeden czar — vs CC lub poke AP" });
    reasoning.push("Dużo AP/poke — Zasłona Banshee absorbuje jeden cios.");
  }
  if (ta.healingPresence) {
    situational.push({ id: 3165, name: "Morellonomikon", reason: "Antyheal 40% — kup wcześnie vs heal comp" });
    reasoning.push("Leczenie u wrogów — Morellonomikon jako 2. item zamiast sytuacyjnego.");
  }
  if (ta.shieldPresence) {
    reasoning.push("Wróg ma tarcze — Shadowflame je przebija dodatkową penetracją.");
  }
  if (!(ta.assassinCount >= 1 || ta.adThreat >= 3)) {
    situational.push({ id: 3157, name: "Klepsydra Zhonya", reason: "Nietykalność po engage lub dla survivalu" });
  }

  const runes = buildRunesMage(ta, profile);
  return { coreItems, boots, situationalItems: situational, runes, reasoning };
}

function buildRunesMage(ta: TeamAnalysis, profile: ChampProfile): RuneData {
  const isPoke = profile.tags?.includes("poke");
  const isBurst = profile.tags?.includes("burst");
  let keystone = isPoke ? RUNE_KEYSTONES.arcaneComet : RUNE_KEYSTONES.electrocute;
  if (ta.tankCount >= 3) keystone = RUNE_KEYSTONES.arcaneComet;
  else if (isBurst && ta.assassinCount === 0) keystone = RUNE_KEYSTONES.electrocute;

  const primary = isPoke ? RUNE_PATHS.sorcery : RUNE_PATHS.domination;
  return {
    keystone,
    primaryPath: primary,
    secondaryPath: (ta.assassinCount >= 1 || ta.adThreat >= 2) ? RUNE_PATHS.resolve : RUNE_PATHS.sorcery,
    primaryRunes: isPoke ? SUBRUNES.sorcerySub : SUBRUNES.dominationSub,
    secondaryRunes: (ta.assassinCount >= 1 || ta.adThreat >= 2) ? SUBRUNES.resolveSub.slice(0, 2) : SUBRUNES.sorcerySub.slice(0, 2),
    shards: ["AP Adaptacyjne", "AP Adaptacyjne", ta.assassinCount >= 1 ? "Armor" : "HP"],
  };
}

// ─── ASSASSIN ────────────────────────────────────────────────────────────────
function buildAssassin(ta: TeamAnalysis, profile: ChampProfile): Omit<BuildResult, "teamAnalysis"> {
  const reasoning: string[] = [];
  const coreItems: ItemRec[] = [];
  const situational: ItemRec[] = [];
  const isAP = profile.damageType === "AP";
  let boots: ItemRec = isAP ? { id: 3020, name: "Buty Czarnoksiężnika" } : { id: 3158, name: "Buty Lucidity" };

  // BOOTS
  if (ta.heavyCC) {
    boots = { id: 3111, name: "Trzewiki Merkurego" };
    reasoning.push("Dużo CC — Trzewiki Merkurego kluczowe żeby nie zostawać przypiętym po wskoku.");
  } else {
    reasoning.push(isAP ? "Buty Czarnoksiężnika — MagPen dla każdego czaru." : "Buty Lucidity — CDR by częściej używać czarów do burstu.");
    boots = isAP ? { id: 3020, name: "Buty Czarnoksiężnika" } : { id: 3158, name: "Buty Lucidity" };
  }

  // CORE
  if (isAP) {
    coreItems.push({ id: 4645, name: "Shadowflame", reason: "Flat AP + MagPen — eksploduje squishies i przebija tarcze" });
    coreItems.push({ id: 3089, name: "Czapka Rabadona", reason: "Mnoży AP o 35% — 2. item priorytet" });
    coreItems.push({ id: 3157, name: "Klepsydra Zhonya", reason: "Nietykalność po wskoku — czas na cooldown" });
    reasoning.push("AP Assassin: Shadowflame → Rabadon → Zhonya — maksymalny burst + bezpieczeństwo po engage.");
  } else {
    // AD assassin
    if (ta.shieldPresence) {
      coreItems.push({ id: 6693, name: "Kieł Węża", reason: "Redukuje tarcze o 60% — obowiązkowy gdy enemy ma shields" });
      reasoning.push("Wróg ma tarcze — Kieł Węża robi je prawie bezużytecznymi.");
    }
    coreItems.push({ id: 6691, name: "Ostrze Nocy", reason: "Burst + pasywna tarcza vs czarów po wskoku w cel" });
    if (ta.tankCount >= 2) {
      coreItems.push({ id: 6694, name: "Żal Seryldy", reason: "ArPen + spowolnienie — pozwala gonić i bić tanki" });
      reasoning.push("Tanki w składzie — Żal Seryldy daje ArPen i spowalnia cel.");
    } else {
      coreItems.push({ id: 3814, name: "Krawędź Nocy", reason: "Blokuje jeden czar — tarcza vs mage/poke" });
    }
    coreItems.push({ id: 3142, name: "Widmo Jowisza", reason: "Lethality + MS — przyspieszenie do celu" });
    reasoning.push("AD Assassin: Ostrze Nocy → " + (ta.tankCount >= 2 ? "Żal Seryldy" : "Krawędź Nocy") + " → Widmo Jowisza.");
  }

  // SITUACYJNE
  if (ta.suppressionPresence) {
    situational.push({ id: 3139, name: "Scimitar Merkurego", reason: "Jedyna ucieczka z supresji przed wskoczeniem na cel — priorytet" });
    reasoning.push("Supresja — Scimitar pozwala wyjść z supresji i kontynuować burst.");
  }
  if (ta.tankCount >= 2 && isAP) {
    situational.push({ id: 3135, name: "Laska Próżni", reason: "40% MagPen — niezbędna gdy tanki zbierają MR" });
    reasoning.push("Tanki z MR — Laska Próżni obowiązkowa.");
  }
  if (ta.healingPresence) {
    const ahId = isAP ? 3165 : 6693;
    const ahName = isAP ? "Morellonomikon" : "Kieł Węża";
    situational.push({ id: ahId, name: ahName, reason: "Antyheal — ogranicza leczenie celu" });
    reasoning.push("Leczenie u wrogów — antyheal jako priorytet sytuacyjny.");
  }
  situational.push({ id: 3026, name: "Anioł Strażnik", reason: "Drugie życie — gdy jedziesz ahead i wpadasz w teamfight" });
  if (!isAP && !ta.shieldPresence) {
    situational.push({ id: 6693, name: "Kieł Węża", reason: "Antyheal + redukuje tarcze — elastyczny pick" });
  }

  const runes = buildRunesAssassin(ta, profile);
  return { coreItems, boots, situationalItems: situational, runes, reasoning };
}

function buildRunesAssassin(ta: TeamAnalysis, profile: ChampProfile): RuneData {
  const isAP = profile.damageType === "AP";
  const preferDH = ta.squishyCount >= 3;
  const keystone = preferDH ? RUNE_KEYSTONES.darkHarvest : RUNE_KEYSTONES.electrocute;

  return {
    keystone,
    primaryPath: RUNE_PATHS.domination,
    secondaryPath: ta.heavyCC ? RUNE_PATHS.resolve : (isAP ? RUNE_PATHS.sorcery : RUNE_PATHS.precision),
    primaryRunes: SUBRUNES.dominationSub,
    secondaryRunes: ta.heavyCC ? SUBRUNES.resolveSub.slice(0, 2) : (isAP ? SUBRUNES.sorcerySub.slice(0, 2) : SUBRUNES.precision.slice(0, 2)),
    shards: [isAP ? "AP Adaptacyjne" : "AD Adaptacyjne", isAP ? "AP Adaptacyjne" : "AD Adaptacyjne", ta.heavyCC ? "Armor" : "HP"],
  };
}

// ─── FIGHTER ─────────────────────────────────────────────────────────────────
function buildFighter(ta: TeamAnalysis, profile: ChampProfile): Omit<BuildResult, "teamAnalysis"> {
  const reasoning: string[] = [];
  const coreItems: ItemRec[] = [];
  const situational: ItemRec[] = [];
  const isAP = profile.damageType === "AP";
  const hasMobility = profile.tags?.includes("mobility");
  const hasBurst = profile.tags?.includes("burst");
  let boots: ItemRec = { id: 3047, name: "Płytowane Nagolenniki" };

  // BOOTS
  if (ta.heavyCC || (ta.apThreat >= 2 && ta.assassinCount >= 1)) {
    boots = { id: 3111, name: "Trzewiki Merkurego" };
    reasoning.push(ta.heavyCC ? "Dużo CC — Trzewiki Merkurego dla tenacity." : "AP + assassini — Trzewiki Merkurego dla MR i tenacity.");
  } else if (isAP) {
    boots = { id: 3020, name: "Buty Czarnoksiężnika" };
    reasoning.push("AP fighter — Buty Czarnoksiężnika dla penetracji magicznej.");
  } else if (ta.apThreat >= 3) {
    boots = { id: 3111, name: "Trzewiki Merkurego" };
    reasoning.push("Dużo AP — Trzewiki Merkurego dla MR i tenacity.");
  } else {
    reasoning.push("Płytowane Nagolenniki vs AD — zmniejszają obrażenia AA o 12%.");
  }

  // CORE
  if (isAP) {
    if (hasBurst || hasMobility) {
      coreItems.push({ id: 3100, name: "Kamień Lichów", reason: "Proc AA po czarze — ogromne obrażenia dla AP melee fightera" });
      coreItems.push({ id: 3115, name: "Zęby Naszora", reason: "AS + AP + on-hit — skaluje się z AA i czarami" });
    } else {
      coreItems.push({ id: 6653, name: "Udręka Liandry", reason: "Obrażenia % HP — świetna gdy wróg tankuje lub zbiera HP" });
      coreItems.push({ id: 4637, name: "Demoniczne Objęcie", reason: "Twardość + AP — idealne dla AP tanka/fightera" });
    }
    coreItems.push({ id: 3157, name: "Klepsydra Zhonya", reason: "Aktywna nietykalność — kluczowa po wejściu w melee" });
    reasoning.push("AP Fighter: " + (hasBurst ? "Kamień Lichów + Zęby Naszora" : "Udręka Liandry + Demoniczne Objęcie") + " + Zhonya.");
  } else {
    if (ta.tankCount >= 2) {
      coreItems.push({ id: 3071, name: "Topór Czerni", reason: "Redukuje pancerz 6x — konieczny vs 2+ tanki" });
      coreItems.push({ id: 3153, name: "Ostrze Króla Ruin", reason: "% aktualnego HP — najlepszy vs grube cele" });
      reasoning.push("Dużo tanków — Topór Czerni (stackowany ArPen) + BORK (% HP) to core.");
    } else if (hasMobility && hasBurst) {
      coreItems.push({ id: 6333, name: "Taniec Śmierci", reason: "Opóźnia obrażenia + leczy — core przeżywalność" });
      coreItems.push({ id: 3053, name: "Wzmocnienie Steraka", reason: "Tarcza przy niskim HP — 2. linia obrony" });
      reasoning.push("Skirmisher/mobilny: Taniec Śmierci + Tarcza Steraka — wchodzisz i wychodzisz z walki.");
    } else {
      coreItems.push({ id: 3078, name: "Trójca Sił", reason: "Proc po każdym czarze — świetna dla fighterów z niskim CD" });
      coreItems.push({ id: 6333, name: "Taniec Śmierci", reason: "Opóźnia obrażenia + leczy — niezbędne" });
      reasoning.push("Standard bruiser: Trójca Sił + Taniec Śmierci — duże obrażenia i przeżywalność.");
    }
    if (!coreItems.find(i => i.id === 3053)) {
      coreItems.push({ id: 3053, name: "Wzmocnienie Steraka", reason: "Tarcza przy niskim HP — chroni przed oneshot" });
    }
  }

  // SITUACYJNE
  if (ta.suppressionPresence) {
    situational.push({ id: 3139, name: "Scimitar Merkurego", reason: "JEDYNA ucieczka z supresji (Malzahar/Warwick/Skarner) — kup zaraz po bucie" });
    reasoning.push("Supresja w składzie wroga — Scimitar Merkurego to jedyna możliwość wyjścia z supresji.");
  }
  if (ta.apThreat >= 2) {
    situational.push({ id: 4401, name: "Siła Natury", reason: "Ogromny MR wzrost w walce — priorytet vs AP" });
    situational.push({ id: 3065, name: "Wisiorek Ducha", reason: "MR + wzmacnia leczenie/tarcze" });
    reasoning.push("AP zagrożenie — Siła Natury lub Wisiorek Ducha dla MR.");
  }
  if (ta.healingPresence && !isAP) {
    situational.push({ id: 3123, name: "Miecz Chempunka", reason: "Grievous Wounds 60% na trafieniu — blokuje leczenie Aatrox/Sylas/itp" });
    situational.push({ id: 3076, name: "Kolec Brambletu", reason: "Antyheal przez AA — tańsza opcja vs heal comp" });
    reasoning.push("Leczenie u wrogów — Miecz Chempunka (full item) lub Kolec Brambletu (wczesna rush).");
  }
  if (ta.percentHPThreat) {
    situational.push({ id: 3143, name: "Omen Randuina", reason: "Spowalnia AS + active — vs % HP damage (Vayne, Fiora)" });
    reasoning.push("Wróg ma % HP damage — Randuin spowalnia ich AS.");
  }
  if (ta.assassinCount >= 1) {
    situational.push({ id: 3026, name: "Anioł Strażnik", reason: "Drugie życie — vs assassinów targeting ciebie" });
  }
  if (ta.splitPushThreat && !hasMobility) {
    situational.push({ id: 3071, name: "Topór Czerni", reason: "Szybsza rotacja i siła 1v1 — vs split-pusher" });
    reasoning.push("Wróg może splitować — Topór Czerni poprawia siłę 1v1.");
  }

  const runes = buildRunesFighter(ta, profile);
  return { coreItems, boots, situationalItems: situational, runes, reasoning };
}

function buildRunesFighter(ta: TeamAnalysis, profile: ChampProfile): RuneData {
  const isAP = profile.damageType === "AP";
  const hasCC = profile.tags?.includes("cc");
  let keystone = RUNE_KEYSTONES.conqueror;
  if (ta.tankCount === 0 && ta.squishyCount >= 3 && !hasCC) keystone = RUNE_KEYSTONES.pressTheAttack;

  return {
    keystone,
    primaryPath: RUNE_PATHS.precision,
    secondaryPath: ta.apThreat >= 2 ? RUNE_PATHS.resolve : RUNE_PATHS.domination,
    primaryRunes: SUBRUNES.precision,
    secondaryRunes: ta.apThreat >= 2 ? SUBRUNES.resolveSub.slice(0, 2) : SUBRUNES.dominationSub.slice(0, 2),
    shards: [isAP ? "AP Adaptacyjne" : "AD Adaptacyjne", isAP ? "AP Adaptacyjne" : "AD Adaptacyjne", "HP"],
  };
}

// ─── TANK ─────────────────────────────────────────────────────────────────────
function buildTank(ta: TeamAnalysis, profile: ChampProfile): Omit<BuildResult, "teamAnalysis"> {
  const reasoning: string[] = [];
  const coreItems: ItemRec[] = [];
  const situational: ItemRec[] = [];
  let boots: ItemRec = { id: 3047, name: "Płytowane Nagolenniki" };

  // BOOTS
  if (ta.apThreat >= 3 || ta.heavyCC) {
    boots = { id: 3111, name: "Trzewiki Merkurego" };
    reasoning.push(ta.apThreat >= 3 ? "Dużo AP — Trzewiki Merkurego dla MR i tenacity." : "Wiele CC — Trzewiki Merkurego dla tenacity (ważne dla engage tanka).");
  } else {
    reasoning.push("Płytowane Nagolenniki vs AD — zmniejszają obrażenia AA o 12%.");
  }

  // CORE (reaguje na skład wroga)
  if (ta.adThreat >= 3 && ta.apThreat <= 1) {
    coreItems.push({ id: 3068, name: "Egida Słoneczna", reason: "Pancerz + obrażenia obszarowe — core vs full AD" });
    coreItems.push({ id: 3075, name: "Cierniowa Zbroja", reason: "Antyheal + odbicia od AA — must vs ADC/healer" });
    coreItems.push({ id: 3181, name: "Serce ze Stali", reason: "HP skalujące z atakami — wysoki HP w late" });
    reasoning.push("Full AD skład — Egida + Cierniowa Zbroja blokują ADC i leczenie.");
  } else if (ta.apThreat >= 3 && ta.adThreat <= 1) {
    coreItems.push({ id: 4401, name: "Siła Natury", reason: "Ogromny MR rosnący w czasie — vs full AP" });
    coreItems.push({ id: 3001, name: "Maska Otchłani", reason: "MR + wzmacnia obrażenia AP sojuszników" });
    coreItems.push({ id: 3068, name: "Egida Słoneczna", reason: "Pancerz jako podstawa — tank potrzebuje obu statsów" });
    reasoning.push("Full AP skład — Siła Natury + Maska Otchłani dają gigantyczne MR.");
  } else {
    coreItems.push({ id: 3181, name: "Serce ze Stali", reason: "HP skalujące z atakami — fundament każdego tanka" });
    coreItems.push({ id: 3068, name: "Egida Słoneczna", reason: "Pancerz + obrażenia obszarowe — wszechstronny" });
    coreItems.push({ id: 3193, name: "Kamień Gargulca", reason: "Aktywna redukcja obrażeń 60% — kluczowe przy engage" });
    reasoning.push("Mieszany skład — Serce ze Stali + Egida + Gargulec to solidny core.");
  }

  // SITUACYJNE
  if (ta.healingPresence && !coreItems.find(i => i.id === 3075)) {
    situational.push({ id: 3075, name: "Cierniowa Zbroja", reason: "Antyheal przez AA + obrażenia zwrotne" });
    reasoning.push("Leczenie u wrogów — Cierniowa Zbroja redukuje je przez AA.");
  }
  if (ta.percentHPThreat) {
    situational.push({ id: 3143, name: "Omen Randuina", reason: "Spowolnienie AS + redukcja crit — vs Vayne/Fiora/Kog" });
    situational.push({ id: 3110, name: "Zmrożone Serce", reason: "Pancerz + CDR + spowalnia AS atakujących cię wrogów" });
    reasoning.push("Wróg ma % HP damage (Vayne/Fiora/Kog) — Randuin lub Frozen Heart zamiast czystego HP.");
  }
  if (ta.apThreat >= 2 && !coreItems.find(i => i.id === 4401)) {
    situational.push({ id: 4401, name: "Siła Natury", reason: "MR rosnący w czasie walki — vs AP" });
  }
  situational.push({ id: 3083, name: "Zbroja Warmoga", reason: "Ogromny HP + regeneracja — finisher na max HP" });
  if (!ta.percentHPThreat) {
    situational.push({ id: 3143, name: "Omen Randuina", reason: "Active spowalnia AS wrogów — vs kryty i ADC" });
  }

  const runes = buildRunesTank(ta, profile);
  return { coreItems, boots, situationalItems: situational, runes, reasoning };
}

function buildRunesTank(ta: TeamAnalysis, profile: ChampProfile): RuneData {
  const isEngage = profile.tags?.includes("engage");
  const hasCC = profile.tags?.includes("cc");
  let keystone = RUNE_KEYSTONES.graspOfTheUndying;
  if (isEngage || hasCC) keystone = RUNE_KEYSTONES.aftershock;

  return {
    keystone,
    primaryPath: RUNE_PATHS.resolve,
    secondaryPath: ta.adThreat >= 3 ? RUNE_PATHS.precision : (ta.apThreat >= 3 ? RUNE_PATHS.sorcery : RUNE_PATHS.inspiration),
    primaryRunes: SUBRUNES.resolveSub,
    secondaryRunes: ta.adThreat >= 3 ? SUBRUNES.precision.slice(0, 2) : SUBRUNES.inspirationSub.slice(0, 2),
    shards: ["HP", ta.adThreat >= ta.apThreat ? "Armor" : "MR Magiczne", "HP"],
  };
}

// ─── SUPPORT ──────────────────────────────────────────────────────────────────
function buildSupport(ta: TeamAnalysis, profile: ChampProfile): Omit<BuildResult, "teamAnalysis"> {
  const reasoning: string[] = [];
  const coreItems: ItemRec[] = [];
  const situational: ItemRec[] = [];
  const isEngage = profile.tags?.includes("engage");
  const isEnchanter = profile.hasHealing || ["Janna", "Lulu", "Nami", "Soraka", "Sona", "Yuumi", "Milio", "Karma"].includes(profile as unknown as string);
  const isPoke = profile.tags?.includes("poke");
  let boots: ItemRec = { id: 3158, name: "Buty Lucidity" };

  // BOOTS
  if (ta.heavyCC && isEngage) {
    boots = { id: 3111, name: "Trzewiki Merkurego" };
    reasoning.push("Dużo CC i engage support — Trzewiki Merkurego dla tenacity.");
  } else if (ta.adThreat >= 3 && isEngage) {
    boots = { id: 3047, name: "Płytowane Nagolenniki" };
    reasoning.push("Full AD — Nagolenniki dla engage tanka/supporta.");
  } else {
    reasoning.push("Buty Lucidity — CDR skraca cooldowny czarów supporta.");
  }

  // CORE
  if (isEngage) {
    coreItems.push({ id: 3190, name: "Amulet Żelaznego Słońca", reason: "Tarcza obszarowa dla całej drużyny przy engage" });
    coreItems.push({ id: 3109, name: "Przysięga Rycerza", reason: "Przekierowanie obrażeń do ciebie — chroni carry" });
    coreItems.push({ id: 2065, name: "Pieśń Shurelyi", reason: "Sprint dla drużyny — przyspiesza engage lub ucieczkę" });
    reasoning.push("Engage support: Amulet + Przysięga + Shurelya — chroni drużynę i inicjuje walki.");
  } else if (isEnchanter) {
    if (ta.adThreat >= 2) {
      coreItems.push({ id: 3504, name: "Kadzielnica Ardenta", reason: "Wzmacnia AS ADC gdy go leczysz/tarczujesz" });
      coreItems.push({ id: 3850, name: "Kij Wody Spływającej", reason: "AP dla sojuszników — wzmacnia maga" });
      reasoning.push("AD carries w drużynie — Ardent Censer + Staff of Flowing Water wzmacniają carries.");
    } else {
      coreItems.push({ id: 3107, name: "Odkupienie", reason: "Leczenie obszarowe przez ścianę — ratuje teamfight" });
      coreItems.push({ id: 3190, name: "Amulet Żelaznego Słońca", reason: "Tarcza obszarowa — wzmacnia każdego sojusznika" });
      reasoning.push("Enchanter: Odkupienie + Amulet — leczenie i tarcze przez walki.");
    }
    coreItems.push({ id: 3504, name: "Kadzielnica Ardenta", reason: "Kluczowa enchanter item — wzmacnia atakujących sojuszników" });
  } else {
    coreItems.push({ id: 3190, name: "Amulet Żelaznego Słońca", reason: "Tarcza obszarowa — wszechstronny support item" });
    coreItems.push({ id: 2065, name: "Pieśń Shurelyi", reason: "Sprint dla drużyny — engage lub dezengagement" });
    coreItems.push({ id: 3107, name: "Odkupienie", reason: "Leczenie obszarowe — ratuje teamfight zza ściany" });
    reasoning.push("Mage/poke support: Amulet + Shurelya + Odkupienie — kontrola i leczenie.");
  }

  // SITUACYJNE
  if (ta.healingPresence) {
    situational.push({ id: 4010, name: "Miotacz Chemtech", reason: "Antyheal w czarach — vs heal comp priorytet" });
    reasoning.push("Leczenie u wrogów — Miotacz Chemtech jest najlepszym supportowym antyheałem.");
  }
  if (ta.heavyCC || ta.assassinCount >= 1) {
    situational.push({ id: 3222, name: "Błogosławieństwo Mikaela", reason: "Aktywne usuwanie CC z sojusznika — ratuje carry" });
    reasoning.push("Dużo CC/assassini — Mikael czyści CC z carry w kluczowym momencie.");
  }
  situational.push({ id: 3050, name: "Zbieżność Zeke", reason: "Wzmacnia sojusznika przy kontakcie — vs burst comp" });
  if (!ta.healingPresence) {
    situational.push({ id: 3107, name: "Odkupienie", reason: "Leczenie przez ścianę — wszechstronny enchanter item" });
  }

  const runes = buildRunesSupport(ta, profile);
  return { coreItems, boots, situationalItems: situational, runes, reasoning };
}

function buildRunesSupport(ta: TeamAnalysis, profile: ChampProfile): RuneData {
  const isEngage = profile.tags?.includes("engage");
  const isPoke = profile.tags?.includes("poke");
  const hasHealing = profile.hasHealing;
  let keystone = RUNE_KEYSTONES.summonAery;
  if (isEngage) keystone = RUNE_KEYSTONES.aftershock;
  else if (ta.tankCount >= 3) keystone = RUNE_KEYSTONES.guardian;
  else if (isPoke && !hasHealing) keystone = RUNE_KEYSTONES.arcaneComet;

  const primary = isEngage ? RUNE_PATHS.resolve : RUNE_PATHS.sorcery;
  return {
    keystone,
    primaryPath: primary,
    secondaryPath: ta.assassinCount >= 1 ? RUNE_PATHS.resolve : RUNE_PATHS.inspiration,
    primaryRunes: isEngage ? SUBRUNES.resolveSub : SUBRUNES.sorcerySub,
    secondaryRunes: ta.assassinCount >= 1 ? SUBRUNES.resolveSub.slice(0, 2) : SUBRUNES.inspirationSub.slice(0, 2),
    shards: ["AP Adaptacyjne", "CDR", ta.adThreat >= 2 ? "Armor" : "HP"],
  };
}

export type Lane = "AUTO" | "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT";

function getLaneOverrideClass(lane: Lane, profile: ChampProfile): ChampClass {
  switch (lane) {
    case "TOP":
      if (profile.class === "SUPPORT") return "TANK";
      if (profile.class === "MARKSMAN") return "FIGHTER";
      return profile.class;
    case "JUNGLE":
      if (profile.class === "SUPPORT") return "FIGHTER";
      return profile.class;
    case "MID":
      return profile.class;
    case "ADC":
      return "MARKSMAN";
    case "SUPPORT":
      return "SUPPORT";
    default:
      return profile.class;
  }
}

export function calculateBuild(myChampionId: string, enemies: string[], lane: Lane = "AUTO"): BuildResult {
  const profile = getChampProfile(myChampionId);
  const ta = analyzeEnemyTeam(enemies);
  const effectiveClass = lane === "AUTO" ? profile.class : getLaneOverrideClass(lane, profile);

  let partial: Omit<BuildResult, "teamAnalysis">;
  switch (effectiveClass) {
    case "MARKSMAN": partial = buildMarksman(ta, profile); break;
    case "MAGE": partial = buildMage(ta, profile); break;
    case "ASSASSIN": partial = buildAssassin(ta, profile); break;
    case "FIGHTER": partial = buildFighter(ta, profile); break;
    case "TANK": partial = buildTank(ta, profile); break;
    case "SUPPORT": partial = buildSupport(ta, profile); break;
    default: partial = buildFighter(ta, profile);
  }

  return { ...partial, teamAnalysis: ta };
}

export const CLASS_LABEL: Record<ChampClass, string> = {
  MARKSMAN: "Strzelec",
  MAGE: "Mag",
  ASSASSIN: "Assassin",
  FIGHTER: "Wojownik",
  TANK: "Tank",
  SUPPORT: "Support",
};
