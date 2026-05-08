import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type AppRole = "admin" | "contractor" | "labour";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (uid: string) => {
    const { data: rpcRole, error: rpcError } = await supabase.rpc("get_user_role", { _user_id: uid });
    if (!rpcError && rpcRole) {
      setRole(rpcRole as AppRole);
      return;
    }

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .maybeSingle();
    setRole((data?.role as AppRole | undefined) ?? null);
  };

  useEffect(() => {
    // Set up listener BEFORE getSession (auth best practice)
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setLoading(true);
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        const uid = newSession.user.id;
        // On every fresh sign-in, clear any prior admin verification so the access key must be re-entered
        if (event === "SIGNED_IN") {
          setTimeout(() => {
            supabase.from("admin_verifications").delete().eq("user_id", uid).then(() => {});
          }, 0);
        }
        // Defer Supabase calls to avoid deadlocks
        setTimeout(() => fetchRole(uid).finally(() => setLoading(false)), 0);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchRole(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  const refreshRole = async () => {
    if (user) await fetchRole(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signOut, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
