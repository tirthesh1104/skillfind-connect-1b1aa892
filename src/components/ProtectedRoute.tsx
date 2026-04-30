import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { isAdminVerified } from "@/pages/AdminVerify";

interface Props {
  children: ReactNode;
  allowedRoles?: AppRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
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

  // Admin code-gate: must verify per session before reaching admin pages
  if (role === "admin" && !isAdminVerified()) {
    return <Navigate to="/admin/verify" replace />;
  }

  return <>{children}</>;
};
