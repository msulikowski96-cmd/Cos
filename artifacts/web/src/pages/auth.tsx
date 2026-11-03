import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function AuthPage() {
  const { login, loginWithGoogle, register, user } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "register">(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "register" ? "register" : "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    setTimeout(() => setLocation("/"), 0);
  }

  async function handleGoogleLogin() {
    setError(null);
    setBusy(true);
    try {
      await loginWithGoogle();
      setLocation("/");
    } catch (err: any) {
      setError(err?.message ?? "Logowanie przez Google nie powiodło się");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, displayName.trim() || undefined);
      }
      setLocation("/");
    } catch (err: any) {
      setError(err?.message ?? "Coś poszło nie tak");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gold mb-2" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            NEXUS DRAFT
          </h1>
          <p className="text-sm text-slate-400 uppercase tracking-widest">
            {mode === "login" ? "Zaloguj się do swojego konta" : "Utwórz nowe konto"}
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-6 shadow-2xl">
          <div className="mb-5">
            <button
              id="google-firebase-login-btn"
              type="button"
              disabled={busy}
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-semibold py-2.5 px-4 rounded-lg border border-slate-700 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Zaloguj przez Google (Firebase)</span>
            </button>
          </div>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-500 uppercase">lub emailem</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide transition ${mode === "login" ? "bg-gold text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
            >Logowanie</button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide transition ${mode === "register" ? "bg-gold text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
            >Rejestracja</button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Nazwa wyświetlana (opcjonalnie)</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={60}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-gold"
                  placeholder="np. Ahri Main"
                />
              </div>
            )}
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-gold"
                placeholder="twoj@email.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Hasło</label>
              <input
                type="password"
                required
                minLength={mode === "register" ? 8 : 1}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-gold"
                placeholder={mode === "register" ? "min. 8 znaków" : "•••••••"}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
              />
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-gold hover:bg-gold/85 disabled:bg-slate-700 text-slate-950 font-bold py-2.5 rounded-lg uppercase tracking-wide transition"
            >
              {busy ? "Czekaj…" : mode === "login" ? "Zaloguj się" : "Zarejestruj się"}
            </button>
          </form>

          <div className="mt-6 text-xs text-slate-500 text-center leading-relaxed">
            Po zalogowaniu otrzymujesz dzienny limit:
            <div className="mt-1 text-slate-400">3 wyszukiwania · 1 analiza AI · 2 optymalizatory</div>
          </div>
        </div>

        <div className="mt-5 text-center">
          <Link href="/" className="text-sm text-slate-400 hover:text-gold">
            ← Wróć na stronę główną
          </Link>
        </div>
      </div>
    </div>
  );
}
