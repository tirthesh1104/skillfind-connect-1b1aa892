import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { Radio, Loader2, MapPin, IndianRupee, Send, Search } from "lucide-react";
import { toast } from "sonner";

type Worker = {
  id: string; user_id: string; full_name: string; skill: string;
  location: string; price_per_day: number; expires_at: string;
};

const LabourChowk = () => {
  const { user, role } = useAuth();
  const [rows, setRows] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sending, setSending] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("worker_availability" as any)
      .select("id,user_id,full_name,skill,location,price_per_day,expires_at")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    setRows(((data as any) ?? []) as Worker[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("worker-availability-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "worker_availability" }, () => load())
      .subscribe();
    const t = setInterval(load, 60000);
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, [load]);

  const hire = async (w: Worker) => {
    if (!user) return;
    setSending(w.id);
    try {
      const [{ data: cp }, { data: lp }] = await Promise.all([
        supabase.from("contractor_profiles").select("id").eq("user_id", user.id).maybeSingle(),
        supabase.from("labour_profiles").select("id").eq("user_id", w.user_id).maybeSingle(),
      ]);
      if (!cp || !lp) throw new Error("Profile not found");
      const { error } = await supabase.from("requests").insert({
        contractor_id: cp.id,
        labour_id: lp.id,
        initiated_by: "contractor",
        message: `Instant hire from Labour Chowk — ${w.skill} at ${w.location}`,
      });
      if (error) throw error;
      await supabase.from("notifications").insert({
        user_id: w.user_id,
        title: "New hire request",
        message: `A contractor sent you an instant hire request from Labour Chowk.`,
        link: "/labour/applications",
      });
      toast.success(`Hire request sent to ${w.full_name}`);
    } catch (e: any) {
      toast.error(e.message ?? "Could not send request");
    } finally {
      setSending(null);
    }
  };

  const list = rows.filter(
    (r) =>
      !q ||
      r.full_name.toLowerCase().includes(q.toLowerCase()) ||
      r.skill.toLowerCase().includes(q.toLowerCase()) ||
      r.location.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Radio className="h-6 w-6 text-primary" /> Digital Labour Chowk
        </h1>
        <p className="text-sm text-muted-foreground">
          आज उपलब्ध कामगार · Live workers available right now (auto-expires after 4 hours)
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search skill, name or location…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : list.length === 0 ? (
        <EmptyState icon={Radio} title="No workers live right now" description="Workers appear here for 4 hours after they tap “I'm Available”." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((w) => (
            <Card key={w.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <InitialsAvatar name={w.full_name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{w.full_name}</p>
                    <Badge variant="secondary" className="shrink-0">{w.skill}</Badge>
                  </div>
                  <p className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{w.location}</span>
                    <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{w.price_per_day}/day</span>
                  </p>
                </div>
                {role === "contractor" && (
                  <Button size="sm" onClick={() => hire(w)} disabled={sending === w.id}>
                    {sending === w.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-1 h-4 w-4" /> Hire</>}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LabourChowk;
