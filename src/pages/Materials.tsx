import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Package, Plus, Loader2, Trash2 } from "lucide-react";

type Material = {
  id: string; job_id: string; name: string; unit: string;
  quantity: number; used: number; cost_per_unit: number;
  supplier: string | null; notes: string | null;
};
type Job = { id: string; title: string };

const Materials = () => {
  const { user, role } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    job_id: "", name: "", unit: "bags", quantity: "", used: "0",
    cost_per_unit: "", supplier: "",
  });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: jd }, { data: md }] = await Promise.all([
      supabase.from("jobs").select("id,title").eq("contractor_id", user.id).order("created_at", { ascending: false }),
      supabase.from("materials" as any).select("*").order("created_at", { ascending: false }),
    ]);
    setJobs((jd as Job[]) ?? []);
    setItems(((md as any) ?? []) as Material[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const add = async () => {
    if (!user) return;
    if (!form.job_id || !form.name || !form.quantity) return toast.error("Fill job, name & quantity / जॉब, नाव व संख्या भरा");
    setSaving(true);
    const { error } = await supabase.from("materials" as any).insert({
      contractor_id: user.id,
      job_id: form.job_id,
      name: form.name,
      unit: form.unit,
      quantity: Number(form.quantity),
      used: Number(form.used || 0),
      cost_per_unit: Number(form.cost_per_unit || 0),
      supplier: form.supplier || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Material added / साहित्य जोडले");
    setForm({ job_id: form.job_id, name: "", unit: "bags", quantity: "", used: "0", cost_per_unit: "", supplier: "" });
    load();
  };

  const bumpUsed = async (m: Material, delta: number) => {
    const newUsed = Math.max(0, Math.min(m.quantity, m.used + delta));
    const { error } = await supabase.from("materials" as any).update({ used: newUsed }).eq("id", m.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("materials" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const isContractor = role === "contractor";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Package className="h-6 w-6" /> Material & Tool Tracker</h1>
        <p className="text-sm text-muted-foreground">साहित्य व साधने ट्रॅक करा · Track cement, steel, tools per site</p>
      </div>

      {isContractor && (
        <Card>
          <CardHeader><CardTitle className="text-base">Add Material / साहित्य जोडा</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Select value={form.job_id} onValueChange={(v) => setForm({ ...form, job_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select site / जॉब निवडा" /></SelectTrigger>
              <SelectContent>{jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Material name / नाव (Cement)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Unit (bags/kg/nos)" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
            <Input type="number" placeholder="Quantity / एकूण" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
            <Input type="number" placeholder="Used / वापर" value={form.used} onChange={e => setForm({ ...form, used: e.target.value })} />
            <Input type="number" placeholder="Cost/unit ₹" value={form.cost_per_unit} onChange={e => setForm({ ...form, cost_per_unit: e.target.value })} />
            <Input placeholder="Supplier / पुरवठादार" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} className="md:col-span-2" />
            <Button onClick={add} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-1 h-4 w-4" /> Add</>}</Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={Package} title="No materials yet" description="Add cement, steel, tools & track usage per site." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map(m => {
            const pct = m.quantity ? Math.round((m.used / m.quantity) * 100) : 0;
            const job = jobs.find(j => j.id === m.job_id);
            return (
              <Card key={m.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{job?.title ?? "—"} · {m.supplier || "no supplier"}</p>
                    </div>
                    {isContractor && (
                      <Button size="icon" variant="ghost" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4" /></Button>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Used: <b>{m.used}</b> / {m.quantity} {m.unit}</span>
                    <span className="text-muted-foreground">₹{(m.quantity * m.cost_per_unit).toFixed(0)}</span>
                  </div>
                  <Progress value={pct} />
                  {isContractor && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => bumpUsed(m, -1)}>-1</Button>
                      <Button size="sm" variant="outline" onClick={() => bumpUsed(m, 1)}>+1</Button>
                      <Button size="sm" variant="outline" onClick={() => bumpUsed(m, 10)}>+10</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Materials;
