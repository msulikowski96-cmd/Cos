import { auth, saveFavoriteToFirestore, removeFavoriteFromFirestore, getFavoritesFromFirestore } from "./firebase";

const KEY = "nexus_sight_favorites";

export type Favorite = { gameName: string; tagLine: string; region: string };

export function getFavorites(): Favorite[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

function save(favs: Favorite[]) {
  try { localStorage.setItem(KEY, JSON.stringify(favs)); } catch { /* ignore */ }
}

export function isFavorite(f: Favorite): boolean {
  return getFavorites().some(
    (e) => e.gameName.toLowerCase() === f.gameName.toLowerCase() &&
      e.tagLine.toLowerCase() === f.tagLine.toLowerCase() &&
      e.region === f.region
  );
}

export function toggleFavorite(f: Favorite): boolean {
  const current = getFavorites();
  const exists = current.some(
    (e) => e.gameName.toLowerCase() === f.gameName.toLowerCase() &&
      e.tagLine.toLowerCase() === f.tagLine.toLowerCase() &&
      e.region === f.region
  );

  const currentUser = auth.currentUser;

  if (exists) {
    const updated = current.filter(
      (e) => !(e.gameName.toLowerCase() === f.gameName.toLowerCase() &&
        e.tagLine.toLowerCase() === f.tagLine.toLowerCase() &&
        e.region === f.region)
    );
    save(updated);
    if (currentUser) {
      removeFavoriteFromFirestore(currentUser.uid, f).catch((e) =>
        console.warn("[Firebase] Failed to remove favorite from Firestore:", e)
      );
    }
    return false;
  } else {
    const updated = [f, ...current].slice(0, 20);
    save(updated);
    if (currentUser) {
      saveFavoriteToFirestore(currentUser.uid, f).catch((e) =>
        console.warn("[Firebase] Failed to save favorite to Firestore:", e)
      );
    }
    return true;
  }
}

export async function syncFavoritesFromFirestore(): Promise<Favorite[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) return getFavorites();
  try {
    const firestoreFavs = await getFavoritesFromFirestore(currentUser.uid);
    if (firestoreFavs && firestoreFavs.length > 0) {
      const local = getFavorites();
      const combined = [...firestoreFavs];
      for (const l of local) {
        if (!combined.some(c => c.gameName.toLowerCase() === l.gameName.toLowerCase() && c.region === l.region)) {
          combined.push(l);
        }
      }
      save(combined.slice(0, 20));
      return combined;
    }
  } catch (e) {
    console.warn("[Firebase] Could not sync favorites from Firestore:", e);
  }
  return getFavorites();
}
