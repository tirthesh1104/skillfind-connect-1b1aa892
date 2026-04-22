import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { ListChecks } from "lucide-react";
import { format } from "date-fns";

const LabourApplications = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: lp } = await supabase.from("labour_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (!lp) { setLoading(false); return; }
      const { data } = await supabase
        .from("requests")
        .select("id, status, created_at, job:jobs(title), contractor:contractor_profiles(company_name)")
        .eq("labour_id", lp.id)
        .order("created_at", { ascending: false });
      setRows(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My Applications</h1>
        <p className="text-sm text-muted-foreground">Status of all your applications.</p>
      </div>
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={ListChecks} title="No applications yet" description="Apply to jobs from Find Jobs." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Job</TableHead><TableHead>Contractor</TableHead><TableHead>Date Applied</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.job?.title ?? "Direct hire request"}</TableCell>
                    <TableCell>{r.contractor?.company_name ?? "—"}</TableCell>
                    <TableCell>{format(new Date(r.created_at), "PP")}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
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

export default LabourApplications;
