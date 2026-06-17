import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { registerForPush } from "./notifications";

interface AuthState {
  session: Session | null;
  ready: boolean;
  /** True when Supabase auth is configured (EXPO_PUBLIC_SUPABASE_URL/_ANON_KEY). */
  enabled: boolean;
}

const AuthContext = createContext<AuthState>({ session: null, ready: false, enabled: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
      if (data.session) void registerForPush();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next) void registerForPush();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, ready, enabled: Boolean(supabase) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
