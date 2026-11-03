export interface AuthUser {
  id: number;
  email: string;
  displayName: string | null;
  isAdmin: boolean;
}

export interface UsageInfo {
  search: { used: number; limit: number };
  ai_analysis: { used: number; limit: number };
  optimizer: { used: number; limit: number };
}

export interface MeResponse {
  user: AuthUser;
  usage: UsageInfo;
  limits: { search: number; ai_analysis: number; optimizer: number };
}

const BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api/auth${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && typeof data === "object" && "message" in data && typeof data.message === "string")
      ? data.message
      : `Błąd ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export const authApi = {
  register: (email: string, password: string, displayName?: string) =>
    call<{ user: AuthUser }>("/register", { method: "POST", body: JSON.stringify({ email, password, displayName }) }),
  login: (email: string, password: string) =>
    call<{ user: AuthUser }>("/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  /** idToken z Firebase (user.getIdToken()) — serwer sam weryfikuje go u Google. */
  loginWithFirebase: (idToken: string) =>
    call<{ user: AuthUser }>("/firebase", { method: "POST", body: JSON.stringify({ idToken }) }),
  logout: () => call<{ ok: true }>("/logout", { method: "POST" }),
  me: () => call<MeResponse>("/me"),
};
