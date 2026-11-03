// Generowanie obrazków kart (satori + resvg, moduły natywne/WASM) nie działa jeszcze na Workers.
export default function satori(): never { throw new Error("Generowanie kart jest niedostępne w wersji Cloudflare"); }
export class Resvg { constructor() { throw new Error("Generowanie kart jest niedostępne w wersji Cloudflare"); } }
