import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Camera, Upload, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Proof {
  id: string;
  job_id: string | null;
  stage: string;
  photo_url: string;
  caption: string | null;
  uploaded_by: string;
  uploaded_at: string;
}

/**
 * Before/After work photo proof.
 * Workers upload a start photo and a completion photo per job.
 * Contractors and admins see both side by side for their jobs.
 */
const WorkProof = () => {
  const { user, role } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobId, setJobId] = useState<string>("");
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [caption, setCaption] = useState("");

  const isWorker = role === "labour";

  useEffect(() => {
    if (!user) return;
    (async () => {
      let list: any[] = [];
      if (isWorker) {
        const { data: lp } = await supabase.from("labour_profiles").select("id").eq("user_id", user.id).maybeSingle();
        if (lp) {
          const { data } = await supabase
            .from("requests")
            .select("job:jobs(id, title, location)")
            .eq("labour_id", lp.id)
            .eq("status", "accepted");
          list = (data ?? []).map((r: any) => r.job).filter(Boolean);
        }
      } else if (role === "contractor") {
        const { data: cp } = await supabase.from("contractor_profiles").select("id").eq("user_id", user.id).maybeSingle();
        if (cp) {
          const { data } = await supabase.from("jobs").select("id, title, location").eq("contractor_id", cp.id).order("created_at", { ascending: false });
          list = data ?? [];
        }
      } else {
        const { data } = await supabase.from("jobs").select("id, title, location").order("created_at", { ascending: false }).limit(100);
        list = data ?? [];
      }
      const unique = Array.from(new Map(list.map((j) => [j.id, j])).values());
      setJobs(unique);
      if (unique[0]) setJobId(unique[0].id);
      setLoading(false);
    })();
  }, [user, role, isWorker]);

  const loadProofs = async (id: string) => {
    if (!id) return setProofs([]);
    const { data } = await supabase.from("job_work_proof").select("*").eq("job_id", id).order("uploaded_at", { ascending: true });
    setProofs((data ?? []) as Proof[]);
  };

  useEffect(() => { loadProofs(jobId); }, [jobId]);

  const upload = async (stage: "before" | "after", file: File | null) => {
    if (!file || !user || !jobId) return;
    setBusy(true);
    try {
      const path = `${user.id}/work-proof/${jobId}-${stage}-${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error: upErr } = await supabase.storage.from("site-proofs").upload(path, file);
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from("site-proofs").createSignedUrl(path, 60 * 60 * 24 * 365);
      const { error } = await supabase.from("job_work_proof").insert({
        job_id: jobId,
        stage,
        photo_url: signed?.signedUrl ?? path,
        caption: caption.trim() || null,
        uploaded_by: user.id,
      });
      if (error) throw error;
      setCaption("");
      toast.success(stage === "before" ? "Start photo uploaded" : "Completion photo uploaded");
      loadProofs(jobId);
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const column = (stage: "before" | "after", title: string) => {
    const items = proofs.filter((p) => p.stage === stage);
    return (
      <div className="glass-card space-y-3 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
        {items.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-xs text-muted-foreground">
            <ImageOff className="h-5 w-5" /> No photo yet
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {items.map((p) => (
              <a key={p.id} href={p.photo_url} target="_blank" rel="noreferrer" className="group block">
                <img src={p.photo_url} alt={p.caption ?? title} loading="lazy" className="h-32 w-full rounded-lg object-cover transition-opacity group-hover:opacity-80" />
                <p className="mt-1 truncate text-[10px] text-muted-foreground">
                  {p.caption ? `${p.caption} · ` : ""}{format(new Date(p.uploaded_at), "PP p")}
                </p>
              </a>
            ))}
          </div>
        )}
        {isWorker && (
          <label className="block">
            <span className="sr-only">Upload {title}</span>
            <Input type="file" accept="image/*" capture="environment" disabled={busy || !jobId}
              onChange={(e) => upload(stage, e.target.files?.[0] ?? null)} />
          </label>
        )}
      </div>
    );
  };

  if (loading) return <Skeleton className="h-72" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Before / After Work Proof</h1>
        <p className="text-sm text-muted-foreground">
          {isWorker ? "Upload a start photo when work begins and a completion photo when you finish." : "Visual proof of work for each job — also shown alongside dispute evidence."}
        </p>
      </div>

      {jobs.length === 0 ? (
        <EmptyState icon={Camera} title="No jobs yet" description={isWorker ? "Accepted jobs appear here." : "Post a job to collect work proof."} />
      ) : (
        <>
          <div className="glass-card grid gap-4 p-4 md:grid-cols-2">
            <div>
              <Label className="text-xs">Job</Label>
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger><SelectValue placeholder="Select a job" /></SelectTrigger>
                <SelectContent>
                  {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title} — {j.location}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {isWorker && (
              <div>
                <Label className="text-xs">Caption (optional)</Label>
                <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="e.g. Ground floor slab" />
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {column("before", "Before — Start of work")}
            {column("after", "After — Work completed")}
          </div>

          {isWorker && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Upload className="h-3 w-3" /> Photos are private to you, your contractor and admins.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default WorkProof;
