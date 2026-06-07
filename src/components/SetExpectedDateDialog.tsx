import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarDays } from "lucide-react";

export const SetExpectedDateDialog = ({ open, onOpenChange, payment, onSaved }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  payment: { id: string; labour_id: string; labour_name?: string; amount_due: number; expected_payment_date?: string | null; payment_promise_note?: string | null } | null;
  onSaved?: () => void;
}) => {
  const [date, setDate] = useState(payment?.expected_payment_date ?? "");
  const [note, setNote] = useState(payment?.payment_promise_note ?? "");
  const [busy, setBusy] = useState(false);
  if (!payment) return null;

  const save = async () => {
    if (!date) return toast.error("Pick a date");
    setBusy(true);
    const { error } = await supabase.from("labour_payments")
      .update({ expected_payment_date: date, payment_promise_note: note || null })
      .eq("id", payment.id);
    if (error) { setBusy(false); return toast.error(error.message); }

    await supabase.from("notifications").insert({
      user_id: payment.labour_id,
      title: "📅 Payment Date Set",
      message: `Your contractor promised ₹${payment.amount_due.toLocaleString()} by ${new Date(date).toLocaleDateString()}${note ? " — " + note : ""}.`,
      type: "system" as const,
    });
    setBusy(false);
    toast.success("Date saved — worker notified");
    onOpenChange(false); onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" />Set Expected Payment Date</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm">For <b>{payment.labour_name}</b> — ₹{payment.amount_due.toLocaleString()}</p>
          <div><Label>Expected Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} /></div>
          <div><Label>Note (optional)</Label><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Will pay after site inspection" /></div>
          <Button onClick={save} disabled={busy} className="w-full bg-gradient-primary">{busy ? "Saving..." : "💾 Save & Notify Worker"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
