import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Section 5: Admin secret-code gate. Valid codes: 55 and 56.
const VALID_CODES = ["55", "56"];
const STORAGE_KEY = "lc_admin_verified";

export const isAdminVerified = () => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

const AdminVerify = () => {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [d1, setD1] = useState("");
  const [d2, setD2] = useState("");
  const [attempts, setAttempts] = useState(3);
  const [locked, setLocked] = useState(false);
  const [shake, setShake] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/auth", { replace: true });
    else if (role && role !== "admin") {
      navigate(role === "contractor" ? "/contractor" : "/labour", { replace: true });
    } else if (isAdminVerified()) {
      navigate("/admin", { replace: true });
    } else {
      ref1.current?.focus();
    }
  }, [user, role, loading, navigate]);

  const onChange1 = (v: string) => {
    const n = v.replace(/\D/g, "").slice(-1);
    setD1(n);
    if (n) ref2.current?.focus();
  };
  const onChange2 = (v: string) => {
    const n = v.replace(/\D/g, "").slice(-1);
    setD2(n);
  };

  const onVerify = async () => {
    if (locked) return;
    setVerifying(true);
    const code = `${d1}${d2}`;
    await new Promise((r) => setTimeout(r, 250));
    if (VALID_CODES.includes(code)) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      toast.success("Verified. Welcome, admin.");
      navigate("/admin", { replace: true });
      return;
    }
    const remaining = attempts - 1;
    setAttempts(remaining);
    setShake(true);
    setTimeout(() => setShake(false), 400);
    setD1(""); setD2("");
    ref1.current?.focus();
    setVerifying(false);
    if (remaining <= 0) {
      setLocked(true);
      toast.error("Account locked. Contact system owner.");
      await signOut();
      setTimeout(() => navigate("/auth", { replace: true }), 1500);
    } else {
      toast.error(`Wrong code. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`);
    }
  };

  if (loading) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>;
  }

  return (
    <div className="relative grid min-h-screen place-items-center p-4">
      <div className="absolute inset-0 -z-10 dot-grid opacity-30" />
      <div className="absolute left-1/2 top-1/3 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />

      <div className={`glass-panel w-full max-w-md p-8 shadow-elegant animate-fade-up ${shake ? "animate-shake" : ""}`}>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent shadow-glow">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-center font-display text-2xl font-bold">Admin verification required</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">Enter your access code to proceed</p>

        <div className="mt-8 flex justify-center gap-3">
          <input
            ref={ref1}
            value={d1}
            disabled={locked}
            onChange={(e) => onChange1(e.target.value)}
            inputMode="numeric"
            maxLength={1}
            className="h-[72px] w-16 rounded-xl border border-border bg-background text-center font-display text-3xl font-bold text-accent outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_hsl(var(--accent)/.2)]"
          />
          <input
            ref={ref2}
            value={d2}
            disabled={locked}
            onChange={(e) => onChange2(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Backspace" && !d2) ref1.current?.focus(); }}
            inputMode="numeric"
            maxLength={1}
            className="h-[72px] w-16 rounded-xl border border-border bg-background text-center font-display text-3xl font-bold text-accent outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_hsl(var(--accent)/.2)]"
          />
        </div>

        <Button
          onClick={onVerify}
          disabled={!d1 || !d2 || locked || verifying}
          className="mt-8 w-full btn-primary-amber h-11"
        >
          {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : locked ? "Locked" : "Verify"}
        </Button>

        {!locked && attempts < 3 && (
          <p className="mt-4 text-center text-xs text-destructive">{attempts} attempt{attempts === 1 ? "" : "s"} remaining</p>
        )}
        {locked && (
          <p className="mt-4 text-center text-xs text-destructive">Account locked — contact system owner.</p>
        )}
      </div>
    </div>
  );
};

export default AdminVerify;
