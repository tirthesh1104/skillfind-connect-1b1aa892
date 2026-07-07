import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileSignature, Plus, CheckCircle2, Loader2 } from "lucide-react";

type Order = {
  id: string;
  contractor_id: string;
  worker_id: string;
  description: string;
  duration_days: number;
  amount: number;
  start_date: string | null;
  status: string;
  contractor_signed_at: string | null;
  worker_signed_at: string | null;
  created_at: string;
};

const WorkOrders = () => {
  const { user, role } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [workers, setWorkers] = useState<{ id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ worker_id: "", description: "", duration_days: "7", amount: "", start_date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const col = role === "contractor" ? "contractor_id" : "worker_id";
    const { data } = await supabase.from("work_orders" as any).select("*").eq(col, user.id).order("created_at", { ascending: false });
    setOrders((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (role === "contractor" && user) {
      supabase.from("labour_profiles").select("user_id, profiles:user_id(full_name)").limit(100).then(({ data }) => {
        setWorkers((data ?? []).map((r: any) => ({ id: r.user_id, full_name: r.profiles?.full_name ?? "Worker" })));
      });
    }
  }, [user, role]);

  const create = async () => {
    if (!user || !form.worker_id || !form.description.trim() || !form.amount) {
      toast.error("Fill all fields");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("work_orders" as any).insert({
      contractor_id: user.id,
      worker_id: form.worker_id,
      description: form.description.trim(),
      duration_days: parseInt(form.duration_days) || 1,
      amount: parseFloat(form.amount),
      start_date: form.start_date,
      status: "sent",
      contractor_signed_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    await supabase.from("notifications").insert({
      user_id: form.worker_id,
      title: "📝 New Work Order",
      message: `${form.description.trim()} — ₹${form.amount}`,
      type: "system" as const,
    });
    toast.success("Work order sent");
    setForm({ ...form, description: "", amount: "" });
    load();
  };

  const sign = async (o: Order) => {
    const { error } = await supabase.from("work_orders" as any).update({
      worker_signed_at: new Date().toISOString(),
      status: "signed",
    }).eq("id", o.id);
    if (error) return toast.error(error.message);
    toast.success("Work order signed ✓");
    load();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <FileSignature className="h-7 w-7 text-primary" /> Work Orders / कार्य आदेश
        </h1>
        <p className="text-sm text-muted-foreground">Digital work orders — both parties sign before work starts</p>
      </div>

      {role === "contractor" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Create Work Order</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Select value={form.worker_id} onValueChange={(v) => setForm({ ...form, worker_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
              <SelectContent>
                {workers.map(w => <SelectItem key={w.id} value={w.id}>{w.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <Input type="number" placeholder="Duration (days)" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} />
            <Input type="number" placeholder="Total amount ₹" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Textarea className="md:col-span-2" placeholder="Work description & scope" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} />
            <Button onClick={create} disabled={saving} className="md:col-span-2 bg-gradient-primary">
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
              Send Work Order
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Work Orders</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p>
            : orders.length === 0 ? <p className="text-sm text-muted-foreground">No work orders yet.</p>
            : orders.map(o => (
              <div key={o.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm">{o.description}</p>
                  <Badge variant={o.status === "signed" ? "default" : "secondary"}>{o.status}</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                  <div>Start: {o.start_date ?? "—"}</div>
                  <div>Duration: {o.duration_days} days</div>
                  <div>Amount: <span className="font-semibold text-foreground">₹{o.amount}</span></div>
                  <div>Created: {new Date(o.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex flex-wrap gap-3 text-xs pt-2 border-t">
                  <span className={o.contractor_signed_at ? "text-green-600" : "text-muted-foreground"}>
                    {o.contractor_signed_at ? "✓" : "○"} Contractor signed
                  </span>
                  <span className={o.worker_signed_at ? "text-green-600" : "text-muted-foreground"}>
                    {o.worker_signed_at ? "✓" : "○"} Worker signed
                  </span>
                </div>
                {role === "labour" && !o.worker_signed_at && (
                  <Button size="sm" onClick={() => sign(o)} className="bg-gradient-primary">
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Accept & Sign
                  </Button>
                )}
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkOrders;
