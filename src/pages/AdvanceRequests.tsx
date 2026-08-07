import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { HandCoins, Check, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const statusCls: Record<string, string> = {
  pending: "border-amber-500/30 bg-amber-500/15 text-amber-400",
  approved: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
  rejected: "border-red-500/30 bg-red-500/15 text-red-400",
  repaid: "border-border bg-muted text-muted-foreground",
};

/** Feature 19 — wage advance / small loan requests between worker and contractor. */
const AdvanceRequests = () => {
  const { user, role } = useAuth();
  const isWorker = role === "labour";
  const [rows, setRows] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobId, setJobId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const col = isWorker ? "worker_id" : "contractor_id";
    let query = supabase.from("wage_advance_requests").select("*").order("requested_at", { ascending: false });
    if (role !== "admin") query = query.eq(col, user.id);
    const { data } = await query;
    const list = data ?? [];
    setRows(list);

    const ids = Array.from(new Set(list.flatMap((r: any) => [r.worker_id, r.contractor_id])));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      setNames(Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.full_name])));
    }
    setLoading(false);
  }, [user, role, isWorker]);

  useEffect(() => {
    if (!user) return;
    load();
    if (!isWorker) return;
    (async () => {
      const { data: lp } = await supabase.from("labour_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (!lp) return;
      const { data } = await supabase
        .from("requests")
        .select("job:jobs(id, title, price_offered, contractor:contractor_profiles(user_id, company_name))")
        .eq("labour_id", lp.id)
        .eq("status", "accepted");
      const list = (data ?? []).map((r: any) => r.job).filter(Boolean);
      const unique = Array.from(new Map(list.map((j: any) => [j.id, j])).values());
      setJobs(unique);
      if (unique[0]) setJobId((unique[0] as any).id);
    })();
  }, [user, isWorker, load]);

  const selectedJob = jobs.find((j) => j.id === jobId);
  const cap = selectedJob ? Math.floor(Number(selectedJob.price_offered ?? 0) * 0.5) : 0;

  const submit = async () => {
    if (!user || !selectedJob) return toast.error("Select a job first");
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (cap > 0 && amt > cap) return toast.error(`Maximum allowed is Rs. ${cap.toLocaleString("en-IN")} (50% of expected earnings)`);
    const contractorUserId = selectedJob.contractor?.user_id;
    if (!contractorUserId) return toast.error("Contractor not found for this job");

    setSubmitting(true);
    const { error } = await supabase.from("wage_advance_requests").insert({
      worker_id: user.id,
      contractor_id: contractorUserId,
      job_id: selectedJob.id,
      requested_amount: amt,
      reason: reason.trim() || null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    await supabase.from("notifications").insert({
      user_id: contractorUserId,
      type: "system",
      message: `New wage advance request of Rs. ${amt.toLocaleString("en-IN")} for "${selectedJob.title}".`,
    });
    setAmount(""); setReason("");
    toast.success("Advance request sent");
    load();
  };

  const decide = async (row: any, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("wage_advance_requests")
      .update({ status, approved_at: status === "approved" ? new Date().toISOString() : null })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    await supabase.from("notifications").insert({
      user_id: row.worker_id,
      type: "system",
      message: status === "approved"
        ? `Your advance of Rs. ${row.requested_amount.toLocaleString("en-IN")} was approved. It will be deducted from your final wage.`
        : "Your advance request was rejected.",
    });
    toast.success(status === "approved" ? "Advance approved" : "Request rejected");
    load();
  };

  const markRepaid = async (row: any) => {
    const { error } = await supabase.from("wage_advance_requests").update({ status: "repaid", repaid_at: new Date().toISOString() }).eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Marked as repaid");
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {isWorker ? "Request Advance" : "Advance Requests"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isWorker
            ? "Ask your contractor for part of your wage early. Approved amounts are deducted from the final payout."
            : "Approve or reject worker advance requests. Approved amounts are auto-deducted at payout."}
        </p>
      </div>

      {isWorker && (
        <div className="glass-card grid gap-4 p-5 md:grid-cols-3">
          <div>
            <Label className="text-xs">Job</Label>
            <Select value={jobId} onValueChange={setJobId}>
              <SelectTrigger><SelectValue placeholder="Select job" /></SelectTrigger>
              <SelectContent>
                {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
              </SelectContent>
            </Select>
            {cap > 0 && <p className="mt-1 text-[11px] text-muted-foreground">Max Rs. {cap.toLocaleString("en-IN")} (50%)</p>}
          </div>
          <div>
            <Label className="text-xs">Amount (Rs.)</Label>
            <Input type="number" min={1} max={cap || undefined} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="2000" />
          </div>
          <div>
            <Label className="text-xs">Reason</Label>
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Medical / family need" />
          </div>
          <div className="md:col-span-3">
            <Button onClick={submit} disabled={submitting || jobs.length === 0} className="bg-gradient-primary">
              <HandCoins className="mr-2 h-4 w-4" />{submitting ? "Sending..." : "Request Advance"}
            </Button>
            {jobs.length === 0 && <p className="mt-2 text-xs text-muted-foreground">You need an accepted job before requesting an advance.</p>}
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={HandCoins} title="No advance requests" description={isWorker ? "Your requests will appear here." : "Worker requests will appear here."} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isWorker ? "Contractor" : "Worker"}</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  {!isWorker && <TableHead className="text-right">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{names[isWorker ? r.contractor_id : r.worker_id] ?? "—"}</TableCell>
                    <TableCell className="font-semibold text-accent">Rs. {Number(r.requested_amount).toLocaleString("en-IN")}</TableCell>
                    <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">{r.reason || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(r.requested_at), "PP")}</TableCell>
                    <TableCell>
                      <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs capitalize", statusCls[r.status])}>{r.status}</span>
                    </TableCell>
                    {!isWorker && (
                      <TableCell className="space-x-2 text-right">
                        {r.status === "pending" && (
                          <>
                            <Button size="sm" className="bg-gradient-primary" onClick={() => decide(r, "approved")}><Check className="mr-1 h-3 w-3" />Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => decide(r, "rejected")}><X className="mr-1 h-3 w-3" />Reject</Button>
                          </>
                        )}
                        {r.status === "approved" && (
                          <Button size="sm" variant="outline" onClick={() => markRepaid(r)}>Mark repaid</Button>
                        )}
                      </TableCell>
                    )}
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

export default AdvanceRequests;
