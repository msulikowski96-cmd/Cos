import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/lib/usePageTitle";
import {
  Users, Shield, Activity, Trash2, ShieldCheck, ShieldOff,
  UserCheck, UserX, RefreshCw, ChevronLeft, BarChart3,
  Search, Crown, AlertTriangle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

interface UserRow {
  id: number;
  email: string;
  displayName: string | null;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  todayUsage: { search: number; ai_analysis: number; optimizer: number };
}

interface Stats {
  total: number;
  admins: number;
  active: number;
  todaySearches: number;
  todayAi: number;
  todayOptimizer: number;
}

const DAILY_LIMITS = { search: 3, ai_analysis: 1, optimizer: 2 };

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPatch(path: string, body: object): Promise<Response> {
  return fetch(path, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function apiDelete(path: string): Promise<Response> {
  return fetch(path, { method: "DELETE", credentials: "include" });
}

export default function AdminPage() {
  usePageTitle("Panel Admina — Nexus Draft");
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) navigate("/");
  }, [loading, user]);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    setError(null);
    try {
      const [u, s] = await Promise.all([
        apiGet<UserRow[]>("/api/admin/users"),
        apiGet<Stats>("/api/admin/stats"),
      ]);
      setUsers(u);
      setStats(s);
    } catch (e: any) {
      setError(e.message ?? "Błąd ładowania danych");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const toggleAdmin = async (u: UserRow) => {
    setActionLoading(u.id);
    await apiPatch(`/api/admin/users/${u.id}`, { isAdmin: !u.isAdmin });
    await loadData();
    setActionLoading(null);
  };

  const toggleActive = async (u: UserRow) => {
    setActionLoading(u.id);
    await apiPatch(`/api/admin/users/${u.id}`, { isActive: !u.isActive });
    await loadData();
    setActionLoading(null);
  };

  const deleteUser = async (id: number) => {
    setActionLoading(id);
    await apiDelete(`/api/admin/users/${id}`);
    setConfirmDelete(null);
    await loadData();
    setActionLoading(null);
  };

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.displayName ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) return null;
  if (!user?.isAdmin) return null;

  return (
    <div className="min-h-screen" style={{ background: "#172031" }}>
      {/* Header */}
      <div className="border-b" style={{ background: "#121926", borderColor: "#233047" }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Powrót
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#d2ad62" }}>
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                PANEL ADMINISTRATORA
              </h1>
              <p className="text-[10px] text-muted-foreground">Nexus Draft</p>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={loadingData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-muted"
            style={{ border: "1px solid #233047" }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? "animate-spin" : ""}`} />
            Odśwież
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Użytkownicy", value: stats.total, icon: Users, color: "#d2ad62" },
              { label: "Aktywni", value: stats.active, icon: UserCheck, color: "#46c08a" },
              { label: "Adminowie", value: stats.admins, icon: Shield, color: "#9c7bff" },
              { label: "Wyszukiwania dziś", value: stats.todaySearches, icon: Search, color: "#d2ad62" },
              { label: "Analizy AI dziś", value: stats.todayAi, icon: BarChart3, color: "#9c7bff" },
              { label: "Optimizer dziś", value: stats.todayOptimizer, icon: Activity, color: "#e8a93c" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="rounded-xl p-4 flex flex-col gap-1"
                style={{ background: "#121926", border: "1px solid #233047", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
                </div>
                <span className="text-2xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
            style={{ background: "#2a1519", border: "1px solid #2a1519", color: "#f0545c" }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Users table */}
        <div className="rounded-xl overflow-hidden" style={{ background: "#121926", border: "1px solid #233047", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          {/* Table header */}
          <div className="px-4 py-3 flex items-center gap-3 border-b" style={{ borderColor: "#233047" }}>
            <Users className="w-4 h-4" style={{ color: "#d2ad62" }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "'Rajdhani', sans-serif", color: "#d2ad62" }}>
              Użytkownicy
            </span>
            <div className="flex-1" />
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Szukaj..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg outline-none transition-all"
                style={{ background: "#172031", border: "1px solid #233047", width: "180px" }}
              />
            </div>
          </div>

          {loadingData ? (
            <div className="p-8 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Brak użytkowników</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "1px solid #233047", background: "#172031" }}>
                    {["ID", "Użytkownik", "Status", "Użycie dziś", "Ostatnie logowanie", "Akcje"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: i < filtered.length - 1 ? "1px solid #172031" : "none",
                        background: u.isActive ? "white" : "#121926",
                        opacity: u.isActive ? 1 : 0.6,
                      }}
                    >
                      {/* ID */}
                      <td className="px-4 py-3 font-mono text-muted-foreground">#{u.id}</td>

                      {/* User info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                            style={{ background: u.isAdmin ? "#9c7bff" : "#d2ad62" }}
                          >
                            {(u.displayName ?? u.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-foreground">{u.displayName ?? "—"}</span>
                              {u.isAdmin && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                                  style={{ background: "#1f1a33", color: "#9c7bff" }}>
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="text-muted-foreground">{u.email}</div>
                            <div className="text-muted-foreground/50 text-[10px]">
                              Dołączył {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true, locale: pl })}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={u.isActive
                            ? { background: "#12271f", color: "#46c08a" }
                            : { background: "#2a1519", color: "#f0545c" }}
                        >
                          {u.isActive ? "Aktywny" : "Zablokowany"}
                        </span>
                      </td>

                      {/* Usage */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {(["search", "ai_analysis", "optimizer"] as const).map((f) => {
                            const used = u.todayUsage[f];
                            const limit = u.isAdmin ? "∞" : DAILY_LIMITS[f];
                            const pct = u.isAdmin ? 0 : Math.min((used / (DAILY_LIMITS[f] as number)) * 100, 100);
                            const label = f === "search" ? "Wyszukiwania" : f === "ai_analysis" ? "Analiza AI" : "Optimizer";
                            return (
                              <div key={f} className="flex items-center gap-2">
                                <span className="text-muted-foreground w-20 flex-shrink-0">{label}</span>
                                <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "#233047" }}>
                                  {!u.isAdmin && (
                                    <div
                                      className="h-full rounded-full transition-all"
                                      style={{
                                        width: `${pct}%`,
                                        background: pct >= 100 ? "#f0545c" : "#d2ad62",
                                      }}
                                    />
                                  )}
                                </div>
                                <span className="font-mono font-bold text-foreground/80">
                                  {used}/{limit}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Last login */}
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.lastLoginAt
                          ? formatDistanceToNow(new Date(u.lastLoginAt), { addSuffix: true, locale: pl })
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {/* Toggle admin */}
                          <button
                            onClick={() => toggleAdmin(u)}
                            disabled={actionLoading === u.id}
                            title={u.isAdmin ? "Odbierz admina" : "Nadaj admina"}
                            className="p-1.5 rounded-lg transition-all hover:scale-105 disabled:opacity-50"
                            style={u.isAdmin
                              ? { background: "#1f1a33", color: "#9c7bff" }
                              : { background: "#172031", color: "#8d97aa" }}
                          >
                            {u.isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                          </button>

                          {/* Toggle active */}
                          <button
                            onClick={() => toggleActive(u)}
                            disabled={actionLoading === u.id}
                            title={u.isActive ? "Zablokuj" : "Odblokuj"}
                            className="p-1.5 rounded-lg transition-all hover:scale-105 disabled:opacity-50"
                            style={u.isActive
                              ? { background: "#12271f", color: "#46c08a" }
                              : { background: "#2a1519", color: "#f0545c" }}
                          >
                            {u.isActive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                          </button>

                          {/* Delete */}
                          {confirmDelete === u.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => deleteUser(u.id)}
                                disabled={actionLoading === u.id}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
                                style={{ background: "#f0545c", color: "white" }}
                              >
                                Tak, usuń
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
                                style={{ background: "#172031", color: "#a8b0bf" }}
                              >
                                Anuluj
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(u.id)}
                              disabled={actionLoading === u.id}
                              title="Usuń użytkownika"
                              className="p-1.5 rounded-lg transition-all hover:scale-105 disabled:opacity-50"
                              style={{ background: "#2a1519", color: "#f0545c" }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-muted-foreground/40 pb-4">
          Nexus Draft Admin Panel · {users.length} użytkowników
        </p>
      </div>
    </div>
  );
}
