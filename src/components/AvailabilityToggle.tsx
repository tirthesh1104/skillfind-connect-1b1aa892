import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

type Row = { id: string; expires_at: string; skill: string; location: string };

const fmtLeft = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
};

export const AvailabilityToggle = () => {
  const { user } = useAuth();
  const [row, setRow] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("worker_availability" as any)
      .select("id,expires_at,skill,location")
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    setRow((data as any) ?? null);
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const goLive = async () => {
    if (!user) return;
    setBusy(true);
    const [{ data: prof }, { data: lp }] = await Promise.all([
      supabase.from("profiles").select("full_name,phone,location").eq("id", user.id).maybeSingle(),
      supabase.from("labour_profiles").select("skill,price_per_day").eq("user_id", user.id).maybeSingle(),
    ]);
    await supabase.from("worker_availability" as any).delete().eq("user_id", user.id);
    const { error } = await supabase.from("worker_availability" as any).insert({
      user_id: user.id,
      full_name: prof?.full_name ?? "Worker",
      skill: lp?.skill ?? "General",
      location: prof?.location || "—",
      phone: prof?.phone ?? null,
      price_per_day: lp?.price_per_day ?? 0,
      expires_at: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    } as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("तुम्ही आता उपलब्ध आहात! · You are live for 4 hours");
    load();
  };

  const stop = async () => {
    if (!user) return;
    setBusy(true);
    await supabase.from("worker_availability" as any).delete().eq("user_id", user.id);
    setBusy(false);
    setRow(null);
    toast.success("Availability turned off");
  };

  return (
    <Card className={row ? "border-primary/50" : undefined}>
      <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className={`rounded-xl p-2 ${row ? "bg-primary/15" : "bg-secondary"}`}>
            <Radio className={`h-5 w-5 ${row ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
          </div>
          <div>
            <p className="font-semibold">Digital Labour Chowk</p>
            <p className="text-sm text-muted-foreground">
              {row
                ? `तुम्ही live आहात · ${row.skill} · ${row.location}`
                : "मी उपलब्ध आहे दाबा — contractors तुम्हाला 4 तास live बघतील"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {row && <Badge variant="secondary">{fmtLeft(row.expires_at)} left</Badge>}
          {row ? (
            <>
              <Button variant="outline" size="sm" onClick={goLive} disabled={busy}>Extend 4h</Button>
              <Button variant="ghost" size="sm" onClick={stop} disabled={busy}>
                <XCircle className="mr-1 h-4 w-4" /> Stop
              </Button>
            </>
          ) : (
            <Button onClick={goLive} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Radio className="mr-2 h-4 w-4" />}
              I'm Available
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
