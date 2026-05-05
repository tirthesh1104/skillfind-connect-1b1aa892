import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  children: ReactNode;
  allowedRoles?: AppRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // Server-side admin verification check
  const [adminCheck, setAdminCheck] = useState<"idle" | "checking" | "verified" | "unverified">("idle");

  useEffect(() => {
    let cancelled = false;
    if (role !== "admin" || !user) { setAdminCheck("idle"); return; }
    setAdminCheck("checking");
    supabase
      .from("admin_verifications")
      .select("verified_until")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const ok = data?.verified_until && new Date(data.verified_until) > new Date();
        setAdminCheck(ok ? "verified" : "unverified");
      });
    return () => { cancelled = true; };
  }, [role, user]);

  if (loading || (user && !role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    const dest = role === "admin" ? "/admin" : role === "contractor" ? "/contractor" : "/labour";
    return <Navigate to={dest} replace />;
  }

  if (role === "admin") {
    if (adminCheck === "checking" || adminCheck === "idle") {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      );
    }
    if (adminCheck === "unverified") {
      return <Navigate to="/admin/verify" replace />;
    }
  }

  return <>{children}</>;
};
