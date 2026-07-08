import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Flag, Plus, Loader2, CheckCircle2, XCircle, Trash2 } from "lucide-react";

type Milestone = {
  id: string; job_id: string; title: string; description: string | null;
  target_date: string | null; progress_percent: number; status: string;
  client_approved: boolean; client_approved_at: string | null; client_note: string | null;
};
type Job = { id: string; title: string };

const Milestones = () => {
  const { user, role } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [items, setItems] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ job_id: "", title: "", description: "", target_date: "" });
  const [note, setNote] = useState<Record<string, string>>({});

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: jd }, { data: md }] = await Promise.all([
      supabase.from("jobs").select("id,title").eq("contractor_id", user.id),
      supabase.from("milestones" as any).select("*").order("created_at", { ascending: false }),
    ]);
    setJobs((jd as Job[]) ?? []);
    setItems(((md as any) ?? []) as Milestone[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const add = async () => {
    if (!user) return;
    if (!form.job_id || !form.title) return toast.error("Job & title required");
    setSaving(true);
    const { error } = await supabase.from("milestones" as any).insert({
      contractor_id: user.id,
      job_id: form.job_id,
      title: form.title,
      description: form.description || null,
      target_date: form.target_date || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Milestone added / टप्पा जोडला");
    setForm({ job_id: form.job_id, title: "", description: "", target_date: "" });
    load();
  };

  const updateProgress = async (m: Milestone, p: number) => {
    const status = p >= 100 ? "completed" : "in_progress";
    const { error } = await supabase.from("milestones" as any).update({ progress_percent: p, status }).eq("id", m.id);
    if (error) return toast.error(error.message);
    load();
  };

  const approve = async (m: Milestone, approved: boolean) => {
    const { error } = await supabase.from("milestones" as any).update({
      client_approved: approved,
      client_approved_at: approved ? new Date().toISOString() : null,
      client_note: note[m.id] ?? m.client_note,
    }).eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success(approved ? "Approved by client / मंजूर" : "Approval reset");
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("milestones" as any).delete().eq("id", id);
    load();
  };

  const isContractor = role === "contractor";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Flag className="h-6 w-6" /> Project Milestones</h1>
        <p className="text-sm text-muted-foreground">प्रगती व मंजुरी · Progress + Client Approval per stage</p>
      </div>

      {isContractor && (
        <Card>
          <CardHeader><CardTitle className="text-base">Add Milestone</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Select value={form.job_id} onValueChange={v => setForm({ ...form, job_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select site / जॉब" /></SelectTrigger>
              <SelectContent>{jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="date" value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })} />
            <Input placeholder="Title (Foundation done)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="md:col-span-2" />
            <Textarea placeholder="Description / तपशील" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="md:col-span-2" />
            <Button onClick={add} disabled={saving} className="md:col-span-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-1 h-4 w-4" /> Add Milestone</>}</Button>
          </CardContent>
        </Card>
      )}

      {loading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      : items.length === 0 ? <EmptyState icon={Flag} title="No milestones" description="Break projects into stages, track progress, get client approvals." />
      : (
        <div className="grid gap-3">
          {items.map(m => {
            const job = jobs.find(j => j.id === m.job_id);
            return (
              <Card key={m.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{job?.title ?? "—"} {m.target_date && `· due ${m.target_date}`}</p>
                      {m.description && <p className="text-sm mt-1">{m.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {m.client_approved
                        ? <Badge className="bg-emerald-600"><CheckCircle2 className="h-3 w-3 mr-1" />Client Approved</Badge>
                        : <Badge variant="outline">Awaiting Approval</Badge>}
                      {isContractor && <Button size="icon" variant="ghost" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span>Progress</span><span>{m.progress_percent}%</span></div>
                    <Progress value={m.progress_percent} />
                  </div>
                  {isContractor && (
                    <div className="flex flex-wrap gap-2">
                      {[25, 50, 75, 100].map(p => (
                        <Button key={p} size="sm" variant="outline" onClick={() => updateProgress(m, p)}>{p}%</Button>
                      ))}
                    </div>
                  )}
                  <div className="border-t pt-3 space-y-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Client Approval / मंजुरी</p>
                    <Textarea placeholder="Client note (optional)" value={note[m.id] ?? m.client_note ?? ""} onChange={e => setNote({ ...note, [m.id]: e.target.value })} rows={2} />
                    <div className="flex gap-2">
                      {!m.client_approved
                        ? <Button size="sm" onClick={() => approve(m, true)}><CheckCircle2 className="mr-1 h-4 w-4" /> Approve</Button>
                        : <Button size="sm" variant="outline" onClick={() => approve(m, false)}><XCircle className="mr-1 h-4 w-4" /> Un-approve</Button>}
                    </div>
                    {m.client_approved_at && <p className="text-xs text-muted-foreground">Approved on {new Date(m.client_approved_at).toLocaleString()}</p>}
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

export default Milestones;
