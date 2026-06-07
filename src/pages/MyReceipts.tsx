import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, Share2, FileText, CheckCircle, XCircle, Image as ImageIcon, CalendarClock } from "lucide-react";
import { ReceiptModal, ReceiptData } from "@/components/ReceiptModal";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { generatePayslip } from "@/lib/payslip";

const MyReceipts = () => {
  const { user, role } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [proofs, setProofs] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ReceiptData | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    let q = supabase.from("payment_receipts").select("*").order("created_at", { ascending: false });
    if (role === "labour") q = q.eq("labour_id", user.id);
    else if (role === "contractor") q = q.eq("contractor_id", user.id);
    const { data } = await q;
    setRows(data ?? []);

    let pq = supabase.from("payment_proofs").select("*").order("created_at", { ascending: false });
    if (role === "labour") pq = pq.eq("labour_id", user.id);
    else if (role === "contractor") pq = pq.eq("contractor_id", user.id);
    const { data: pr } = await pq;
    setProofs(pr ?? []);

    // Pending payments with expected dates (labour view)
    if (role === "labour") {
      const { data: lp } = await supabase.from("labour_payments")
        .select("*").eq("labour_id", user.id).neq("status", "Paid").order("created_at", { ascending: false });
      setPending(lp ?? []);
    }

    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user, role]);

  const view = (r: any) => { setActive({ ...r, labour_id: r.labour_id }); setOpen(true); };

  const share = async (r: any) => {
    const text = `Receipt ${r.receipt_number}: ₹${r.amount} on ${new Date(r.created_at).toLocaleString()}`;
    if (navigator.share) { try { await navigator.share({ title: "Receipt", text }); } catch {} }
    else { await navigator.clipboard.writeText(text); toast.success("Copied!"); }
  };

  const downloadPayslip = (r: any) => {
    generatePayslip({
      receipt_number: r.receipt_number, payment_reference: r.payment_reference,
      labour_name: r.labour_name, skill: r.skill, contractor_name: r.contractor_name,
      days_worked: r.days_worked, gross: r.amount, advance_deducted: 0, net: r.amount,
      payment_method: r.payment_method, upi_id: r.upi_id, paid_on: r.created_at,
    });
  };

  const confirmProof = async (id: string) => {
    const { error } = await supabase.from("payment_proofs").update({
      confirmed_by_labour: true, confirmed_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("✅ Payment confirmed received"); load();
  };

  const proofFor = (rId: string) => proofs.find(p => p.payment_history_id && rows.some(r => r.payment_history_id === rId));
  const proofByHistoryId = (phId: string) => proofs.find(p => p.payment_history_id === phId);

  const expectedBadge = (iso?: string | null) => {
    if (!iso) return null;
    const d = Math.floor((new Date(iso).getTime() - Date.now()) / 86400000);
    if (d > 0) return <Badge className="bg-green-600">🟢 Expected in {d}d</Badge>;
    if (d === 0) return <Badge className="bg-amber-500">🟡 Expected today</Badge>;
    return <Badge variant="destructive">🔴 {Math.abs(d)}d overdue</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">🧾 My Receipts</h1>
        <p className="text-sm text-muted-foreground">All payments received from contractors.</p>
      </div>

      {role === "labour" && pending.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CalendarClock className="h-5 w-5" />Pending Payments</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date Worked</TableHead><TableHead>Days</TableHead>
                  <TableHead>Amount Due</TableHead><TableHead>Expected</TableHead><TableHead>Note</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {pending.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{p.days_worked}</TableCell>
                      <TableCell className="font-medium">₹{p.amount_due.toLocaleString()}</TableCell>
                      <TableCell>{expectedBadge(p.expected_payment_date) || <span className="text-xs text-muted-foreground">Not set</span>}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.payment_promise_note || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">Receipts</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-40" /> : rows.length === 0 ? (
            <EmptyState icon={FileText} title="No receipts yet" description="Receipts appear here after contractor pays you." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const proof = proofByHistoryId(r.payment_history_id);
                    return (
                      <TableRow key={r.id}>
                        <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{r.contractor_name || "—"}</TableCell>
                        <TableCell className="font-medium">₹{r.amount.toLocaleString()}</TableCell>
                        <TableCell><Badge variant="outline">{r.payment_method}</Badge></TableCell>
                        <TableCell>
                          {proof ? (
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" asChild>
                                <a href={proof.proof_url} target="_blank" rel="noopener noreferrer"><ImageIcon className="h-4 w-4" /></a>
                              </Button>
                              {role === "labour" && !proof.confirmed_by_labour && (
                                <Button size="sm" variant="outline" className="border-green-500 text-green-700" onClick={() => confirmProof(proof.id)}>
                                  <CheckCircle className="mr-1 h-3 w-3" />Confirm
                                </Button>
                              )}
                              {proof.confirmed_by_labour && <Badge className="bg-green-600">✅ Confirmed</Badge>}
                            </div>
                          ) : (<span className="text-xs text-muted-foreground">No proof</span>)}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="sm" variant="ghost" onClick={() => view(r)}><Eye className="h-4 w-4" /></Button>
                          {role === "labour" && (
                            <Button size="sm" variant="ghost" title="Download Payslip" onClick={() => downloadPayslip(r)}><Download className="h-4 w-4" /></Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => share(r)}><Share2 className="h-4 w-4" /></Button>
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

      <ReceiptModal open={open} onOpenChange={setOpen} receipt={active} />
    </div>
  );
};

export default MyReceipts;
