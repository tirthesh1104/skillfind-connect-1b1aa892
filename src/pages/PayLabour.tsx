import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Wallet, IndianRupee, IdCard as IdCardIcon, CalendarDays, Upload, BellRing } from "lucide-react";
import { PaymentModal, PaymentTarget } from "@/components/PaymentModal";
import { IdCardModal } from "@/components/IdCardModal";
import { IdCardData } from "@/components/IdCard";
import { EmptyState } from "@/components/EmptyState";
import { SetExpectedDateDialog } from "@/components/SetExpectedDateDialog";
import { UploadProofDialog } from "@/components/UploadProofDialog";
import { toast } from "sonner";

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
  upi_verified?: boolean;
  payment_frequency?: string;
  expected_payment_date?: string | null;
  payment_promise_note?: string | null;
  created_at: string;
  _profile?: any;
}

const PayLabour = () => {
  const { user, role } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractorName, setContractorName] = useState("");
  const [target, setTarget] = useState<PaymentTarget | null>(null);
  const [open, setOpen] = useState(false);
  const [idCard, setIdCard] = useState<IdCardData | null>(null);
  const [idOpen, setIdOpen] = useState(false);
  const [dateRow, setDateRow] = useState<Row | null>(null);
  const [dateOpen, setDateOpen] = useState(false);
  const [proofFor, setProofFor] = useState<{ ph_id: string; lp_id: string; labour_id: string; amount: number } | null>(null);
  const [proofOpen, setProofOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let q = supabase.from("labour_payments")
      .select("*").order("created_at", { ascending: false });
    if (role === "contractor") q = q.eq("contractor_id", user.id);

    const { data: lp } = await q;
    const labourIds = [...new Set((lp ?? []).map((r) => r.labour_id))];
    const { data: profs } = labourIds.length
      ? await supabase.from("profiles").select("id, full_name, upi_id, upi_verified, payment_frequency, phone, profile_photo_url, bank_name, account_number, ifsc_code, id_card_number, id_card_generated_at, rating_avg, aadhaar_last4").in("id", labourIds)
      : { data: [] as any[] };
    const profMap = new Map((profs ?? []).map((p) => [p.id, p]));

    setRows((lp ?? []).map((r: any) => {
      const p: any = profMap.get(r.labour_id);
      return {
        ...r,
        labour_name: p?.full_name ?? "Worker",
        upi_id: p?.upi_id ?? null,
        upi_verified: !!p?.upi_verified,
        payment_frequency: p?.payment_frequency ?? "Monthly",
        _profile: p,
      } as Row;
    }));

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

  const sendReminder = async (r: Row) => {
    await supabase.from("notifications").insert({
      user_id: r.labour_id,
      title: "📩 Payment Coming Soon",
      message: `Reminder: your contractor noted ₹${r.amount_due.toLocaleString()} pending payment.`,
      type: "system" as const,
    });
    toast.success("Reminder sent to worker");
  };

  const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  const expectedBadge = (r: Row) => {
    if (!r.expected_payment_date) return <span className="text-xs text-muted-foreground">—</span>;
    const d = Math.floor((new Date(r.expected_payment_date).getTime() - Date.now()) / 86400000);
    if (d > 0) return <Badge className="bg-green-600">{new Date(r.expected_payment_date).toLocaleDateString()} • in {d}d</Badge>;
    if (d === 0) return <Badge className="bg-amber-500">Today</Badge>;
    return <Badge variant="destructive">{Math.abs(d)}d overdue</Badge>;
  };

  // Overdue summary
  const overdueRows = rows.filter(r => r.status !== "Paid" && daysSince(r.created_at) >= 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">💸 Pay Labour</h1>
        <p className="text-sm text-muted-foreground">Pay workers directly via UPI, QR, or Razorpay.</p>
      </div>

      {overdueRows.length > 0 && (
        <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/30">
          <CardContent className="p-4 flex items-center gap-3">
            <BellRing className="h-5 w-5 text-orange-600 shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-orange-900 dark:text-orange-200">⚠️ {overdueRows.length} payment{overdueRows.length > 1 ? "s" : ""} pending {">"}3 days</p>
              <p className="text-orange-800 dark:text-orange-300">Set an expected date or pay now to keep your reputation strong.</p>
            </div>
          </CardContent>
        </Card>
      )}

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
                  <TableHead>UPI</TableHead>
                  <TableHead>Freq</TableHead>
                  <TableHead>Expected Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>🪪 ID</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const ready = !!r.upi_id;
                    const unpaid = r.status !== "Paid";
                    const ageDays = daysSince(r.created_at);
                    return (
                      <TableRow key={r.id} className={ageDays >= 7 && unpaid ? "bg-red-50/40 dark:bg-red-950/20" : ""}>
                        <TableCell className="font-medium">{r.labour_name}</TableCell>
                        <TableCell>{r.skill || "—"}</TableCell>
                        <TableCell>{r.days_worked}</TableCell>
                        <TableCell>₹{r.amount_due.toLocaleString()}</TableCell>
                        <TableCell>
                          {ready ? (
                            <div className="text-xs">
                              <span className={r.upi_verified ? "text-green-600" : "text-amber-600"}>
                                {r.upi_verified ? "✅ Verified" : "⚠️ Unverified"}
                              </span>
                              <div className="text-muted-foreground">{r.upi_id}</div>
                            </div>
                          ) : <span className="text-orange-600 text-xs">⚠️ No UPI</span>}
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{r.payment_frequency || "Monthly"}</Badge></TableCell>
                        <TableCell>{expectedBadge(r)}</TableCell>
                        <TableCell><Badge variant={r.status === "Paid" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
                        <TableCell>
                          {r._profile?.id_card_number ? (
                            <Button size="sm" variant="outline" onClick={() => {
                              const p = r._profile;
                              setIdCard({
                                id_card_number: p.id_card_number,
                                full_name: p.full_name,
                                skill: r.skill,
                                phone: p.phone,
                                upi_id: p.upi_id,
                                rating_avg: p.rating_avg,
                                profile_photo_url: p.profile_photo_url,
                                bank_name: p.bank_name,
                                account_number: p.account_number,
                                ifsc_code: p.ifsc_code,
                                id_card_generated_at: p.id_card_generated_at,
                                verified: !!p.aadhaar_last4,
                                worker_user_id: r.labour_id,
                              });
                              setIdOpen(true);
                            }}><IdCardIcon className="mr-1 h-3 w-3" />View</Button>
                          ) : (<span className="text-xs text-muted-foreground">—</span>)}
                        </TableCell>
                        <TableCell className="text-right space-y-1">
                          {unpaid && (
                            <div className="flex flex-col gap-1 items-end">
                              {ready ? (
                                <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={() => openPay(r)}>💸 Pay Now</Button>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild><span><Button size="sm" disabled>💸 Pay Now</Button></span></TooltipTrigger>
                                  <TooltipContent>Labour has not added UPI ID yet</TooltipContent>
                                </Tooltip>
                              )}
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" onClick={() => { setDateRow(r); setDateOpen(true); }}>
                                  <CalendarDays className="h-3 w-3" />
                                </Button>
                                {ageDays >= 3 && (
                                  <Button size="sm" variant="ghost" onClick={() => sendReminder(r)}>
                                    <BellRing className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                          {!unpaid && <Badge>✅ Paid</Badge>}
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
                <TableHead className="text-right">Proof</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {history.map((h) => {
                  const lp = rows.find(r => r.id === h.labour_payment_id);
                  return (
                    <TableRow key={h.id}>
                      <TableCell>{new Date(h.created_at).toLocaleString()}</TableCell>
                      <TableCell>₹{h.amount.toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline">{h.payment_method}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{h.payment_reference}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => {
                          setProofFor({ ph_id: h.id, lp_id: h.labour_payment_id, labour_id: h.labour_id, amount: h.amount });
                          setProofOpen(true);
                        }}><Upload className="mr-1 h-3 w-3" />Upload Proof</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PaymentModal open={open} onOpenChange={setOpen} target={target} onPaid={load} />
      <IdCardModal open={idOpen} onOpenChange={setIdOpen} data={idCard} onPay={() => {
        setIdOpen(false);
        const row = rows.find(r => r.labour_id === idCard?.worker_user_id);
        if (row) openPay(row);
      }} />
      <SetExpectedDateDialog open={dateOpen} onOpenChange={setDateOpen} payment={dateRow} onSaved={load} />
      <UploadProofDialog
        open={proofOpen} onOpenChange={setProofOpen}
        payment_history_id={proofFor?.ph_id}
        labour_payment_id={proofFor?.lp_id}
        contractor_id={user?.id ?? ""}
        labour_id={proofFor?.labour_id ?? ""}
        labour_name={contractorName}
        amount={proofFor?.amount}
        onDone={load}
      />
    </div>
  );
};

export default PayLabour;
