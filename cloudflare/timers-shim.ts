// Workers nie pozwalają uruchamiać timerów podczas ładowania modułu (poza obsługą żądania).
// Moduły aplikacji robią setInterval na starcie (czyszczenie limitów zapytań) — w tej fazie
// zamieniamy go na no-op; potem entry.ts przywraca prawdziwy setInterval.
const realSetInterval = globalThis.setInterval;
(globalThis as any).setInterval = () => ({ unref() {}, ref() {}, hasRef: () => false, [Symbol.toPrimitive]: () => 0 });
export function restoreTimers() { (globalThis as any).setInterval = realSetInterval; }
