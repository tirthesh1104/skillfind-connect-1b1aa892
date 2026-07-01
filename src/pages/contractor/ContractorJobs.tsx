import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { SKILL_OPTIONS } from "@/lib/labour";
import { Briefcase, Plus, Pencil, X, ShieldCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { SKILL_CATEGORIES, checkWage } from "@/lib/wageCompliance";

interface Job {
  id: string; title: string; work_type: string; required_skill: string;
  location: string; price_offered: number; status: "open" | "closed"; description: string | null;
}

const ContractorJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractorId, setContractorId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const empty = { title: "", work_type: "", required_skill: "Plumber", location: "", price_offered: 0, description: "", status: "open" as const, skill_category: "Unskilled", state: "Maharashtra" };
  const [form, setForm] = useState<any>(empty);
  const [wageCheck, setWageCheck] = useState<{ compliant: boolean; minimum: number; message: string } | null>(null);

  useEffect(() => {
    const price = Number(form.price_offered) || 0;
    if (price <= 0) { setWageCheck(null); return; }
    checkWage(form.state, form.skill_category, price).then(setWageCheck);
  }, [form.price_offered, form.skill_category, form.state]);

  const load = async (cid?: string) => {
    setLoading(true);
    const id = cid ?? contractorId;
    if (!id) { setLoading(false); return; }
    const { data } = await supabase.from("jobs").select("*").eq("contractor_id", id).order("created_at", { ascending: false });
    setJobs((data ?? []) as Job[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("contractor_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (data) { setContractorId(data.id); load(data.id); } else setLoading(false);
    })();
    // eslint-disable-next-line
  }, [user]);

  const save = async () => {
    if (!contractorId) return;
    if (!form.title.trim() || !form.work_type.trim() || !form.location.trim()) return toast.error("Fill required fields");
    if (wageCheck && !wageCheck.compliant) {
      return toast.error(`Wage below Maharashtra minimum (₹${wageCheck.minimum}/day). Labour Code 2025 violation.`);
    }
    const { skill_category, state, ...rest } = form;
    const payload = { ...rest, contractor_id: contractorId, price_offered: Number(form.price_offered) || 0 };
    let res;
    if (editing) res = await supabase.from("jobs").update(payload).eq("id", editing.id);
    else res = await supabase.from("jobs").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(editing ? "Job updated" : "Job posted");
    setOpen(false); setEditing(null); setForm(empty); load();
  };

  const closeJob = async (id: string) => {
    const { error } = await supabase.from("jobs").update({ status: "closed" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Job closed"); load();
  };

  const startEdit = (j: Job) => { setEditing(j); setForm(j); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My Jobs</h1>
          <p className="text-sm text-muted-foreground">Post and manage hiring opportunities.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm(empty); } }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary"><Plus className="mr-1 h-4 w-4" />Post New Job</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit Job" : "Post New Job"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Work Type</Label><Input value={form.work_type} onChange={(e) => setForm({ ...form, work_type: e.target.value })} placeholder="e.g. Renovation" /></div>
                <div>
                  <Label>Required Skill</Label>
                  <Select value={form.required_skill} onValueChange={(v) => setForm({ ...form, required_skill: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SKILL_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                <div><Label>Price (Rs/day)</Label><Input type="number" value={form.price_offered} onChange={(e) => setForm({ ...form, price_offered: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Skill Category (for wage compliance)</Label>
                  <Select value={form.skill_category} onValueChange={(v) => setForm({ ...form, skill_category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SKILL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>State</Label>
                  <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Maharashtra">Maharashtra</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              {wageCheck && (
                <div className={`rounded-lg border p-3 text-sm flex items-start gap-2 ${wageCheck.compliant ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
                  {wageCheck.compliant ? <ShieldCheck className="h-4 w-4 mt-0.5"/> : <ShieldAlert className="h-4 w-4 mt-0.5"/>}
                  <span>{wageCheck.message}</span>
                </div>
              )}
              <div><Label>Description</Label><Textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} className="bg-gradient-primary">{editing ? "Update" : "Post Job"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : jobs.length === 0 ? (
          <EmptyState icon={Briefcase} title="No jobs posted yet" description="Click Post New Job to get started." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Title</TableHead><TableHead>Work Type</TableHead><TableHead>Skill</TableHead><TableHead>Location</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell className="font-medium">{j.title}</TableCell>
                    <TableCell>{j.work_type}</TableCell>
                    <TableCell>{j.required_skill}</TableCell>
                    <TableCell>{j.location}</TableCell>
                    <TableCell>Rs. {j.price_offered}</TableCell>
                    <TableCell><StatusBadge status={j.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(j)}><Pencil className="h-3 w-3" /></Button>
                      {j.status === "open" && <Button variant="ghost" size="sm" onClick={() => closeJob(j.id)}><X className="h-3 w-3" /></Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractorJobs;
