import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/auth", { replace: true });
    else if (role === "admin") navigate("/admin", { replace: true });
    else if (role === "contractor") navigate("/contractor", { replace: true });
    else if (role === "labour") navigate("/labour", { replace: true });
  }, [user, role, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  );
};

export default Index;
