import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifiedContractorBadge } from "@/components/VerifiedContractorBadge";
import { ShieldCheck, Upload, FileCheck2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_TEXT: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending review", cls: "border-amber-500/30 bg-amber-500/15 text-amber-400" },
  verified: { label: "Verified", cls: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400" },
  rejected: { label: "Rejected — please resubmit", cls: "border-red-500/30 bg-red-500/15 text-red-400" },
};

const BusinessVerification = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [reg, setReg] = useState("");
  const [gst, setGst] = useState("");
  const [status, setStatus] = useState("pending");
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("contractor_profiles")
        .select("id, business_registration_number, gst_number, kyc_status, kyc_document_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setProfileId(data.id);
        setReg(data.business_registration_number ?? "");
        setGst(data.gst_number ?? "");
        setStatus(data.kyc_status ?? "pending");
        setDocUrl(data.kyc_document_url ?? null);
      }
      setLoading(false);
    })();
  }, [user]);

  const submit = async () => {
    if (!user || !profileId) return;
    if (!reg.trim()) return toast.error("Business registration number is required");
    setSaving(true);
    let url = docUrl;
    try {
      if (file) {
        const path = `${user.id}/kyc/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage.from("documents").createSignedUrl(path, 60 * 60 * 24 * 365);
        url = signed?.signedUrl ?? null;
      }
      const { error } = await supabase
        .from("contractor_profiles")
        .update({
          business_registration_number: reg.trim(),
          gst_number: gst.trim() || null,
          kyc_document_url: url,
          kyc_status: "pending",
        })
        .eq("id", profileId);
      if (error) throw error;
      setStatus("pending");
      setDocUrl(url);
      setFile(null);
      toast.success("Submitted for review");
    } catch (e: any) {
      toast.error(e.message ?? "Could not submit");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-72" />;

  const s = STATUS_TEXT[status] ?? STATUS_TEXT.pending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl">
          Business Verification <VerifiedContractorBadge status={status} />
        </h1>
        <p className="text-sm text-muted-foreground">
          Verified contractors earn worker trust and get more applications.
        </p>
      </div>

      <div className={`glass-card flex items-center gap-3 border p-4 text-sm ${s.cls}`}>
        <ShieldCheck className="h-5 w-5 shrink-0" />
        <span>Current status: <strong>{s.label}</strong></span>
      </div>

      <div className="glass-card space-y-4 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-xs">Business Registration Number *</Label>
            <Input value={reg} onChange={(e) => setReg(e.target.value)} placeholder="e.g. UDYAM-MH-00-1234567" />
          </div>
          <div>
            <Label className="text-xs">GST Number (optional)</Label>
            <Input value={gst} onChange={(e) => setGst(e.target.value)} placeholder="27ABCDE1234F1Z5" />
          </div>
        </div>

        <div>
          <Label className="text-xs">Proof Document (registration / GST certificate)</Label>
          <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          {docUrl && !file && (
            <a href={docUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-accent underline">
              <FileCheck2 className="h-3 w-3" /> View uploaded document
            </a>
          )}
        </div>

        <Button onClick={submit} disabled={saving} className="bg-gradient-primary">
          <Upload className="mr-2 h-4 w-4" />
          {saving ? "Submitting..." : "Submit for verification"}
        </Button>
      </div>
    </div>
  );
};

export default BusinessVerification;
