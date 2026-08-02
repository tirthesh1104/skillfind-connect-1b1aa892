import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { ShieldAlert, ScrollText, RefreshCw, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface Flag {
  id: string;
  subject_id: string | null;
  job_id: string | null;
  flag_type: string;
  severity: string;
  details: string | null;
  resolved: boolean;
  created_at: string;
}

interface Log {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  details: string | null;
  created_at: string;
}

const AuditCenter = () => {
  const { user } = useAuth();
  const [flags, setFlags] = useState<Flag[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: f }, { data: l }] = await Promise.all([
      supabase.from("fraud_flags").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    const fl = (f ?? []) as Flag[];
    const lg = (l ?? []) as Log[];
    setFlags(fl);
    setLogs(lg);
    const ids = Array.from(
      new Set([...fl.map((x) => x.subject_id), ...lg.map((x) => x.actor_id)].filter(Boolean) as string[])
    );
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      const map: Record<string, string> = {};
      (profs ?? []).forEach((p: any) => (map[p.id] = p.full_name));
      setNames(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const channel = supabase
      .channel("audit-center")
      .on("postgres_changes", { event: "*", schema: "public", table: "fraud_flags" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const runScan = async () => {
    setScanning(true);
    const found: Omit<Flag, "id" | "created_at" | "resolved">[] = [];

    // 1. Ghost worker: check-ins without any GPS coordinates in last 7 days
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    const { data: checkins } = await supabase
      .from("site_checkins")
      .select("worker_id, latitude, longitude, created_at")
      .gte("created_at", since);
    const byWorker: Record<string, { total: number; noGps: number }> = {};
    (checkins ?? []).forEach((c: any) => {
      const w = (byWorker[c.worker_id] ??= { total: 0, noGps: 0 });
      w.total += 1;
      if (c.latitude == null || c.longitude == null) w.noGps += 1;
    });
    Object.entries(byWorker).forEach(([wid, v]) => {
      if (v.total >= 3 && v.noGps === v.total) {
        found.push({
          subject_id: wid,
          job_id: null,
          flag_type: "no_gps_attendance",
          severity: "medium",
          details: `${v.total} check-ins in 7 days without GPS location`,
        });
      }
    });

    // 2. Unpaid wages older than 30 days
    const cutoff = new Date(Date.now() - 30 * 864e5).toISOString();
    const { data: due } = await supabase
      .from("labour_payments")
      .select("id, labour_id, contractor_id, amount_due, status, created_at")
      .neq("status", "paid")
      .lt("created_at", cutoff);
    (due ?? []).forEach((p: any) => {
      found.push({
        subject_id: p.contractor_id,
        job_id: null,
        flag_type: "overdue_wage",
        severity: "high",
        details: `₹${p.amount_due} unpaid since ${format(new Date(p.created_at), "dd MMM yyyy")}`,
      });
    });

    // 3. Rejected site proofs (possible fake work claims)
    const { data: rejected } = await supabase
      .from("site_proofs")
      .select("uploaded_by, job_id")
      .eq("status", "rejected");
    const rejCount: Record<string, number> = {};
    (rejected ?? []).forEach((r: any) => (rejCount[r.uploaded_by] = (rejCount[r.uploaded_by] ?? 0) + 1));
    Object.entries(rejCount).forEach(([uid, count]) => {
      if (count >= 2) {
        found.push({
          subject_id: uid,
          job_id: null,
          flag_type: "rejected_proofs",
          severity: "medium",
          details: `${count} site proofs rejected`,
        });
      }
    });

    // avoid duplicates with existing open flags
    const openKeys = new Set(flags.filter((f) => !f.resolved).map((f) => `${f.subject_id}|${f.flag_type}|${f.details}`));
    const fresh = found.filter((f) => !openKeys.has(`${f.subject_id}|${f.flag_type}|${f.details}`));

    if (fresh.length) {
      const { error } = await supabase.from("fraud_flags").insert(fresh as any);
      if (error) {
        setScanning(false);
        return toast.error(error.message);
      }
      await supabase.from("audit_log").insert({
        actor_id: user?.id,
        action: "fraud_scan",
        entity: "fraud_flags",
        details: `${fresh.length} new flags raised`,
      });
    }
    setScanning(false);
    toast.success(fresh.length ? `${fresh.length} नवीन flags सापडले` : "No new issues found ✅");
    load();
  };

  const resolve = async (f: Flag) => {
    const { error } = await supabase.from("fraud_flags").update({ resolved: true }).eq("id", f.id);
    if (error) return toast.error(error.message);
    await supabase.from("audit_log").insert({
      actor_id: user?.id,
      action: "fraud_flag_resolved",
      entity: "fraud_flags",
      entity_id: f.id,
      details: f.flag_type,
    });
    load();
  };

  const tone = (s: string) => (s === "high" ? "destructive" : s === "medium" ? "secondary" : "outline");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Audit & Fraud Center</h1>
          <p className="text-sm text-muted-foreground">Automated integrity checks and a tamper-evident action trail.</p>
        </div>
        <Button onClick={runScan} disabled={scanning}>
          <RefreshCw className={`mr-2 h-4 w-4 ${scanning ? "animate-spin" : ""}`} /> {scanning ? "Scanning…" : "Run Scan"}
        </Button>
      </div>

      <div className="glass-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <ShieldAlert className="h-4 w-4 text-destructive" /> Fraud Flags
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : flags.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="No flags raised" description="Run a scan to check attendance, wages and proof integrity." />
        ) : (
          <ul className="divide-y divide-border">
            {flags.map((f) => (
              <li key={f.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <span className="capitalize">{f.flag_type.replace(/_/g, " ")}</span>
                    <Badge variant={tone(f.severity) as any} className="capitalize">{f.severity}</Badge>
                    {f.resolved && <Badge variant="outline">Resolved</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {names[f.subject_id ?? ""] ?? "Unknown"} · {f.details} · {format(new Date(f.created_at), "dd MMM yy")}
                  </p>
                </div>
                {!f.resolved && (
                  <Button size="sm" variant="outline" onClick={() => resolve(f)}>
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Resolve
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="glass-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <ScrollText className="h-4 w-4 text-primary" /> Audit Trail
        </h2>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recorded actions yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {logs.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium capitalize">{l.action.replace(/_/g, " ")}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {names[l.actor_id ?? ""] ?? "System"}{l.details ? ` · ${l.details}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{format(new Date(l.created_at), "dd MMM p")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AuditCenter;
