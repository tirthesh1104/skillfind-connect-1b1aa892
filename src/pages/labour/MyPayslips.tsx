import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { FileText, Download } from "lucide-react";
import { generatePayslip } from "@/lib/payslip";
import { toast } from "sonner";

const MyPayslips = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("payment_receipts").select("*").eq("labour_id", user.id).order("created_at", { ascending: false });
      setRows(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  const download = async (r: any) => {
    const { data: prof } = await supabase.from("profiles").select("id_card_number").eq("id", r.labour_id).maybeSingle();
    generatePayslip({
      receipt_number: r.receipt_number,
      payment_reference: r.payment_reference,
      labour_name: r.labour_name,
      labour_id_card: prof?.id_card_number,
      skill: r.skill,
      contractor_name: r.contractor_name,
      days_worked: r.days_worked,
      gross: r.amount,
      advance_deducted: 0,
      net: r.amount,
      payment_method: r.payment_method,
      upi_id: r.upi_id,
      paid_on: r.created_at,
    });
    toast.success("📄 Payslip downloaded");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">📄 My Payslips</h1>
        <p className="text-sm text-muted-foreground">Download A4 payslip PDFs for every payment received.</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-lg">All Payments</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-40" /> : rows.length === 0 ? (
            <EmptyState icon={FileText} title="No payslips yet" description="You'll see a payslip here after your first paid wage." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date</TableHead><TableHead>From</TableHead><TableHead>Days</TableHead>
                  <TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead className="text-right">Payslip</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{r.contractor_name}</TableCell>
                      <TableCell>{r.days_worked ?? "—"}</TableCell>
                      <TableCell className="font-medium">₹{r.amount.toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline">{r.payment_method}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" className="bg-gradient-primary" onClick={() => download(r)}>
                          <Download className="mr-1 h-3 w-3" />PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyPayslips;
