import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Users, Wallet } from "lucide-react";

interface Worker { id: string; user_id: string; skill: string; price_per_day: number; full_name: string; }

const GangPay = () => {
  const { user } = useAuth();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [days, setDays] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Get workers who have accepted requests with this contractor
      const { data: cp } = await supabase.from("contractor_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (!cp) return;
      const { data: reqs } = await supabase.from("requests").select("labour_id").eq("contractor_id", cp.id).eq("status", "accepted");
      const labourIds = Array.from(new Set((reqs || []).map((r: any) => r.labour_id)));
      if (!labourIds.length) return;
      const { data: lps } = await supabase.from("labour_profiles").select("id, user_id, skill, price_per_day").in("id", labourIds);
      const userIds = (lps || []).map((l: any) => l.user_id);
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      const nameMap = new Map((profs || []).map((p: any) => [p.id, p.full_name]));
      setWorkers((lps || []).map((l: any) => ({ ...l, full_name: nameMap.get(l.user_id) || "Worker" })));
    })();
  }, [user]);

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const total = workers.filter((w) => selected.has(w.id)).reduce((sum, w) => sum + w.price_per_day * days, 0);

  const payAll = async () => {
    if (!user || !selected.size) return;
    setSaving(true);
    const { data: cp } = await supabase.from("contractor_profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (!cp) { setSaving(false); return; }
    const rows = workers.filter((w) => selected.has(w.id)).map((w) => ({
      labour_id: w.user_id,
      contractor_id: user.id,
      skill: w.skill,
      days_worked: days,
      daily_rate: w.price_per_day,
      amount_due: w.price_per_day * days,
      advance_paid: 0,
      status: "paid",
    }));
    const { error } = await supabase.from("labour_payments").insert(rows);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Payment recorded for ${rows.length} workers — Total ₹${total.toLocaleString()}`);
    setSelected(new Set());
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2"><Users className="h-6 w-6" /> Gang / Group Payment</h1>
        <p className="text-sm text-muted-foreground">Pay your entire crew in one click.</p>
      </div>

      <div className="glass-card space-y-4 p-6">
        <div className="max-w-xs">
          <Label>Days Worked</Label>
          <Input type="number" min={1} value={days} onChange={(e) => setDays(Math.max(1, +e.target.value))} />
        </div>

        <div className="divide-y divide-border">
          {workers.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No accepted workers yet.</p>}
          {workers.map((w) => (
            <label key={w.id} className="flex cursor-pointer items-center gap-3 py-3">
              <Checkbox checked={selected.has(w.id)} onCheckedChange={() => toggle(w.id)} />
              <div className="flex-1">
                <p className="text-sm font-medium">{w.full_name}</p>
                <p className="text-xs text-muted-foreground">{w.skill} · ₹{w.price_per_day}/day</p>
              </div>
              <p className="text-sm font-semibold">₹{(w.price_per_day * days).toLocaleString()}</p>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-xl bg-secondary p-3">
          <p className="font-semibold">Total: ₹{total.toLocaleString()}</p>
          <Button onClick={payAll} disabled={!selected.size || saving} className="bg-gradient-primary">
            <Wallet className="mr-1 h-4 w-4" /> Pay Gang ({selected.size})
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GangPay;
