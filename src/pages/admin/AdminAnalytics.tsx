import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/StatCard";
import { TrendingUp, Users, Briefcase, FileText } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";

const COLORS = ["hsl(var(--accent))", "hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [signups, setSignups] = useState<any[]>([]);
  const [bySkill, setBySkill] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any[]>([]);
  const [totals, setTotals] = useState({ users: 0, jobs: 0, requests: 0, disputes: 0 });

  useEffect(() => {
    (async () => {
      const [profilesRes, jobsRes, reqRes, dispRes] = await Promise.all([
        supabase.from("profiles").select("created_at"),
        supabase.from("jobs").select("required_skill, status"),
        supabase.from("requests").select("status"),
        supabase.from("disputes").select("id", { count: "exact", head: true }),
      ]);

      // signups last 14 days
      const days: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "dd MMM");
        days[d] = 0;
      }
      (profilesRes.data ?? []).forEach((p: any) => {
        const k = format(startOfDay(new Date(p.created_at)), "dd MMM");
        if (k in days) days[k]++;
      });
      setSignups(Object.entries(days).map(([date, count]) => ({ date, count })));

      // jobs by skill
      const skillMap: Record<string, number> = {};
      (jobsRes.data ?? []).forEach((j: any) => {
        skillMap[j.required_skill] = (skillMap[j.required_skill] ?? 0) + 1;
      });
      setBySkill(Object.entries(skillMap).map(([name, value]) => ({ name, value })));

      // requests funnel
      const fmap: Record<string, number> = { pending: 0, accepted: 0, rejected: 0 };
      (reqRes.data ?? []).forEach((r: any) => {
        if (r.status in fmap) fmap[r.status]++;
      });
      setFunnel(Object.entries(fmap).map(([stage, count]) => ({ stage, count })));

      setTotals({
        users: profilesRes.data?.length ?? 0,
        jobs: jobsRes.data?.length ?? 0,
        requests: reqRes.data?.length ?? 0,
        disputes: dispRes.count ?? 0,
      });
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="grid gap-4 md:grid-cols-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-72" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Analytics</h1>
        <p className="text-sm text-muted-foreground">Platform insights at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={totals.users} accent="primary" />
        <StatCard icon={Briefcase} label="Total Jobs" value={totals.jobs} accent="success" />
        <StatCard icon={FileText} label="Total Requests" value={totals.requests} accent="warning" />
        <StatCard icon={TrendingUp} label="Open Disputes" value={totals.disputes} accent="destructive" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Signups (last 14 days)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={signups}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Requests funnel</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={funnel}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="stage" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="count" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Jobs by skill</h2>
          {bySkill.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No job data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={bySkill} dataKey="value" nameKey="name" outerRadius={110} label>
                  {bySkill.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
