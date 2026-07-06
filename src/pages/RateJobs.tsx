import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { RatingDialog } from "@/components/RatingDialog";
import { generateCompletionCertificate } from "@/lib/completionCertificate";
import { Award } from "lucide-react";
import { toast } from "sonner";

const RateJobs = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<"labour" | "contractor" | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [rating, setRating] = useState<{ userId: string; name: string; jobId: string; role: "worker_rating_contractor" | "contractor_rating_worker" } | null>(null);

  const load = async () => {
    if (!user) return;
    const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    const rr = (r?.role === "contractor" ? "contractor" : "labour");
    setRole(rr);

    if (rr === "contractor") {
      const { data: cp } = await supabase.from("contractor_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (!cp) return;
      const { data: jobs } = await supabase.from("jobs").select("id, title, start_date, duration_days, location, required_skill").eq("contractor_id", cp.id).eq("status", "closed").order("updated_at", { ascending: false }).limit(30);
      const jobIds = (jobs || []).map((j: any) => j.id);
      if (!jobIds.length) { setItems([]); return; }
      const { data: reqs } = await supabase.from("requests").select("job_id, labour_id, status").in("job_id", jobIds).eq("status", "accepted");
      const labourIds = Array.from(new Set((reqs || []).map((x: any) => x.labour_id)));
      const { data: lps } = labourIds.length ? await supabase.from("labour_profiles").select("id, user_id").in("id", labourIds) : { data: [] };
      const lpMap = new Map((lps || []).map((l: any) => [l.id, l.user_id]));
      const userIds = Array.from(new Set(Array.from(lpMap.values())));
      const { data: profs } = userIds.length ? await supabase.from("profiles").select("id, full_name").in("id", userIds) : { data: [] };
      const nameMap = new Map((profs || []).map((p: any) => [p.id, p.full_name]));
      const { data: existing } = await supabase.from("ratings").select("given_to, job_id").eq("given_by", user.id).in("job_id", jobIds);
      const rated = new Set((existing || []).map((e: any) => `${e.job_id}:${e.given_to}`));
      const rows: any[] = [];
      (jobs || []).forEach((j: any) => {
        (reqs || []).filter((rq: any) => rq.job_id === j.id).forEach((rq: any) => {
          const uid = lpMap.get(rq.labour_id);
          if (!uid) return;
          rows.push({ job: j, workerId: uid, workerName: nameMap.get(uid) || "Worker", rated: rated.has(`${j.id}:${uid}`) });
        });
      });
      setItems(rows);
    } else {
      const { data: lp } = await supabase.from("labour_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (!lp) return;
      const { data: reqs } = await supabase.from("requests").select("job_id, status").eq("labour_id", lp.id).eq("status", "accepted");
      const jobIds = (reqs || []).map((r: any) => r.job_id).filter(Boolean);
      if (!jobIds.length) { setItems([]); return; }
      const { data: jobs } = await supabase.from("jobs").select("id, title, contractor_id, status").in("id", jobIds).eq("status", "closed");
      const contractorIds = Array.from(new Set((jobs || []).map((j: any) => j.contractor_id)));
      const { data: cps } = contractorIds.length ? await supabase.from("contractor_profiles").select("id, user_id, company_name").in("id", contractorIds) : { data: [] };
      const cpMap = new Map((cps || []).map((c: any) => [c.id, c]));
      const { data: existing } = await supabase.from("ratings").select("given_to, job_id").eq("given_by", user.id).in("job_id", (jobs || []).map((j: any) => j.id));
      const rated = new Set((existing || []).map((e: any) => `${e.job_id}:${e.given_to}`));
      setItems((jobs || []).map((j: any) => {
        const cp = cpMap.get(j.contractor_id);
        return { job: j, contractorUserId: cp?.user_id, contractorName: cp?.company_name || "Contractor", rated: cp ? rated.has(`${j.id}:${cp.user_id}`) : true };
      }).filter((x: any) => x.contractorUserId));
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const issueCertificate = async (row: any) => {
    // contractor issues cert for worker
    const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", user!.id).maybeSingle();
    const certNo = `LC-${Date.now().toString(36).toUpperCase()}`;
    const end = row.job.start_date ? new Date(row.job.start_date) : new Date();
    end.setDate(end.getDate() + (row.job.duration_days || 1) - 1);
    const payload = {
      job_id: row.job.id,
      worker_id: row.workerId,
      contractor_id: user!.id,
      certificate_number: certNo,
      job_title: row.job.title,
      site_name: row.job.location,
      start_date: row.job.start_date,
      end_date: end.toISOString().slice(0, 10),
      skills: row.job.required_skill,
      contractor_name: prof?.full_name || "Contractor",
      worker_name: row.workerName,
    };
    const { error } = await supabase.from("completion_certificates").insert(payload);
    if (error) return toast.error(error.message);
    generateCompletionCertificate({ ...payload, issued_at: new Date().toISOString() } as any);
    toast.success("Certificate issued");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Rate & Certify</h1>
        <p className="text-sm text-muted-foreground">Completed jobs waiting for your review.</p>
      </div>
      {items.length === 0 ? <EmptyState icon={Star} title="Nothing to rate" description="Closed jobs will appear here." /> : (
        <div className="space-y-2">
          {items.map((row, i) => (
            <div key={i} className="glass-card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-semibold">{row.job.title}</p>
                <p className="text-xs text-muted-foreground">
                  {role === "contractor" ? `Worker: ${row.workerName}` : `Contractor: ${row.contractorName}`}
                </p>
              </div>
              <div className="flex gap-2">
                {role === "contractor" && (
                  <Button size="sm" variant="outline" onClick={() => issueCertificate(row)}>
                    <Award className="mr-1 h-3 w-3" /> Issue Certificate
                  </Button>
                )}
                <Button size="sm" disabled={row.rated} onClick={() => setRating(
                  role === "contractor"
                    ? { userId: row.workerId, name: row.workerName, jobId: row.job.id, role: "contractor_rating_worker" }
                    : { userId: row.contractorUserId, name: row.contractorName, jobId: row.job.id, role: "worker_rating_contractor" }
                )}>
                  <Star className="mr-1 h-3 w-3" /> {row.rated ? "Rated" : "Rate"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {rating && (
        <RatingDialog
          open={!!rating}
          onOpenChange={(v) => !v && setRating(null)}
          jobId={rating.jobId}
          ratedUserId={rating.userId}
          ratedUserName={rating.name}
          role={rating.role}
          onSaved={load}
        />
      )}
    </div>
  );
};

export default RateJobs;
