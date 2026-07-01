import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { IndianRupee, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";

interface Advance {
  id: string;
  amount: number;
  reason: string;
  repayment_type: string;
  installment_amount: number;
  weeks: number;
  total_repaid: number;
  balance: number;
  status: string;
  agreed_by_worker: boolean;
  created_at: string;
  contractor_id: string;
  worker_id: string;
}

const MyAdvances = () => {
  const { user, role } = useAuth();
  const [rows, setRows] = useState<Advance[]>([]);
  const [loading, setLoading] = useState(true);
  const isWorker = role === "labour";

  const load = useCallback(async () => {
    if (!user) return;
    const key = isWorker ? "worker_id" : "contractor_id";
    const { data } = await supabase
      .from("advances" as any)
      .select("*")
      .eq(key, user.id)
      .order("created_at", { ascending: false });
    setRows((data as any) ?? []);
    setLoading(false);
  }, [user, isWorker]);

  useEffect(() => { load(); }, [load]);

  const respond = async (id: string, agreed: boolean) => {
    const { error } = await supabase.from("advances" as any).update({
      agreed_by_worker: agreed,
      status: agreed ? "active" : "rejected",
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(agreed ? "Advance accepted" : "Advance rejected");
    load();
  };

  if (loading) return <Skeleton className="h-40" />;

  const total = rows.reduce((s, r) => s + (r.status !== "rejected" ? r.amount : 0), 0);
  const repaid = rows.reduce((s, r) => s + r.total_repaid, 0);
  const outstanding = rows.reduce((s, r) => s + (r.status === "active" ? r.balance : 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {isWorker ? "My Advances" : "Advances Given"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isWorker ? "Money advanced to you by contractors." : "Advances you've given to workers."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={IndianRupee} label="Total" value={`₹${total}`} accent="primary" />
        <StatCard icon={CheckCircle2} label="Repaid" value={`₹${repaid}`} accent="success" />
        <StatCard icon={Clock} label="Outstanding" value={`₹${outstanding}`} accent="warning" />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={IndianRupee} title="No advances yet" description={isWorker ? "Contractors can send you advances that you can accept or reject." : "Use the Give Advance button on a worker's card."} />
      ) : (
        <div className="grid gap-3">
          {rows.map(r => (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">₹{r.amount}</CardTitle>
                  <Badge variant={r.status === "active" ? "default" : r.status === "rejected" ? "destructive" : "outline"}>{r.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Reason:</span> {r.reason || "—"}</p>
                <p><span className="text-muted-foreground">Repayment:</span> {r.repayment_type === "one-time" ? "One-time deduction" : `${r.weeks} × ₹${r.installment_amount} (${r.repayment_type})`}</p>
                <p><span className="text-muted-foreground">Balance:</span> ₹{r.balance} / ₹{r.amount}</p>
                <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                {isWorker && r.status === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={() => respond(r.id, true)}><CheckCircle2 className="mr-1 h-3 w-3"/> Accept</Button>
                    <Button size="sm" variant="outline" onClick={() => respond(r.id, false)}><XCircle className="mr-1 h-3 w-3"/> Reject</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAdvances;
