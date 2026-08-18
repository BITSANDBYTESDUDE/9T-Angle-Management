"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { get, post } from "@/lib/api";
import type { User } from "@/lib/types";

type AuthContextValue = { user: User | null; loading: boolean; login: (email: string, password: string) => Promise<void>; logout: () => Promise<void>; refresh: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);
const publicPaths = ["/login", "/forgot-password", "/reset-password"];
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(true); const router = useRouter(); const pathname = usePathname();
  const refresh = useCallback(async () => { try { const response = await get<User>("/auth/me"); setUser(response.data); } catch { setUser(null); } finally { setLoading(false); } }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { if (!loading && !user && !publicPaths.some((path) => pathname.startsWith(path))) router.replace(`/login?next=${encodeURIComponent(pathname)}`); }, [loading, user, pathname, router]);
  const login = useCallback(async (email: string, password: string) => { const response = await post<{ user: User }>("/auth/login", { email, password }); setUser(response.data.user); router.replace("/dashboard"); router.refresh(); }, [router]);
  const logout = useCallback(async () => { try { await post("/auth/logout"); } finally { setUser(null); router.replace("/login"); router.refresh(); } }, [router]);
  const value = useMemo(() => ({ user, loading, login, logout, refresh }), [user, loading, login, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("useAuth must be used within AuthProvider"); return value; }
