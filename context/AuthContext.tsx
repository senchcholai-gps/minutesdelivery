"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface AuthContextType {
  user: any;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
});

/**
 * Calls the server-side sync-role API which:
 *  1. Validates the JWT
 *  2. Determines role from the ADMIN_EMAILS list (server-side only)
 *  3. Upserts user_profiles with the correct role
 *
 * Returns the assigned role string, or null on failure.
 */
async function syncRoleWithServer(token: string): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/sync-role", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.role ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  /**
   * Central function that:
   * 1. Calls sync-role (auto-assigns role on the server)
   * 2. Sets isAdmin from the server response
   * Falls back to reading user_profiles directly if sync-role fails.
   */
  async function syncAndSetRole(token: string, userId: string) {
    const role = await syncRoleWithServer(token);

    if (role !== null) {
      setIsAdmin(role === "admin");
    } else {
      // Fallback: read the profile directly
      const { data } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", userId)
        .single();
      setIsAdmin(data?.role === "admin");
    }
  }

  useEffect(() => {
    // Clean up OAuth hash fragment from URL exactly once after redirect.
    if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null;
      const token = data.session?.access_token;
      setUser(sessionUser);
      if (sessionUser && token) {
        syncAndSetRole(token, sessionUser.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const sessionUser = session?.user ?? null;
      const token = session?.access_token;
      setUser(sessionUser);

      if (sessionUser && token) {
        // Always re-sync on login events so the role is fresh
        syncAndSetRole(token, sessionUser.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
