import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { Briefcase, FileText, HardHat, Users, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";

const AdminHome = () => {
  const [stats, setStats] = useState({ users: 0, contractors: 0, labours: 0, requests: 0, openJobs: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [u, c, l, r, j, rec] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("contractor_profiles").select("*", { count: "exact", head: true }),
        supabase.from("labour_profiles").select("*", { count: "exact", head: true }),
        supabase.from("requests").select("*", { count: "exact", head: true }),
        supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("requests").select("id, status, created_at, contractor:contractor_profiles(company_name), labour:labour_profiles(profiles(full_name))").order("created_at", { ascending: false }).limit(10),
      ]);
      setStats({ users: u.count ?? 0, contractors: c.count ?? 0, labours: l.count ?? 0, requests: r.count ?? 0, openJobs: j.count ?? 0 });
      setRecent(rec.data ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Admin Overview</h1>
        <p className="text-sm text-muted-foreground">Platform-wide activity.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard icon={Users} label="Total Users" value={stats.users} accent="primary" />
        <StatCard icon={UserCheck} label="Contractors" value={stats.contractors} accent="success" />
        <StatCard icon={HardHat} label="Labourers" value={stats.labours} accent="warning" />
        <StatCard icon={FileText} label="Requests" value={stats.requests} accent="primary" />
        <StatCard icon={Briefcase} label="Open Jobs" value={stats.openJobs} accent="success" />
      </div>
      <div className="glass-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <div className="text-sm">
                  <p><span className="font-medium">{r.contractor?.company_name}</span> ⇄ {r.labour?.profiles?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(r.created_at), "PPp")}</p>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminHome;
