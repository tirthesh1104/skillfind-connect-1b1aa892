import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download } from "lucide-react";
import { getSignedLetterUrl } from "@/lib/appointmentLetter";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

interface Letter {
  id: string;
  worker_id: string;
  contractor_id: string;
  content_json: any;
  pdf_url: string;
  status: string;
  created_at: string;
}

const MyDocuments = () => {
  const { user, role } = useAuth();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const key = role === "labour" ? "worker_id" : "contractor_id";
      const { data } = await supabase
        .from("appointment_letters" as any)
        .select("*")
        .eq(key, user.id)
        .order("created_at", { ascending: false });
      setLetters((data as any) ?? []);
      setLoading(false);
    })();
  }, [user, role]);

  const download = async (path: string) => {
    const url = await getSignedLetterUrl(path);
    if (url) window.open(url, "_blank");
  };

  if (loading) return <Skeleton className="h-40" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My Documents</h1>
        <p className="text-sm text-muted-foreground">Appointment letters and compliance documents.</p>
      </div>

      {letters.length === 0 ? (
        <EmptyState icon={FileText} title="No documents yet" description="Appointment letters will appear here once generated." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {letters.map(l => (
            <Card key={l.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{l.content_json?.role ?? "Appointment Letter"}</CardTitle>
                  <Badge variant={l.status === "signed" ? "default" : "outline"}>{l.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</p>
                <p>Wage: ₹{l.content_json?.wagePerDay ?? "—"}/day</p>
                <p className="truncate">Site: {l.content_json?.siteAddress ?? "—"}</p>
                <Button size="sm" variant="outline" className="w-full" onClick={() => download(l.pdf_url)}>
                  <Download className="mr-2 h-3 w-3" /> Download
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDocuments;
