import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Users, Plus, Loader2, Trash2, Phone } from "lucide-react";

type Sub = {
  id: string; name: string; phone: string | null; scope_of_work: string | null;
  agreed_amount: number; paid_amount: number; status: string; job_id: string | null; notes: string | null;
};
type Job = { id: string; title: string };

const SubContractors = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", scope_of_work: "", agreed_amount: "", job_id: "", notes: "" });
  const [payAmt, setPayAmt] = useState<Record<string, string>>({});

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: jd }, { data: sd }] = await Promise.all([
      supabase.from("jobs").select("id,title").eq("contractor_id", user.id),
      supabase.from("sub_contractors" as any).select("*").order("created_at", { ascending: false }),
    ]);
    setJobs((jd as Job[]) ?? []);
    setSubs(((sd as any) ?? []) as Sub[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const add = async () => {
    if (!user || !form.name.trim()) return toast.error("Name required / नाव भरा");
    setSaving(true);
    const { error } = await supabase.from("sub_contractors" as any).insert({
      contractor_id: user.id,
      name: form.name,
      phone: form.phone || null,
      scope_of_work: form.scope_of_work || null,
      agreed_amount: Number(form.agreed_amount || 0),
      job_id: form.job_id || null,
      notes: form.notes || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Sub-contractor added");
    setForm({ name: "", phone: "", scope_of_work: "", agreed_amount: "", job_id: "", notes: "" });
    load();
  };

  const recordPay = async (s: Sub) => {
    const amt = Number(payAmt[s.id] || 0);
    if (!amt) return toast.error("Enter amount");
    const { error } = await supabase.from("sub_contractors" as any).update({ paid_amount: s.paid_amount + amt }).eq("id", s.id);
    if (error) return toast.error(error.message);
    setPayAmt({ ...payAmt, [s.id]: "" });
    toast.success("Payment recorded");
    load();
  };

  const setStatus = async (id: string, status: string) => {
    await supabase.from("sub_contractors" as any).update({ status }).eq("id", id);
    load();
  };
  const remove = async (id: string) => {
    await supabase.from("sub_contractors" as any).delete().eq("id", id);
    load();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Users className="h-6 w-6" /> Sub-Contractors</h1>
        <p className="text-sm text-muted-foreground">पेटी कॉन्ट्रॅक्टर व्यवस्थापन · Track scope, agreed amount, payments</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Add Sub-Contractor / जोडा</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Name / नाव" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Phone / फोन" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <Select value={form.job_id} onValueChange={v => setForm({ ...form, job_id: v })}>
            <SelectTrigger><SelectValue placeholder="Assign to job (optional)" /></SelectTrigger>
            <SelectContent>{jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="number" placeholder="Agreed amount ₹" value={form.agreed_amount} onChange={e => setForm({ ...form, agreed_amount: e.target.value })} />
          <Textarea placeholder="Scope of work / कामाचा तपशील" value={form.scope_of_work} onChange={e => setForm({ ...form, scope_of_work: e.target.value })} className="md:col-span-2" />
          <Button onClick={add} disabled={saving} className="md:col-span-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-1 h-4 w-4" /> Add</>}</Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : subs.length === 0 ? (
        <EmptyState icon={Users} title="No sub-contractors" description="Track people you sub-let work to." />
      ) : (
        <div className="grid gap-3">
          {subs.map(s => {
            const bal = s.agreed_amount - s.paid_amount;
            const job = jobs.find(j => j.id === s.job_id);
            return (
              <Card key={s.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      {s.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</p>}
                      {job && <p className="text-xs text-muted-foreground">Site: {job.title}</p>}
                      {s.scope_of_work && <p className="text-sm mt-1">{s.scope_of_work}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={s.status === "completed" ? "secondary" : "default"}>{s.status}</Badge>
                      <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div><p className="text-xs text-muted-foreground">Agreed</p><p className="font-semibold">₹{s.agreed_amount}</p></div>
                    <div><p className="text-xs text-muted-foreground">Paid</p><p className="font-semibold text-emerald-500">₹{s.paid_amount}</p></div>
                    <div><p className="text-xs text-muted-foreground">Balance</p><p className="font-semibold text-amber-500">₹{bal}</p></div>
                  </div>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Pay amount ₹" value={payAmt[s.id] ?? ""} onChange={e => setPayAmt({ ...payAmt, [s.id]: e.target.value })} className="max-w-[180px]" />
                    <Button size="sm" onClick={() => recordPay(s)}>Record Payment</Button>
                    {s.status !== "completed" && <Button size="sm" variant="outline" onClick={() => setStatus(s.id, "completed")}>Mark Done</Button>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubContractors;
