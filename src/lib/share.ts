import { CHAMP_BY_ID } from "./champs";
import { emptyDraft, type Draft, type Slot } from "./analysis";

// Format: #d-Aatrox-LeeSin-Ahri-Jinx-Thresh-<5 czerwonych>-<5 banów niebieskich>-<5 banów czerwonych>
// "0" oznacza pusty slot. Same litery, cyfry i myślniki — działa w każdym linku.
const order = (d: Draft) => [...d.blue, ...d.red, ...d.blueBans, ...d.redBans];

export function encodeDraft(d: Draft): string {
  return "d-" + order(d).map((s) => s ?? "0").join("-");
}

export function decodeDraft(hash: string): Draft | null {
  const h = hash.replace(/^#/, "");
  if (!h.startsWith("d-")) return null;
  const parts = h.slice(2).split("-");
  if (parts.length !== 20) return null;
  const slots: Slot[] = parts.map((p) => (CHAMP_BY_ID[p] ? p : null));
  const d = emptyDraft();
  d.blue = slots.slice(0, 5);
  d.red = slots.slice(5, 10);
  d.blueBans = slots.slice(10, 15);
  d.redBans = slots.slice(15, 20);
  return d;
}
