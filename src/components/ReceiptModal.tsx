import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share2, Mail, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface ReceiptData {
  receipt_number: string;
  created_at: string;
  payment_reference?: string | null;
  labour_name: string;
  skill?: string | null;
  upi_id?: string | null;
  days_worked?: number | null;
  amount: number;
  payment_method: string;
  contractor_name: string;
  labour_id: string;
}

export const ReceiptModal = ({ open, onOpenChange, receipt }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  receipt: ReceiptData | null;
}) => {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text = `Payment Receipt ${receipt.receipt_number}\nPaid ₹${receipt.amount} to ${receipt.labour_name} on ${new Date(receipt.created_at).toLocaleString()}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Payment Receipt", text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Receipt copied to clipboard!");
    }
  };

  const handleSendToLabour = async () => {
    const { error } = await supabase.from("notifications").insert([{
      user_id: receipt.labour_id,
      title: "🧾 Payment Receipt",
      message: `Your payment receipt is ready. ₹${receipt.amount} received on ${new Date(receipt.created_at).toLocaleDateString()}`,
      type: "system" as const,
    }]);
    if (error) return toast.error(error.message);
    toast.success(`✅ Receipt sent to ${receipt.labour_name}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <div className="receipt-print p-6">
          <div className="text-center border-b pb-3 mb-3">
            <h2 className="text-xl font-bold">🧾 PAYMENT RECEIPT</h2>
            <p className="text-xs text-muted-foreground">Labour Connector Platform</p>
          </div>
          <div className="space-y-1 text-sm">
            <Row label="Receipt No" value={receipt.receipt_number} />
            <Row label="Date" value={new Date(receipt.created_at).toLocaleString()} />
            {receipt.payment_reference && <Row label="Payment ID" value={receipt.payment_reference} />}
          </div>
          <div className="mt-3 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">PAID TO</p>
            <Row label="Name" value={receipt.labour_name} />
            {receipt.skill && <Row label="Skill" value={receipt.skill} />}
            {receipt.upi_id && <Row label="UPI ID" value={receipt.upi_id} />}
            {!!receipt.days_worked && <Row label="Days" value={String(receipt.days_worked)} />}
          </div>
          <div className="mt-3 border-t pt-3 bg-muted/30 -mx-6 px-6 py-3">
            <Row label="AMOUNT" value={`₹${receipt.amount.toLocaleString()}`} bold />
            <Row label="Method" value={receipt.payment_method} />
            <Row label="Status" value="✅ PAID" />
          </div>
          <div className="mt-3 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">PAID BY</p>
            <Row label="Name" value={receipt.contractor_name} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 p-4 border-t no-print">
          <Button variant="outline" size="sm" onClick={handlePrint}><Download className="mr-1 h-4 w-4" />PDF</Button>
          <Button variant="outline" size="sm" onClick={handleShare}><Share2 className="mr-1 h-4 w-4" />Share</Button>
          <Button variant="outline" size="sm" onClick={handleSendToLabour}><Mail className="mr-1 h-4 w-4" />Send</Button>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}><X className="mr-1 h-4 w-4" />Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className={`flex justify-between gap-3 ${bold ? "font-bold text-base" : ""}`}>
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right">{value}</span>
  </div>
);
