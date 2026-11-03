// Prosty zamiennik pino na Workers (logi idą do console, widoczne w Cloudflare → Logs).
type Fields = Record<string, unknown>;
function make(bindings: Fields = {}): any {
  const emit = (level: "debug" | "info" | "warn" | "error") => (a?: unknown, b?: unknown) => {
    const [obj, msg] = typeof a === "string" ? [{}, a] : [a ?? {}, b];
    const o = obj as any;
    if (o?.err instanceof Error) o.err = { message: o.err.message, stack: o.err.stack };
    console[level === "debug" ? "log" : level](JSON.stringify({ level, msg, ...bindings, ...o }));
  };
  return {
    level: "info",
    trace: () => {}, debug: emit("debug"), info: emit("info"), warn: emit("warn"), error: emit("error"), fatal: emit("error"),
    child: (b: Fields) => make({ ...bindings, ...b }),
  };
}
export default function pino(_opts?: unknown) { return make(); }
export { pino };
