import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { Award, Download } from "lucide-react";
import { generateCompletionCertificate } from "@/lib/completionCertificate";

const MyCertificates = () => {
  const { user } = useAuth();
  const [certs, setCerts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("completion_certificates").select("*").or(`worker_id.eq.${user.id},contractor_id.eq.${user.id}`).order("issued_at", { ascending: false }).then(({ data }) => setCerts(data || []));
  }, [user]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My Certificates</h1>
        <p className="text-sm text-muted-foreground">Job completion certificates awarded on Labour Connector.</p>
      </div>
      {certs.length === 0 ? (
        <EmptyState icon={Award} title="No certificates yet" description="Certificates appear here after a contractor closes a job you worked on." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {certs.map((c) => (
            <div key={c.id} className="glass-card flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{c.job_title}</p>
                <p className="text-xs text-muted-foreground">Cert No: {c.certificate_number}</p>
                <p className="text-xs text-muted-foreground">Issued {new Date(c.issued_at).toLocaleDateString()}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => generateCompletionCertificate({
                certificate_number: c.certificate_number,
                worker_name: c.worker_name || "Worker",
                contractor_name: c.contractor_name || "Contractor",
                job_title: c.job_title || "Assignment",
                site_name: c.site_name,
                start_date: c.start_date,
                end_date: c.end_date,
                skills: c.skills,
                issued_at: c.issued_at,
              })}>
                <Download className="mr-1 h-3 w-3" /> PDF
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCertificates;
