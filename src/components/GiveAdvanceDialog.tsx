import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { IndianRupee } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workerId: string;
  workerName: string;
  onDone?: () => void;
}

export const GiveAdvanceDialog = ({ open, onOpenChange, workerId, workerName, onDone }: Props) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState(1000);
  const [reason, setReason] = useState("");
  const [repayType, setRepayType] = useState<"one-time" | "weekly" | "monthly">("one-time");
  const [installment, setInstallment] = useState(500);
  const [weeks, setWeeks] = useState(2);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user || amount <= 0) return;
    setBusy(true);
    const { error } = await supabase.from("advances" as any).insert({
      worker_id: workerId,
      contractor_id: user.id,
      amount,
      reason,
      repayment_type: repayType,
      installment_amount: repayType === "one-time" ? amount : installment,
      weeks: repayType === "one-time" ? 1 : weeks,
      balance: amount,
      status: "pending",
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Advance of ₹${amount} sent to ${workerName} for approval`);
    onOpenChange(false);
    onDone?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><IndianRupee className="h-5 w-5"/> Give Advance to {workerName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div><Label>Amount (₹)</Label><Input type="number" value={amount} onChange={e=>setAmount(Number(e.target.value))} /></div>
          <div><Label>Reason</Label><Textarea rows={2} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Emergency, festival, medical..." /></div>
          <div>
            <Label>Repayment Type</Label>
            <Select value={repayType} onValueChange={(v: any) => setRepayType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="one-time">One-time deduction</SelectItem>
                <SelectItem value="weekly">Weekly installments</SelectItem>
                <SelectItem value="monthly">Monthly installments</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {repayType !== "one-time" && (
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Installment (₹)</Label><Input type="number" value={installment} onChange={e=>setInstallment(Number(e.target.value))} /></div>
              <div><Label>No. of {repayType === "weekly" ? "weeks" : "months"}</Label><Input type="number" value={weeks} onChange={e=>setWeeks(Number(e.target.value))} /></div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Worker must digitally accept these terms before the advance is active.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Sending..." : "Send for Approval"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
