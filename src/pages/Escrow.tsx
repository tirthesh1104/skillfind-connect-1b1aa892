import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const statusVariant = (s: string) =>
  s === "released" ? "default" : s === "worker_completed" ? "secondary" : "outline";

const Escrow = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [jobs, setJobs] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [form, setForm] = useState({ job_id: "", worker_id: "", amount: "" });

  const load = async () => {
    if (!user) return;
    const { data: r } = await supabase.rpc("get_user_role", { _user_id: user.id });
    setRole(r as string);

    const { data } = await supabase.from("wage_escrow").select("*").order("created_at", { ascending: false });
    const list = data ?? [];
    setRows(list);

    const ids = Array.from(new Set(list.flatMap((e: any) => [e.worker_id, e.contractor_id])));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      setNames(Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.full_name])));
    }

    if (r === "contractor") {
      const { data: cp } = await supabase.from("contractor_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (cp) {
        const { data: js } = await supabase.from("jobs").select("id, title").eq("contractor_id", cp.id).order("created_at", { ascending: false });
        setJobs(js ?? []);
        const { data: reqs } = await supabase
          .from("requests")
          .select("labour:labour_profiles!inner(user_id, profiles:profiles!inner(full_name))")
          .eq("contractor_id", cp.id).eq("status", "accepted");
        const uniq = new Map<string, string>();
        (reqs ?? []).forEach((x: any) => uniq.set(x.labour.user_id, x.labour.profiles.full_name));
        setWorkers(Array.from(uniq, ([id, full_name]) => ({ id, full_name })));
      }
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const fund = async () => {
    const amount = parseInt(form.amount, 10);
    if (!form.worker_id || !amount || amount <= 0) return toast.error("Select worker and enter a valid amount");
    const { error } = await supabase.from("wage_escrow").insert({
      contractor_id: user!.id, worker_id: form.worker_id,
      job_id: form.job_id || null, amount, status: "held",
    });
    if (error) return toast.error(error.message);
    toast.success("Wage locked in escrow. Worker can now see it is secured.");
    setForm({ job_id: "", worker_id: "", amount: "" });
    load();
  };

  const markComplete = async (id: string) => {
    const { error } = await supabase.from("wage_escrow")
      .update({ status: "worker_completed", worker_marked_complete_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Work marked complete. Contractor will release payment.");
    load();
  };

  const release = async (id: string) => {
    const { error } = await supabase.from("wage_escrow")
      .update({ status: "released", released_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Payment released to worker.");
    load();
  };

  const heldTotal = rows.filter((r) => r.status !== "released").reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
          <Lock className="h-6 w-6 text-primary" /> Wage Escrow
        </h1>
        <p className="text-sm text-muted-foreground">
          Wages locked before work starts, released after completion. ₹{heldTotal.toLocaleString("en-IN")} currently secured.
        </p>
      </div>

      {role === "contractor" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Lock a wage in escrow</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Job (optional)</Label>
              <Select value={form.job_id} onValueChange={(v) => setForm({ ...form, job_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select job" /></SelectTrigger>
                <SelectContent>{jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Worker</Label>
              <Select value={form.worker_id} onValueChange={(v) => setForm({ ...form, worker_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
                <SelectContent>{workers.map((w) => <SelectItem key={w.id} value={w.id}>{w.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Amount (₹)</Label>
              <Input type="number" min={1} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={fund}>Lock Amount</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {rows.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No escrow records" description="Locked wages will appear here." />
      ) : (
        <div className="space-y-3">
          {rows.map((e) => (
            <div key={e.id} className="glass-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">
                  ₹{e.amount.toLocaleString("en-IN")}{" "}
                  <Badge variant={statusVariant(e.status)} className="ml-1">
                    {e.status === "held" ? "Secured" : e.status === "worker_completed" ? "Awaiting release" : "Released"}
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">
                  Worker: {names[e.worker_id] ?? "—"} · Contractor: {names[e.contractor_id] ?? "—"} · {new Date(e.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                {e.status === "held" && e.worker_id === user?.id && (
                  <Button size="sm" onClick={() => markComplete(e.id)}>Mark Work Complete</Button>
                )}
                {e.status !== "released" && e.contractor_id === user?.id && (
                  <Button size="sm" onClick={() => release(e.id)}>Release Payment</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Escrow;
