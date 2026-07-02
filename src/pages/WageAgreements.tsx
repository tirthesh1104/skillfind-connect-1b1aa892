import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSignature, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function WageAgreements() {
  const { user, role } = useAuth();
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    if (!user) return;
    const col = role === "contractor" ? "contractor_id" : "labour_id";
    const { data } = await supabase.from("wage_agreements").select("*").eq(col, user.id).order("created_at", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, [user, role]);

  const confirm = async (row: any) => {
    const patch = role === "contractor"
      ? { contractor_confirmed: true }
      : { labour_confirmed: true };
    const { error } = await supabase.from("wage_agreements").update(patch).eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Agreement confirmed");
    load();
  };

  const dispute = async (row: any) => {
    const { error } = await supabase.from("wage_agreements").update({ is_disputed: true }).eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Marked as disputed — admin will review");
    load();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><FileSignature className="h-7 w-7 text-primary" /> Wage Agreements</h1>
        <p className="text-muted-foreground text-sm mt-1">Both parties must confirm terms before work starts. Prevents disputes.</p>
      </div>

      {rows.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No agreements yet.</CardContent></Card>
      ) : rows.map(r => (
        <Card key={r.id}>
          <CardHeader className="flex-row items-start justify-between">
            <CardTitle className="text-base">₹{r.agreed_wage}/day · {r.agreed_duration_days} days</CardTitle>
            <Badge variant={r.is_disputed ? "destructive" : r.contractor_confirmed && r.labour_confirmed ? "default" : "secondary"}>
              {r.is_disputed ? "Disputed" : r.contractor_confirmed && r.labour_confirmed ? "Signed" : "Pending"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Start: <b>{r.agreed_start_date}</b></div>
              <div>Payment: <b>{r.payment_status}</b></div>
              <div className="flex items-center gap-1">Contractor: {r.contractor_confirmed && <CheckCircle2 className="h-4 w-4 text-green-500" />}</div>
              <div className="flex items-center gap-1">Worker: {r.labour_confirmed && <CheckCircle2 className="h-4 w-4 text-green-500" />}</div>
            </div>
            {!r.is_disputed && !((role === "contractor" ? r.contractor_confirmed : r.labour_confirmed)) && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => confirm(r)}>Confirm Terms</Button>
                <Button size="sm" variant="outline" onClick={() => dispute(r)}>Raise Dispute</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
