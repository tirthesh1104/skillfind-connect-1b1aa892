import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Camera, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

interface Proof {
  id: string;
  job_id: string | null;
  uploaded_by: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  status: string;
  created_at: string;
}

const ProofFeed = () => {
  const { user, role } = useAuth();
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [signed, setSigned] = useState<Record<string, string>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [jobId, setJobId] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const canUpload = role === "labour" || role === "contractor";
  const canVerify = role === "contractor" || role === "admin";

  const loadJobs = async () => {
    if (!user) return;
    if (role === "contractor") {
      const { data: cp } = await supabase.from("contractor_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (!cp) return;
      const { data } = await supabase.from("jobs").select("id, title").eq("contractor_id", cp.id).order("created_at", { ascending: false });
      setJobs(data ?? []);
    } else if (role === "labour") {
      const { data: lp } = await supabase.from("labour_payments").select("job_id").eq("labour_id", user.id);
      const ids = Array.from(new Set((lp ?? []).map((r: any) => r.job_id).filter(Boolean)));
      if (!ids.length) return;
      const { data } = await supabase.from("jobs").select("id, title").in("id", ids as string[]);
      setJobs(data ?? []);
    } else {
      const { data } = await supabase.from("jobs").select("id, title").order("created_at", { ascending: false }).limit(100);
      setJobs(data ?? []);
    }
  };

  const load = async () => {
    const { data } = await supabase
      .from("site_proofs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60);
    const list = (data ?? []) as Proof[];
    setProofs(list);

    const urls: Record<string, string> = {};
    await Promise.all(
      list.map(async (p) => {
        const { data: s } = await supabase.storage.from("site-proofs").createSignedUrl(p.media_url, 3600);
        if (s?.signedUrl) urls[p.id] = s.signedUrl;
      })
    );
    setSigned(urls);

    const ids = Array.from(new Set(list.map((p) => p.uploaded_by)));
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
    loadJobs();
    load();
    const channel = supabase
      .channel("proof-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_proofs" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role]);

  const upload = async () => {
    if (!user || !file) return toast.error("Photo select kara");
    setBusy(true);
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("site-proofs").upload(path, file);
    if (upErr) {
      setBusy(false);
      return toast.error(upErr.message);
    }
    const { error } = await supabase.from("site_proofs").insert({
      uploaded_by: user.id,
      job_id: jobId || null,
      media_url: path,
      media_type: file.type.startsWith("video") ? "video" : "image",
      caption: caption || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setFile(null);
    setCaption("");
    toast.success("Proof upload झाले");
    load();
  };

  const setStatus = async (p: Proof, status: "verified" | "rejected") => {
    const { error } = await supabase
      .from("site_proofs")
      .update({ status, verified_by: user?.id, verified_at: new Date().toISOString() })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    await supabase.from("audit_log").insert({
      actor_id: user?.id,
      action: `proof_${status}`,
      entity: "site_proofs",
      entity_id: p.id,
      details: p.caption ?? null,
    });
    toast.success(status === "verified" ? "Verified ✅" : "Rejected");
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Site Proof Timeline</h1>
        <p className="text-sm text-muted-foreground">फोटो पुरावा — worker uploads, contractor verifies, client views.</p>
      </div>

      {canUpload && (
        <div className="glass-card space-y-4 p-4 md:p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Site / Job</Label>
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                <SelectContent>
                  {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Caption</Label>
              <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Aaj ka kaam..." />
            </div>
            <div className="space-y-1.5">
              <Label>Photo / Video</Label>
              <Input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <Button onClick={upload} disabled={busy || !file}>
            <Camera className="mr-2 h-4 w-4" /> {busy ? "Uploading…" : "Upload Proof"}
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : proofs.length === 0 ? (
        <EmptyState icon={Camera} title="No proof uploaded yet" description="Site photos will appear here as a live timeline." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {proofs.map((p) => (
            <div key={p.id} className="glass-card overflow-hidden p-0">
              {signed[p.id] ? (
                p.media_type === "video" ? (
                  <video src={signed[p.id]} controls className="h-48 w-full bg-black object-cover" />
                ) : (
                  <img src={signed[p.id]} alt={p.caption ?? "Site proof"} loading="lazy" className="h-48 w-full object-cover" />
                )
              ) : (
                <div className="h-48 w-full bg-secondary" />
              )}
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{names[p.uploaded_by] ?? "User"}</p>
                  <Badge variant={p.status === "verified" ? "default" : p.status === "rejected" ? "destructive" : "secondary"} className="capitalize">
                    {p.status}
                  </Badge>
                </div>
                {p.caption && <p className="text-xs text-muted-foreground">{p.caption}</p>}
                <p className="text-[11px] text-muted-foreground">{format(new Date(p.created_at), "dd MMM yyyy, p")}</p>
                {canVerify && p.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => setStatus(p, "verified")}>
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Verify
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setStatus(p, "rejected")}>
                      <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProofFeed;
