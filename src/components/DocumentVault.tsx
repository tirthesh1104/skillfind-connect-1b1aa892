import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileCheck2, FileX2, Upload, Trash2, Download, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const DOC_TYPES = [
  { key: "aadhaar", label: "Aadhaar Card" },
  { key: "pan", label: "PAN Card" },
  { key: "skill_certificate", label: "Skill Certificate" },
  { key: "bank_passbook", label: "Bank Passbook" },
];

interface DocRow { id: string; doc_type: string; file_path: string; file_name: string; }

export const DocumentVault = () => {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("documents").select("*").eq("user_id", user.id);
    setDocs((data ?? []) as DocRow[]);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const upload = async (docType: string, file: File) => {
    if (!user) return;
    setUploading(docType);
    const path = `${user.id}/${docType}-${Date.now()}-${file.name}`;
    const existing = docs.find((d) => d.doc_type === docType);
    if (existing) {
      await supabase.storage.from("documents").remove([existing.file_path]);
      await supabase.from("documents").delete().eq("id", existing.id);
    }
    const { error: upErr } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); setUploading(null); return; }
    const { error: insErr } = await supabase.from("documents").insert({ user_id: user.id, doc_type: docType, file_path: path, file_name: file.name });
    if (insErr) toast.error(insErr.message);
    else toast.success("Document uploaded");
    setUploading(null);
    load();
  };

  const remove = async (d: DocRow) => {
    await supabase.storage.from("documents").remove([d.file_path]);
    await supabase.from("documents").delete().eq("id", d.id);
    toast.success("Removed");
    load();
  };

  const download = async (d: DocRow) => {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(d.file_path, 60);
    if (error || !data) return toast.error("Could not generate link");
    window.open(data.signedUrl, "_blank");
  };

  const hasAadhaar = docs.some((d) => d.doc_type === "aadhaar");

  return (
    <div className="glass-card space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Document Vault</h2>
          <p className="text-xs text-muted-foreground">Private. Only you and admins can access.</p>
        </div>
        {hasAadhaar && (
          <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600">
            <ShieldCheck className="h-3 w-3" /> Verified
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {DOC_TYPES.map((t) => {
          const existing = docs.find((d) => d.doc_type === t.key);
          return (
            <div key={t.key} className="rounded-xl border border-border p-4">
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-sm font-medium">{t.label}</Label>
                {existing ? (
                  <span className="flex items-center gap-1 text-xs text-green-600"><FileCheck2 className="h-3 w-3" />Uploaded</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><FileX2 className="h-3 w-3" />Missing</span>
                )}
              </div>
              {existing && <p className="mb-2 truncate text-xs text-muted-foreground">{existing.file_name}</p>}
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    disabled={uploading === t.key}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(t.key, f); e.target.value = ""; }}
                  />
                  <Button asChild size="sm" variant="outline">
                    <span><Upload className="mr-1 h-3 w-3" />{existing ? "Replace" : "Upload"}</span>
                  </Button>
                </label>
                {existing && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => download(existing)}><Download className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(existing)} className="text-destructive"><Trash2 className="h-3 w-3" /></Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
