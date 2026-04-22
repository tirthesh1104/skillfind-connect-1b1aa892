import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/StatCard";
import { Briefcase, CheckCircle, Clock, IndianRupee } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const LabourHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ active: 0, accepted: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: lp } = await supabase.from("labour_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (!lp) { setLoading(false); return; }
      const [{ count: active }, { count: accepted }, { count: pending }] = await Promise.all([
        supabase.from("requests").select("*", { count: "exact", head: true }).eq("labour_id", lp.id),
        supabase.from("requests").select("*", { count: "exact", head: true }).eq("labour_id", lp.id).eq("status", "accepted"),
        supabase.from("requests").select("*", { count: "exact", head: true }).eq("labour_id", lp.id).eq("status", "pending"),
      ]);
      setStats({ active: active ?? 0, accepted: accepted ?? 0, pending: pending ?? 0 });
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Labour Dashboard</h1>
        <p className="text-sm text-muted-foreground">Track your applications and earnings.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Briefcase} label="Active Applications" value={stats.active} accent="primary" />
        <StatCard icon={CheckCircle} label="Accepted Jobs" value={stats.accepted} accent="success" />
        <StatCard icon={Clock} label="Pending Requests" value={stats.pending} accent="warning" />
        <StatCard icon={IndianRupee} label="Earnings (Month)" value="—" hint="Coming soon" accent="primary" />
      </div>
    </div>
  );
};

export default LabourHome;
