import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  againstUserId: string;
  agreementId?: string;
  agreedAmount?: number;
  trigger?: React.ReactNode;
}

export const RaiseDisputeDialog = ({ againstUserId, agreementId, agreedAmount = 0, trigger }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [claimed, setClaimed] = useState("");
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (!claimed) return toast.error("Enter the claimed amount");
    setSubmitting(true);
    const { error } = await supabase.from("disputes").insert({
      raised_by: user.id,
      against_user: againstUserId,
      agreement_id: agreementId ?? null,
      amount_claimed: parseInt(claimed, 10),
      amount_agreed: agreedAmount,
      description: desc,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Dispute raised. Admin will review.");
    setOpen(false);
    setClaimed(""); setDesc("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline" size="sm"><AlertTriangle className="mr-2 h-4 w-4" />Raise dispute</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Raise a wage dispute</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Amount you should be paid (₹)</Label>
            <Input type="number" inputMode="numeric" value={claimed} onChange={(e) => setClaimed(e.target.value)} placeholder="e.g. 12000" />
          </div>
          <div>
            <Label>What happened?</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Describe the dispute..." rows={4} />
          </div>
          {agreedAmount > 0 && (
            <p className="text-xs text-muted-foreground">Agreed amount on file: ₹ {agreedAmount.toLocaleString("en-IN")}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? "Submitting..." : "Submit dispute"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
