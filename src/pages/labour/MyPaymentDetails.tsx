import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Save, Pencil } from "lucide-react";

const MyPaymentDetails = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    upi_id: "", account_holder_name: "", bank_name: "",
    account_number: "", ifsc_code: "",
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles")
        .select("upi_id, account_holder_name, bank_name, account_number, ifsc_code")
        .eq("id", user.id).maybeSingle();
      if (data) {
        setForm({
          upi_id: data.upi_id ?? "",
          account_holder_name: data.account_holder_name ?? "",
          bank_name: data.bank_name ?? "",
          account_number: data.account_number ?? "",
          ifsc_code: data.ifsc_code ?? "",
        });
        if (!data.upi_id) setEditing(true);
      } else {
        setEditing(true);
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    if (!form.upi_id.trim()) return toast.error("UPI ID is required");
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      ...form,
      payment_details_updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("✅ Payment details saved! Contractor can now pay you.");
    setEditing(false);
  };

  if (loading) return <Skeleton className="h-96" />;

  const hasUpi = !!form.upi_id;
  const maskedAcc = form.account_number ? `XXXX XXXX ${form.account_number.slice(-4)}` : "—";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">💳 My Payment Details</h1>
        <p className="text-sm text-muted-foreground">Add your UPI/Bank info so contractors can pay you directly.</p>
      </div>

      {!hasUpi && (
        <div className="flex gap-2 rounded-lg border border-orange-300 bg-orange-50 dark:bg-orange-950/30 p-3 text-sm">
          <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0" />
          <div>
            <p className="font-medium text-orange-900 dark:text-orange-200">Payment details missing!</p>
            <p className="text-orange-800 dark:text-orange-300">Add your UPI ID so contractor can pay you.</p>
          </div>
        </div>
      )}

      {hasUpi && !editing ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" /> Payment Details Saved
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="UPI ID" value={form.upi_id} />
            <Row label="Account Holder" value={form.account_holder_name || "—"} />
            <Row label="Bank" value={form.bank_name || "—"} />
            <Row label="Account" value={maskedAcc} />
            <Row label="IFSC" value={form.ifsc_code || "—"} />
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="mt-3">
              <Pencil className="mr-1 h-4 w-4" /> Edit Details
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>UPI ID *</Label>
              <Input placeholder="yourname@paytm" value={form.upi_id}
                onChange={(e) => setForm({ ...form, upi_id: e.target.value })} />
            </div>
            <div>
              <Label>Account Holder Name</Label>
              <Input value={form.account_holder_name} onChange={(e) => setForm({ ...form, account_holder_name: e.target.value })} />
            </div>
            <div>
              <Label>Bank Name</Label>
              <Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} />
            </div>
            <div>
              <Label>IFSC Code</Label>
              <Input value={form.ifsc_code} onChange={(e) => setForm({ ...form, ifsc_code: e.target.value })} />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button onClick={save} disabled={saving} className="bg-gradient-primary">
                <Save className="mr-1 h-4 w-4" />{saving ? "Saving..." : "Save Details"}
              </Button>
              {hasUpi && <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between border-b last:border-0 py-1">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default MyPaymentDetails;
