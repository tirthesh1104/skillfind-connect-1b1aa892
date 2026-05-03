import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

const AdminVerify = () => {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [key, setKey] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth", { replace: true }); return; }
    if (role && role !== "admin") {
      navigate(role === "contractor" ? "/contractor" : "/labour", { replace: true });
      return;
    }
    // If already verified server-side, skip
    supabase.from("admin_verifications").select("verified_until").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.verified_until && new Date(data.verified_until) > new Date()) {
          navigate("/admin", { replace: true });
        }
      });
  }, [user, role, loading, navigate]);

  const onVerify = async () => {
    setVerifying(true);
    const { data, error } = await supabase.functions.invoke("verify-admin-key", {
      body: { key: key.trim() },
    });
    setVerifying(false);

    if (error || !data?.ok) {
      setShake(true); setTimeout(() => setShake(false), 400);
      setKey("");
      toast.error("Invalid Key");
      return;
    }
    toast.success("Access granted");
    navigate("/admin", { replace: true });
  };

  if (loading) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="relative grid min-h-screen place-items-center p-4">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <div className="absolute inset-0 -z-10 bg-gradient-mesh opacity-60" />

      <div className={`glass-panel w-full max-w-lg p-10 shadow-elegant animate-fade-in ${shake ? "animate-shake" : ""}`}>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-center text-3xl font-bold">Admin Access Key</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Enter your admin access key to unlock the dashboard.
        </p>

        <div className="mt-8">
          <Input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Paste or type your access key"
            className="h-12 text-center tracking-widest"
            onKeyDown={(e) => { if (e.key === "Enter") onVerify(); }}
            autoFocus
          />
        </div>

        <Button onClick={onVerify} disabled={!key || verifying} className="mt-6 w-full h-11">
          {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlock Dashboard"}
        </Button>

        <button
          onClick={async () => { await signOut(); navigate("/auth", { replace: true }); }}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel & sign out
        </button>
      </div>
    </div>
  );
};

export default AdminVerify;
