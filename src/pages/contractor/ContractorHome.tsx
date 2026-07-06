import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/StatCard";
import { Briefcase, HardHat, Inbox, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { WeatherWidget } from "@/components/WeatherWidget";

const ContractorHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ hiredToday: 0, openJobs: 0, pending: 0, available: 0, max: 5 });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: cp } = await supabase.from("contractor_profiles").select("id, max_labour_per_day, total_hired_today").eq("user_id", user.id).maybeSingle();
      if (!cp) { setLoading(false); return; }
      const [{ count: openJobs }, { count: pending }, { count: available }, { data: rec }] = await Promise.all([
        supabase.from("jobs").select("*", { count: "exact", head: true }).eq("contractor_id", cp.id).eq("status", "open"),
        supabase.from("requests").select("*", { count: "exact", head: true }).eq("contractor_id", cp.id).eq("status", "pending"),
        supabase.from("labour_profiles").select("*", { count: "exact", head: true }).eq("is_available", true),
        supabase.from("requests").select("id, status, created_at, labour_profiles(skill, profiles(full_name))").eq("contractor_id", cp.id).order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({ hiredToday: cp.total_hired_today, openJobs: openJobs ?? 0, pending: pending ?? 0, available: available ?? 0, max: cp.max_labour_per_day });
      setRecent(rec ?? []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Contractor Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your hiring activity today.</p>
      </div>

      <WeatherWidget />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={HardHat} label="Hired Today" value={`${stats.hiredToday}/${stats.max}`} hint="Daily limit" accent="primary" />
        <StatCard icon={Briefcase} label="Open Jobs" value={stats.openJobs} accent="success" />
        <StatCard icon={Inbox} label="Pending Requests" value={stats.pending} accent="warning" />
        <StatCard icon={Users} label="Available Labour" value={stats.available} accent="primary" />
      </div>

      <div className="glass-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Recent Requests</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet. Head to Find Labour to get started.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{r.labour_profiles?.profiles?.full_name ?? "Labour"}</p>
                  <p className="text-xs text-muted-foreground">{r.labour_profiles?.skill} · {format(new Date(r.created_at), "PP")}</p>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs capitalize">{r.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ContractorHome;
