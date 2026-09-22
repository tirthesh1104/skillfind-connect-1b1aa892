import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { Loader2, LayoutGrid, MapPin, Users as UsersIcon, Package, Wallet, Flag } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useRealtime } from "@/hooks/useRealtime";

type Job = { id: string; title: string; location: string; status: string; price_offered: number; start_date: string | null; duration_days: number | null };
type Milestone = { id: string; job_id: string; progress_percent: number; client_approved: boolean; status: string };
type Material = { id: string; job_id: string; quantity: number; used: number; cost_per_unit: number };
type Sub = { id: string; job_id: string | null; agreed_amount: number; paid_amount: number };
type Payment = { job_id: string | null; amount_due: number; days_worked: number };

const MultiSiteDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [ms, setMs] = useState<Milestone[]>([]);
  const [mats, setMats] = useState<Material[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [pays, setPays] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    const [j, m, mt, s, p] = await Promise.all([
      supabase.from("jobs").select("id,title,location,status,price_offered,start_date,duration_days").eq("contractor_id", user.id),
      supabase.from("milestones" as any).select("id,job_id,progress_percent,client_approved,status"),
      supabase.from("materials" as any).select("id,job_id,quantity,used,cost_per_unit"),
      supabase.from("sub_contractors" as any).select("id,job_id,agreed_amount,paid_amount"),
      supabase.from("labour_payments").select("job_id,amount_due,days_worked").eq("contractor_id", user.id),
    ]);
    setJobs((j.data as Job[]) ?? []);
    setMs(((m.data as any) ?? []) as Milestone[]);
    setMats(((mt.data as any) ?? []) as Material[]);
    setSubs(((s.data as any) ?? []) as Sub[]);
    setPays(((p.data as any) ?? []) as Payment[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);
  useRealtime(["jobs", "milestones", "materials", "sub_contractors", "labour_payments"], () => load(true), !!user);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const totalBudget = jobs.reduce((s, j) => s + Number(j.price_offered || 0), 0);
  const totalLabourSpend = pays.reduce((s, p) => s + Number(p.amount_due || 0), 0);
  const totalMaterialSpend = mats.reduce((s, m) => s + Number(m.used) * Number(m.cost_per_unit), 0);
  const totalSubSpend = subs.reduce((s, x) => s + Number(x.paid_amount || 0), 0);
  const totalSpend = totalLabourSpend + totalMaterialSpend + totalSubSpend;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><LayoutGrid className="h-6 w-6" /> Multi-Site Dashboard</h1>
        <p className="text-sm text-muted-foreground">सर्व साइट्सचा एकत्रित आढावा · All sites, spend & progress at a glance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={MapPin} label="Active Sites" value={jobs.filter(j => j.status !== "closed").length} hint={`${jobs.length} total`} />
        <StatCard icon={Wallet} label="Total Budget" value={`₹${totalBudget.toLocaleString()}`} accent="primary" />
        <StatCard icon={Package} label="Total Spend" value={`₹${totalSpend.toLocaleString()}`} accent="warning" hint={`Labour ₹${totalLabourSpend.toFixed(0)} · Material ₹${totalMaterialSpend.toFixed(0)} · Sub ₹${totalSubSpend.toFixed(0)}`} />
        <StatCard icon={Flag} label="Milestones" value={`${ms.filter(x => x.status === "completed").length}/${ms.length}`} accent="success" hint={`${ms.filter(x => x.client_approved).length} client-approved`} />
      </div>

      {jobs.length === 0 ? (
        <EmptyState icon={LayoutGrid} title="No sites yet" description="Post a job to see it here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map(job => {
            const jm = ms.filter(x => x.job_id === job.id);
            const avgProgress = jm.length ? Math.round(jm.reduce((s, x) => s + x.progress_percent, 0) / jm.length) : 0;
            const jmat = mats.filter(x => x.job_id === job.id);
            const jsubs = subs.filter(x => x.job_id === job.id);
            const jpays = pays.filter(x => x.job_id === job.id);
            const spend =
              jpays.reduce((s, p) => s + Number(p.amount_due || 0), 0) +
              jmat.reduce((s, m) => s + Number(m.used) * Number(m.cost_per_unit), 0) +
              jsubs.reduce((s, x) => s + Number(x.paid_amount || 0), 0);
            const budget = Number(job.price_offered || 0);
            const budgetPct = budget ? Math.min(100, Math.round((spend / budget) * 100)) : 0;

            return (
              <Card key={job.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{job.title}</CardTitle>
                    <Badge variant={job.status === "open" ? "default" : "secondary"} className="capitalize">{job.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span>Milestones progress</span><span>{avgProgress}%</span></div>
                    <Progress value={avgProgress} />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span>Budget used</span><span>₹{spend.toFixed(0)} / ₹{budget}</span></div>
                    <Progress value={budgetPct} className={budgetPct > 90 ? "[&>div]:bg-red-500" : ""} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div><Flag className="h-4 w-4 mx-auto text-muted-foreground" /><p className="mt-1">{jm.length} stages</p></div>
                    <div><Package className="h-4 w-4 mx-auto text-muted-foreground" /><p className="mt-1">{jmat.length} materials</p></div>
                    <div><UsersIcon className="h-4 w-4 mx-auto text-muted-foreground" /><p className="mt-1">{jsubs.length} subs</p></div>
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

export default MultiSiteDashboard;
