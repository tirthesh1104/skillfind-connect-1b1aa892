import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, Share2, FileText } from "lucide-react";
import { ReceiptModal, ReceiptData } from "@/components/ReceiptModal";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";

const MyReceipts = () => {
  const { user, role } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ReceiptData | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      let q = supabase.from("payment_receipts").select("*").order("created_at", { ascending: false });
      if (role === "labour") q = q.eq("labour_id", user.id);
      else if (role === "contractor") q = q.eq("contractor_id", user.id);
      const { data } = await q;
      setRows(data ?? []);
      setLoading(false);
    })();
  }, [user, role]);

  const view = (r: any) => {
    setActive({ ...r, labour_id: r.labour_id });
    setOpen(true);
  };

  const share = async (r: any) => {
    const text = `Receipt ${r.receipt_number}: ₹${r.amount} on ${new Date(r.created_at).toLocaleString()}`;
    if (navigator.share) { try { await navigator.share({ title: "Receipt", text }); } catch {} }
    else { await navigator.clipboard.writeText(text); toast.success("Copied!"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">🧾 My Receipts</h1>
        <p className="text-sm text-muted-foreground">All payments received from contractors.</p>
      </div>

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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{r.contractor_name || "—"}</TableCell>
                      <TableCell className="font-medium">₹{r.amount.toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline">{r.payment_method}</Badge></TableCell>
                      <TableCell><Badge>✅ Paid</Badge></TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => view(r)}><Eye className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => { view(r); setTimeout(() => window.print(), 300); }}><Download className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => share(r)}><Share2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
