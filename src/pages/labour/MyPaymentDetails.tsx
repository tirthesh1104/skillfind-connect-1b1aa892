import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Save, Pencil, IdCard } from "lucide-react";

const SKILLS = ["Mason", "Carpenter", "Electrician", "Plumber", "Painter", "Welder", "Helper", "Driver", "General"];

const MyPaymentDetails = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    // Personal
    full_name: "", phone: "", date_of_birth: "", address: "", profile_photo_url: "",
    // Skill
    skill: "", experience_years: "", price_per_day: "",
    // Payment
    upi_id: "", account_holder_name: "", bank_name: "", account_number: "", ifsc_code: "", bank_branch: "",
    // Identity
    aadhaar_last4: "", eshram_number: "",
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("profiles")
        .select("full_name, phone, date_of_birth, address, profile_photo_url, upi_id, account_holder_name, bank_name, account_number, ifsc_code, bank_branch, aadhaar_last4, eshram_number, profile_complete")
        .eq("id", user.id).maybeSingle();
      const { data: lp } = await supabase.from("labour_profiles")
        .select("skill, experience_years, price_per_day").eq("user_id", user.id).maybeSingle();
      setForm({
        full_name: p?.full_name ?? "",
        phone: p?.phone ?? "",
        date_of_birth: p?.date_of_birth ?? "",
        address: p?.address ?? "",
        profile_photo_url: p?.profile_photo_url ?? "",
        skill: lp?.skill ?? "",
        experience_years: lp?.experience_years?.toString() ?? "",
        price_per_day: lp?.price_per_day?.toString() ?? "",
        upi_id: p?.upi_id ?? "",
        account_holder_name: p?.account_holder_name ?? "",
        bank_name: p?.bank_name ?? "",
        account_number: p?.account_number ?? "",
        ifsc_code: p?.ifsc_code ?? "",
        bank_branch: p?.bank_branch ?? "",
        aadhaar_last4: p?.aadhaar_last4 ?? "",
        eshram_number: p?.eshram_number ?? "",
      });
      if (!p?.profile_complete) setEditing(true);
      setLoading(false);
    })();
  }, [user]);

  const upiValid = /^[\w.-]+@[\w.-]+$/.test(form.upi_id);

  const uploadPhoto = async (file: File) => {
    if (!user) return;
    const path = `${user.id}/photo-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("documents").getPublicUrl(path);
    setForm({ ...form, profile_photo_url: data.publicUrl });
    toast.success("Photo uploaded");
  };

  const save = async () => {
    if (!user) return;
    if (!form.full_name.trim()) return toast.error("Full name required");
    if (!form.phone.trim()) return toast.error("Phone required");
    if (!form.upi_id.trim() || !upiValid) return toast.error("Valid UPI ID required (e.g. name@paytm)");

    setSaving(true);
    const idCardNumber = `LC-${user.id.slice(0, 8).toUpperCase()}`;

    const { error: e1 } = await supabase.from("profiles").update({
      full_name: form.full_name,
      phone: form.phone,
      date_of_birth: form.date_of_birth || null,
      address: form.address,
      profile_photo_url: form.profile_photo_url || null,
      upi_id: form.upi_id,
      account_holder_name: form.account_holder_name,
      bank_name: form.bank_name,
      account_number: form.account_number,
      ifsc_code: form.ifsc_code,
      bank_branch: form.bank_branch,
      aadhaar_last4: form.aadhaar_last4 ? form.aadhaar_last4.slice(-4) : null,
      eshram_number: form.eshram_number || null,
      payment_details_updated_at: new Date().toISOString(),
      id_card_number: idCardNumber,
      id_card_generated_at: new Date().toISOString(),
      profile_complete: true,
    }).eq("id", user.id);

    if (form.skill) {
      await supabase.from("labour_profiles").upsert({
        user_id: user.id,
        skill: form.skill,
        experience_years: parseInt(form.experience_years || "0") || 0,
        price_per_day: parseInt(form.price_per_day || "0") || 0,
      }, { onConflict: "user_id" });
    }

    setSaving(false);
    if (e1) return toast.error(e1.message);
    toast.success("✅ Profile complete! Your ID Card is ready.");
    setEditing(false);
    setTimeout(() => navigate("/my-id-card"), 600);
  };

  if (loading) return <Skeleton className="h-96" />;

  const maskedAcc = form.account_number ? `XXXX XXXX ${form.account_number.slice(-4)}` : "—";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">💳 My Profile & Payment Details</h1>
        <p className="text-sm text-muted-foreground">Complete your profile to generate your ID Card and receive payments.</p>
      </div>

      {editing && (
        <div className="flex gap-2 rounded-lg border border-orange-300 bg-orange-50 dark:bg-orange-950/30 p-3 text-sm">
          <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0" />
          <div>
            <p className="font-medium text-orange-900 dark:text-orange-200">⚠️ Fill your details to get your ID Card and receive payments.</p>
            <p className="text-orange-800 dark:text-orange-300">All fields with * are required.</p>
          </div>
        </div>
      )}

      {!editing ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" /> Profile Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Name" value={form.full_name} />
            <Row label="Phone" value={form.phone} />
            <Row label="Skill" value={form.skill || "—"} />
            <Row label="UPI ID" value={form.upi_id} />
            <Row label="Bank" value={form.bank_name || "—"} />
            <Row label="Account" value={maskedAcc} />
            <Row label="IFSC" value={form.ifsc_code || "—"} />
            <Row label="Aadhaar" value={form.aadhaar_last4 ? `XXXX-XXXX-${form.aadhaar_last4}` : "—"} />
            <div className="flex flex-wrap gap-2 pt-3">
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="mr-1 h-4 w-4" /> Edit
              </Button>
              <Button size="sm" className="bg-gradient-primary" onClick={() => navigate("/my-id-card")}>
                <IdCard className="mr-1 h-4 w-4" /> View My ID Card
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Section title="👤 Personal">
            <Field label="Full Name *"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
            <Field label="Phone *"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Date of Birth"><Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} /></Field>
            <Field label="Profile Photo">
              <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
              {form.profile_photo_url && <img src={form.profile_photo_url} alt="" className="mt-2 h-20 w-20 rounded object-cover" />}
            </Field>
            <Field label="Address" full><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          </Section>

          <Section title="🛠️ Skill">
            <Field label="Primary Skill">
              <Select value={form.skill} onValueChange={(v) => setForm({ ...form, skill: v })}>
                <SelectTrigger><SelectValue placeholder="Select skill" /></SelectTrigger>
                <SelectContent>{SKILLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Experience (years)"><Input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} /></Field>
            <Field label="Daily Wage Expected ₹"><Input type="number" value={form.price_per_day} onChange={(e) => setForm({ ...form, price_per_day: e.target.value })} /></Field>
          </Section>

          <Section title="💰 Payment">
            <Field label="UPI ID *" full>
              <Input placeholder="yourname@paytm" value={form.upi_id}
                onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
                className={form.upi_id ? (upiValid ? "border-green-500" : "border-red-500") : ""} />
              {form.upi_id && (
                <p className={`text-xs mt-1 ${upiValid ? "text-green-600" : "text-red-600"}`}>
                  {upiValid ? "✅ UPI ID format valid" : "❌ Invalid UPI ID. Example: name@paytm"}
                </p>
              )}
            </Field>
            <Field label="Account Holder Name"><Input value={form.account_holder_name} onChange={(e) => setForm({ ...form, account_holder_name: e.target.value })} /></Field>
            <Field label="Bank Name"><Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} /></Field>
            <Field label="Account Number"><Input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} /></Field>
            <Field label="IFSC Code"><Input value={form.ifsc_code} onChange={(e) => setForm({ ...form, ifsc_code: e.target.value })} /></Field>
            <Field label="Bank Branch"><Input value={form.bank_branch} onChange={(e) => setForm({ ...form, bank_branch: e.target.value })} /></Field>
          </Section>

          <Section title="🪪 Identity">
            <Field label="Aadhaar Number (last 4 stored only)">
              <Input maxLength={12} value={form.aadhaar_last4} onChange={(e) => setForm({ ...form, aadhaar_last4: e.target.value.replace(/\D/g, "") })} />
            </Field>
            <Field label="e-Shram Card Number (optional)"><Input value={form.eshram_number} onChange={(e) => setForm({ ...form, eshram_number: e.target.value })} /></Field>
          </Section>

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="bg-gradient-primary">
              <Save className="mr-1 h-4 w-4" />{saving ? "Saving..." : "Save & Generate ID Card"}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </>
      )}
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card>
    <CardHeader className="pb-3"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
    <CardContent className="grid gap-4 md:grid-cols-2">{children}</CardContent>
  </Card>
);

const Field = ({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) => (
  <div className={full ? "md:col-span-2" : ""}>
    <Label>{label}</Label>
    {children}
  </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between border-b last:border-0 py-1">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default MyPaymentDetails;
