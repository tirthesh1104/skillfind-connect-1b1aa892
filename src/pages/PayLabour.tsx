import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Wallet, IndianRupee } from "lucide-react";
import { PaymentModal, PaymentTarget } from "@/components/PaymentModal";
import { EmptyState } from "@/components/EmptyState";

interface Row {
  id: string;
  labour_id: string;
  contractor_id: string;
  skill: string | null;
  days_worked: number;
  daily_rate: number;
  amount_due: number;
  status: string;
  labour_name: string;
  upi_id: string | null;
}

const PayLabour = () => {
  const { user, role } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractorName, setContractorName] = useState("");
  const [target, setTarget] = useState<PaymentTarget | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let q = supabase.from("labour_payments")
      .select("*").order("created_at", { ascending: false });
    if (role === "contractor") q = q.eq("contractor_id", user.id);

    const { data: lp } = await q;
    const labourIds = [...new Set((lp ?? []).map((r) => r.labour_id))];
    const { data: profs } = labourIds.length
      ? await supabase.from("profiles").select("id, full_name, upi_id").in("id", labourIds)
      : { data: [] as any[] };
    const profMap = new Map((profs ?? []).map((p) => [p.id, p]));

    setRows((lp ?? []).map((r) => ({
      ...r,
      labour_name: profMap.get(r.labour_id)?.full_name ?? "Worker",
      upi_id: profMap.get(r.labour_id)?.upi_id ?? null,
    })));

    const { data: me } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    setContractorName(me?.full_name ?? "Contractor");

    let hq = supabase.from("payment_history")
      .select("*").order("created_at", { ascending: false }).limit(20);
    if (role === "contractor") hq = hq.eq("contractor_id", user.id);
    const { data: h } = await hq;
    setHistory(h ?? []);
    setLoading(false);
  }, [user, role]);

  useEffect(() => { load(); }, [load]);

  const openPay = (r: Row) => {
    setTarget({
      labour_payment_id: r.id,
      labour_id: r.labour_id,
      labour_name: r.labour_name,
      upi_id: r.upi_id,
      skill: r.skill,
      days_worked: r.days_worked,
      amount: r.amount_due,
      contractor_id: r.contractor_id,
      contractor_name: contractorName,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">💸 Pay Labour</h1>
        <p className="text-sm text-muted-foreground">Pay workers directly via UPI, QR, or Razorpay.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Wallet className="h-5 w-5" />Pending Payments</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-40" /> : rows.length === 0 ? (
            <EmptyState icon={IndianRupee} title="All caught up" description="No pending payments." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const ready = !!r.upi_id;
                    const unpaid = r.status !== "Paid";
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.labour_name}</TableCell>
                        <TableCell>{r.skill || "—"}</TableCell>
                        <TableCell>{r.days_worked}</TableCell>
                        <TableCell>₹{r.amount_due.toLocaleString()}</TableCell>
                        <TableCell>
                          {ready ? (
                            <span className="text-green-600 text-xs">✅ UPI Ready<br /><span className="text-muted-foreground">{r.upi_id}</span></span>
                          ) : (
                            <span className="text-orange-600 text-xs">⚠️ No UPI Added</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.status === "Paid" ? "default" : "secondary"}>{r.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {ready && unpaid ? (
                            <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={() => openPay(r)}>💸 Pay Now</Button>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span><Button size="sm" disabled>💸 Pay Now</Button></span>
                              </TooltipTrigger>
                              <TooltipContent>{r.status === "Paid" ? "Already paid" : "Labour has not added UPI ID yet"}</TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Payment History</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payment history yet.</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Date</TableHead><TableHead>Amount</TableHead>
                <TableHead>Method</TableHead><TableHead>Reference</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>{new Date(h.created_at).toLocaleString()}</TableCell>
                    <TableCell>₹{h.amount.toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline">{h.payment_method}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{h.payment_reference}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PaymentModal open={open} onOpenChange={setOpen} target={target} onPaid={load} />
    </div>
  );
};

export default PayLabour;
