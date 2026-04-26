import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Profile, UserRole } from "@/lib/types";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: UserRole[];
  activeRole: UserRole | null;
  loading: boolean;
  signUpWithEmail: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setActiveRole: (role: UserRole) => void;
  addRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const ACTIVE_ROLE_KEY = "helpaqui.activeRole";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [activeRole, setActiveRoleState] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfileAndRoles = useCallback(async (uid: string) => {
    const [{ data: prof }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    setProfile((prof as any) ?? null);
    const r = (roleRows ?? []).map((x: any) => x.role as UserRole);
    setRoles(r);
    const stored = localStorage.getItem(ACTIVE_ROLE_KEY) as UserRole | null;
    setActiveRoleState(stored && r.includes(stored) ? stored : r[0] ?? null);
  }, []);

  useEffect(() => {
    // Listener primeiro, depois getSession (boas práticas Supabase)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // Defer chamadas Supabase
        setTimeout(() => { loadProfileAndRoles(sess.user.id); }, 0);
      } else {
        setProfile(null); setRoles([]); setActiveRoleState(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s); setUser(s?.user ?? null);
      if (s?.user) loadProfileAndRoles(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfileAndRoles]);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfileAndRoles(user.id);
  }, [user, loadProfileAndRoles]);

  const signUpWithEmail = useCallback(async (email: string, password: string, fullName: string, role: UserRole) => {
    const redirectUrl = `${window.location.origin}/app`;
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName },
      },
    });
    if (error) return { error: error.message };
    if (data.user) {
      // grava role
      await supabase.from("user_roles").insert({ user_id: data.user.id, role });
      localStorage.setItem(ACTIVE_ROLE_KEY, role);
    }
    return {};
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const redirectUrl = `${window.location.origin}/app`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl },
    });
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(ACTIVE_ROLE_KEY);
    await supabase.auth.signOut();
  }, []);

  const setActiveRole = useCallback((role: UserRole) => {
    if (!roles.includes(role)) return;
    localStorage.setItem(ACTIVE_ROLE_KEY, role);
    setActiveRoleState(role);
  }, [roles]);

  const addRole = useCallback(async (role: UserRole) => {
    if (!user) return;
    if (roles.includes(role)) { setActiveRole(role); return; }
    await supabase.from("user_roles").insert({ user_id: user.id, role });
    await refreshProfile();
    setActiveRole(role);
  }, [user, roles, refreshProfile, setActiveRole]);

  const value = useMemo<AuthContextValue>(() => ({
    session, user, profile, roles, activeRole, loading,
    signUpWithEmail, signInWithEmail, signInWithGoogle, signOut,
    refreshProfile, setActiveRole, addRole,
  }), [session, user, profile, roles, activeRole, loading, signUpWithEmail, signInWithEmail, signInWithGoogle, signOut, refreshProfile, setActiveRole, addRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
