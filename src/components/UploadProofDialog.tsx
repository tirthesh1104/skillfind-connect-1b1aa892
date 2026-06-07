import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Upload, Camera } from "lucide-react";

export const UploadProofDialog = ({
  open, onOpenChange, payment_history_id, labour_payment_id, contractor_id, labour_id, labour_name, amount, onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  payment_history_id?: string | null;
  labour_payment_id?: string | null;
  contractor_id: string;
  labour_id: string;
  labour_name?: string;
  amount?: number;
  onDone?: () => void;
}) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user || !file) return toast.error("Please select a file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5 MB");
    setBusy(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, file, { upsert: false });
    if (upErr) { setBusy(false); return toast.error(upErr.message); }
    const { data: signed } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 60 * 60 * 24 * 365);
    const proofUrl = signed?.signedUrl || path;

    const { error } = await supabase.from("payment_proofs").insert({
      payment_history_id: payment_history_id ?? null,
      labour_payment_id: labour_payment_id ?? null,
      contractor_id, labour_id, proof_url: proofUrl,
      proof_type: file.type.startsWith("image") ? "image" : "pdf",
      amount: amount ?? null, note,
    });
    if (error) { setBusy(false); return toast.error(error.message); }

    await supabase.from("notifications").insert({
      user_id: labour_id,
      title: "📸 Payment Proof Uploaded",
      message: `${labour_name || "Contractor"} uploaded proof for ₹${amount?.toLocaleString() ?? "your payment"}. Confirm receipt in My Receipts.`,
      type: "system" as const,
    });

    setBusy(false);
    toast.success("✅ Proof uploaded — worker notified");
    setFile(null); setNote("");
    onOpenChange(false);
    onDone?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>📸 Upload Payment Proof</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Attach a screenshot of the UPI confirmation. Worker will be notified to confirm.
          </p>
          <div>
            <Label>Screenshot / PDF (max 5 MB)</Label>
            <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          {file?.type.startsWith("image") && (
            <img src={URL.createObjectURL(file)} alt="" className="max-h-48 mx-auto rounded border" />
          )}
          <div>
            <Label>Note (optional)</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. UTN 123456789" />
          </div>
          <div className="flex gap-2">
            <Button onClick={submit} disabled={!file || busy} className="flex-1 bg-gradient-primary">
              <Upload className="mr-1 h-4 w-4" />{busy ? "Uploading..." : "Upload Proof"}
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Skip</Button>
          </div>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Camera className="h-3 w-3" />Stored privately; only worker & admin can view.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
