import { Link, useLocation } from "wouter";
import { Swords, Users, Wrench, Shield, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { href: "/", label: "Gracze", Icon: Users, match: (p: string) => p === "/" || /^\/(profile|champion|match|live|ai-analysis)\//.test(p) },
  { href: "/draft", label: "Draft", Icon: Swords, match: (p: string) => p.startsWith("/draft") },
  { href: "/optymalizator", label: "Build", Icon: Wrench, match: (p: string) => p.startsWith("/optymalizator") },
];

/** Główny pasek aplikacji: logo, zakładki i logowanie — w stylu Nexus Draft. */
export default function AuthHeader() {
  const { user, usage, logout, loading } = useAuth();
  const [location, setLocation] = useLocation();

  if (location.startsWith("/auth")) return null;

  return (
    <header
      className="sticky z-40 w-full border-b border-line bg-ink/90 backdrop-blur"
      style={{ top: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="gutter mx-auto flex max-w-7xl items-center gap-2 py-2 sm:gap-4">
        <Link href="/" className="shrink-0 font-display text-xl font-extrabold uppercase leading-none tracking-wide">
          Nexus <span className="text-gold">Draft</span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto sm:ml-2" aria-label="Główne">
          {NAV.map(({ href, label, Icon, match }) => {
            const active = match(location);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 font-label text-xs font-bold uppercase tracking-wider transition-colors sm:px-3 ${
                  active ? "bg-gold-soft text-gold" : "text-subtle hover:text-text"
                }`}
              >
                <Icon size={14} aria-hidden />
                <span className={active ? "" : "hidden min-[420px]:inline"}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {!loading && !user && (
          <Link href="/auth" className="btn btn-gold shrink-0 !px-3 !py-1.5 !text-xs">
            Zaloguj się
          </Link>
        )}

        {user && (
          <div className="flex shrink-0 items-center gap-2 text-xs">
            {user.isAdmin ? (
              <Link href="/admin" className="flex items-center gap-1 rounded-md bg-gold-soft px-2 py-1.5 font-label font-bold uppercase tracking-wider text-gold" title="Panel admina">
                <Shield size={14} aria-hidden />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            ) : (
              usage && (
                <span className="hidden font-label font-semibold text-subtle md:inline num">
                  AI {usage.ai_analysis.used}/{usage.ai_analysis.limit} · Trener {usage.optimizer.used}/{usage.optimizer.limit}
                </span>
              )
            )}
            <span className="hidden max-w-[12ch] truncate text-subtle lg:inline">{user.displayName ?? user.email}</span>
            <button
              onClick={async () => {
                await logout();
                setLocation("/auth");
              }}
              className="btn !px-2.5 !py-1.5 !text-xs"
              aria-label="Wyloguj"
            >
              <LogOut size={14} aria-hidden />
              <span className="hidden sm:inline">Wyloguj</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
