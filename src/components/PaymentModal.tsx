import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Smartphone, QrCode, CreditCard, ArrowLeft, Download, CheckCircle, XCircle } from "lucide-react";
import { ReceiptModal, ReceiptData } from "./ReceiptModal";

export interface PaymentTarget {
  labour_payment_id: string;
  labour_id: string;
  labour_name: string;
  upi_id: string | null;
  skill?: string | null;
  days_worked: number;
  amount: number;
  contractor_id: string;
  contractor_name: string;
}

type Step = "choose" | "upi" | "qr" | "razorpay" | "confirm";

export const PaymentModal = ({ open, onOpenChange, target, onPaid }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target: PaymentTarget | null;
  onPaid?: () => void;
}) => {
  const [step, setStep] = useState<Step>("choose");
  const [method, setMethod] = useState<string>("UPI");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  if (!target) return null;

  const upiUri = (scheme = "upi") =>
    `${scheme}://pay?pa=${encodeURIComponent(target.upi_id || "")}&pn=${encodeURIComponent(target.labour_name)}&am=${target.amount}&cu=INR&tn=Wage+Payment`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri())}`;

  const openApp = (scheme: string) => {
    window.location.href = upiUri(scheme);
    setTimeout(() => setStep("confirm"), 1500);
  };

  const reset = () => { setStep("choose"); };

  const markPaid = async () => {
    const ref = `${method}-${Date.now()}`;

    const { data: ph, error: e1 } = await supabase.from("payment_history").insert({
      labour_payment_id: target.labour_payment_id,
      labour_id: target.labour_id,
      contractor_id: target.contractor_id,
      amount: target.amount,
      payment_method: method,
      payment_reference: ref,
    }).select().single();
    if (e1) return toast.error(e1.message);

    const { error: e2 } = await supabase.from("labour_payments")
      .update({ status: "Paid" })
      .eq("id", target.labour_payment_id);
    if (e2) return toast.error(e2.message);

    const receiptNo = `LC-${Date.now()}`;
    const { data: rec, error: e3 } = await supabase.from("payment_receipts").insert({
      receipt_number: receiptNo,
      payment_history_id: ph.id,
      labour_id: target.labour_id,
      contractor_id: target.contractor_id,
      contractor_name: target.contractor_name,
      labour_name: target.labour_name,
      skill: target.skill ?? null,
      days_worked: target.days_worked,
      amount: target.amount,
      payment_method: method,
      upi_id: target.upi_id,
      payment_reference: ref,
    }).select().single();
    if (e3) return toast.error(e3.message);

    await supabase.from("notifications").insert([{
      user_id: target.labour_id,
      title: "💸 Payment Received",
      message: `₹${target.amount} received from ${target.contractor_name}`,
      type: "system" as const,
    }]);

    setReceipt({
      receipt_number: rec.receipt_number,
      created_at: rec.created_at,
      payment_reference: rec.payment_reference,
      labour_name: rec.labour_name || target.labour_name,
      skill: rec.skill,
      upi_id: rec.upi_id,
      days_worked: rec.days_worked,
      amount: rec.amount,
      payment_method: rec.payment_method,
      contractor_name: rec.contractor_name || target.contractor_name,
      labour_id: target.labour_id,
    });
    toast.success("✅ Payment recorded!");
    onOpenChange(false);
    setShowReceipt(true);
    onPaid?.();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>💰 Confirm Payment</DialogTitle></DialogHeader>

          <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
            <Row label="Worker" value={target.labour_name} />
            {target.skill && <Row label="Skill" value={target.skill} />}
            <Row label="Days" value={String(target.days_worked)} />
            <Row label="Amount" value={`₹${target.amount.toLocaleString()}`} bold />
            <Row label="UPI ID" value={target.upi_id || "—"} />
          </div>

          {step === "choose" && (
            <div className="grid gap-2">
              <p className="text-sm font-medium">Choose Payment Method:</p>
              <Button variant="outline" onClick={() => { setMethod("UPI"); setStep("upi"); }}><Smartphone className="mr-2 h-4 w-4" />UPI Apps</Button>
              <Button variant="outline" onClick={() => { setMethod("QR"); setStep("qr"); }}><QrCode className="mr-2 h-4 w-4" />QR Code</Button>
              <Button variant="outline" onClick={() => { setMethod("Razorpay"); setStep("razorpay"); }}><CreditCard className="mr-2 h-4 w-4" />Razorpay</Button>
            </div>
          )}

          {step === "upi" && (
            <div className="grid gap-2">
              <Button className="justify-start bg-green-600 hover:bg-green-700" onClick={() => openApp("tez")}>🟢 Google Pay</Button>
              <Button className="justify-start bg-purple-600 hover:bg-purple-700" onClick={() => openApp("phonepe")}>🟣 PhonePe</Button>
              <Button className="justify-start bg-blue-600 hover:bg-blue-700" onClick={() => openApp("paytmmp")}>🔵 Paytm</Button>
              <Button variant="outline" className="justify-start" onClick={() => openApp("upi")}>⚪ Any UPI App</Button>
              <Button variant="ghost" size="sm" onClick={reset}><ArrowLeft className="mr-1 h-4 w-4" />Back</Button>
            </div>
          )}

          {step === "qr" && (
            <div className="space-y-3 text-center">
              <img src={qrUrl} alt="UPI QR" className="mx-auto rounded-lg border" />
              <p className="text-sm font-medium">{target.labour_name} — ₹{target.amount}</p>
              <p className="text-xs text-muted-foreground">Scan with GPay / PhonePe / Paytm / any UPI app</p>
              <Button variant="outline" size="sm" asChild>
                <a href={qrUrl} download={`UPI_QR_${target.labour_name}.png`}><Download className="mr-1 h-4 w-4" />Download QR</a>
              </Button>
              <Button className="w-full" onClick={() => setStep("confirm")}>I've Scanned — Continue</Button>
              <Button variant="ghost" size="sm" onClick={reset}><ArrowLeft className="mr-1 h-4 w-4" />Back</Button>
            </div>
          )}

          {step === "razorpay" && (
            <div className="space-y-3 text-center">
              <p className="text-sm">Razorpay checkout will open here.</p>
              <Button className="w-full" onClick={() => setStep("confirm")}>Simulate Razorpay Success</Button>
              <Button variant="ghost" size="sm" onClick={reset}><ArrowLeft className="mr-1 h-4 w-4" />Back</Button>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-3">
              <p className="text-center font-medium">Did payment go through?</p>
              <div className="grid grid-cols-2 gap-2">
                <Button className="bg-green-600 hover:bg-green-700" onClick={markPaid}><CheckCircle className="mr-1 h-4 w-4" />Yes — Mark Paid</Button>
                <Button variant="outline" onClick={reset}><XCircle className="mr-1 h-4 w-4" />No — Try Again</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ReceiptModal open={showReceipt} onOpenChange={setShowReceipt} receipt={receipt} />
    </>
  );
};

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className={`flex justify-between ${bold ? "font-bold" : ""}`}>
    <span className="text-muted-foreground">{label}</span>
    <span>{value}</span>
  </div>
);
