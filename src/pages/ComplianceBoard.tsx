import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { ShieldCheck, Upload, AlertTriangle } from "lucide-react";
import { differenceInDays, format } from "date-fns";

const DOC_TYPES = [
  "Aadhaar",
  "PAN",
  "Bank Passbook",
  "Safety Training",
  "ESIC",
  "PF (UAN)",
  "Labour Licence",
  "Insurance Policy",
  "Medical Fitness",
];

interface Doc {
  id: string;
  user_id: string;
  doc_type: string;
  doc_number: string | null;
  file_url: string | null;
  issued_on: string | null;
  expires_on: string | null;
  status: string;
  created_at: string;
}

const docState = (d: Doc) => {
  if (d.expires_on) {
    const days = differenceInDays(new Date(d.expires_on), new Date());
    if (days < 0) return { label: "Expired", tone: "destructive" as const };
    if (days <= 30) return { label: `Expiring in ${days}d`, tone: "secondary" as const };
  }
  if (d.status === "verified") return { label: "Verified", tone: "default" as const };
  if (d.status === "rejected") return { label: "Rejected", tone: "destructive" as const };
  return { label: "Pending", tone: "secondary" as const };
};

const ComplianceBoard = () => {
  const { user, role } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [docNumber, setDocNumber] = useState("");
  const [expires, setExpires] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const canReview = role === "contractor" || role === "admin";

  const load = async () => {
    const { data } = await supabase
      .from("compliance_docs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    const list = (data ?? []) as Doc[];
    setDocs(list);
    const ids = Array.from(new Set(list.map((d) => d.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      const map: Record<string, string> = {};
      (profs ?? []).forEach((p: any) => (map[p.id] = p.full_name));
      setNames(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const channel = supabase
      .channel("compliance-board")
      .on("postgres_changes", { event: "*", schema: "public", table: "compliance_docs" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    let path: string | null = null;
    if (file) {
      path = `${user.id}/compliance/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
      if (upErr) {
        setBusy(false);
        return toast.error(upErr.message);
      }
    }
    const { error } = await supabase.from("compliance_docs").insert({
      user_id: user.id,
      doc_type: docType,
      doc_number: docNumber || null,
      file_url: path,
      expires_on: expires || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setDocNumber("");
    setExpires("");
    setFile(null);
    toast.success("Document जोडले");
    load();
  };

  const review = async (d: Doc, status: "verified" | "rejected") => {
    const { error } = await supabase.from("compliance_docs").update({ status }).eq("id", d.id);
    if (error) return toast.error(error.message);
    await supabase.from("audit_log").insert({
      actor_id: user?.id,
      action: `compliance_${status}`,
      entity: "compliance_docs",
      entity_id: d.id,
      details: `${d.doc_type} — ${names[d.user_id] ?? d.user_id}`,
    });
    load();
  };

  const total = docs.length;
  const ok = docs.filter((d) => d.status === "verified" && (!d.expires_on || new Date(d.expires_on) > new Date())).length;
  const expiring = docs.filter((d) => d.expires_on && differenceInDays(new Date(d.expires_on), new Date()) <= 30).length;
  const score = total ? Math.round((ok / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Compliance Board</h1>
        <p className="text-sm text-muted-foreground">कागदपत्रे, वैधता आणि साइट compliance score.</p>
      </div>

      <div className="glass-card space-y-3 p-6">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-primary" /> Compliance Score
          </p>
          <span className="text-2xl font-bold">{score}%</span>
        </div>
        <Progress value={score} />
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>{ok} verified</span>
          <span>{total - ok} pending / invalid</span>
          {expiring > 0 && (
            <span className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" /> {expiring} expiring soon
            </span>
          )}
        </div>
      </div>

      <div className="glass-card space-y-4 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Document type</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Number (optional)</Label>
            <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="XXXX-XXXX" />
          </div>
          <div className="space-y-1.5">
            <Label>Expiry date</Label>
            <Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>File</Label>
            <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <Button onClick={submit} disabled={busy}>
          <Upload className="mr-2 h-4 w-4" /> {busy ? "Saving…" : "Add Document"}
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : docs.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No documents yet" description="Add Aadhaar, safety training or licence records to build your compliance score." />
      ) : (
        <div className="glass-card overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Person</th>
                <th className="p-3">Document</th>
                <th className="p-3">Number</th>
                <th className="p-3">Expiry</th>
                <th className="p-3">Status</th>
                {canReview && <th className="p-3">Action</th>}
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => {
                const s = docState(d);
                return (
                  <tr key={d.id} className="border-b border-border/50">
                    <td className="p-3">{names[d.user_id] ?? "User"}</td>
                    <td className="p-3">{d.doc_type}</td>
                    <td className="p-3 text-muted-foreground">{d.doc_number ?? "—"}</td>
                    <td className="p-3 text-muted-foreground">{d.expires_on ? format(new Date(d.expires_on), "dd MMM yyyy") : "—"}</td>
                    <td className="p-3"><Badge variant={s.tone}>{s.label}</Badge></td>
                    {canReview && (
                      <td className="p-3">
                        {d.status === "pending" ? (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => review(d, "verified")}>Verify</Button>
                            <Button size="sm" variant="outline" onClick={() => review(d, "rejected")}>Reject</Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground capitalize">{d.status}</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ComplianceBoard;
