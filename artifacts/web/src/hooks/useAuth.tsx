import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { authApi, type AuthUser, type UsageInfo } from "@/lib/auth-api";
import {
  auth as firebaseAuth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  syncUserDoc,
  onAuthStateChanged,
  type FirebaseUser,
} from "@/lib/firebase";

interface AuthContextValue {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  usage: UsageInfo | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me.user);
      setUsage(me.usage);
    } catch {
      setUser(null);
      setUsage(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        try {
          await syncUserDoc(fUser);
          // Konta email/hasło logują się przez /login; tu łączymy tylko konta z potwierdzonym emailem (np. Google).
          if (fUser.email && fUser.emailVerified) {
            const res = await authApi.loginWithFirebase(await fUser.getIdToken());
            setUser(res.user);
            await refresh();
          }
        } catch (e) {
          console.warn("[Firebase] syncUserDoc/loginWithFirebase error:", e);
        }
      }
    });

    void (async () => {
      await refresh();
      setLoading(false);
    })();

    return () => unsubscribe();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setUser(res.user);
    try {
      const fbCred = await signInWithEmailAndPassword(firebaseAuth, email, password);
      if (fbCred.user) {
        setFirebaseUser(fbCred.user);
        await syncUserDoc(fbCred.user);
      }
    } catch (fbErr) {
      console.debug("[Firebase] Optional Email signIn info:", fbErr);
    }
    await refresh();
  }, [refresh]);

  const loginWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(firebaseAuth, googleProvider);
    if (cred.user) {
      setFirebaseUser(cred.user);
      await syncUserDoc(cred.user);
      const res = await authApi.loginWithFirebase(await cred.user.getIdToken());
      setUser(res.user);
      await refresh();
    }
  }, [refresh]);

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    const res = await authApi.register(email, password, displayName);
    setUser(res.user);
    try {
      const fbCred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      if (fbCred.user) {
        if (displayName) {
          await updateProfile(fbCred.user, { displayName });
        }
        setFirebaseUser(fbCred.user);
        await syncUserDoc(fbCred.user);
      }
    } catch (fbErr) {
      console.debug("[Firebase] Optional Email createUser info:", fbErr);
    }
    await refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(firebaseAuth);
    } catch {}
    try {
      await authApi.logout();
    } catch {}
    setUser(null);
    setFirebaseUser(null);
    setUsage(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        usage,
        loading,
        refresh,
        login,
        loginWithGoogle,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
