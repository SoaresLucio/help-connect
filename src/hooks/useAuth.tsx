import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { User, UserRole } from "@/lib/types";

const STORAGE_KEY = "helpaqui.auth.v1";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string, role: UserRole, name?: string) => Promise<User>;
  loginWithGoogle: (role: UserRole) => Promise<User>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const mockProfile = (role: UserRole, email: string, name?: string): User => {
  const display = name || email.split("@")[0].replace(/\W/g, " ");
  const niceName = display.charAt(0).toUpperCase() + display.slice(1);
  return {
    id: `${role}-${Date.now()}`,
    name: role === "company" ? (name || "Sua Empresa LTDA") : niceName,
    email,
    role,
    city: "São Paulo",
    companyName: role === "company" ? (name || "Sua Empresa LTDA") : undefined,
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  const persist = (u: User | null) => {
    setUser(u);
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const loginWithEmail = useCallback(async (email: string, _password: string, role: UserRole, name?: string) => {
    await new Promise(r => setTimeout(r, 500));
    const u = mockProfile(role, email, name);
    persist(u);
    return u;
  }, []);

  const loginWithGoogle = useCallback(async (role: UserRole) => {
    await new Promise(r => setTimeout(r, 600));
    const u = mockProfile(role, "voce@gmail.com", role === "company" ? "Sua Empresa LTDA" : "Você");
    persist(u);
    return u;
  }, []);

  const logout = useCallback(() => persist(null), []);
  const switchRole = useCallback((role: UserRole) => {
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, role };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, loading, loginWithEmail, loginWithGoogle, logout, switchRole }),
    [user, loading, loginWithEmail, loginWithGoogle, logout, switchRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
