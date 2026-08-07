import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Check, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const AdminContractorKyc = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");

  const load = async () => {
    const { data } = await supabase
      .from("contractor_profiles")
      .select("id, user_id, company_name, business_registration_number, gst_number, kyc_status, kyc_document_url, kyc_reviewed_at, created_at")
      .order("created_at", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const decide = async (row: any, kyc_status: "verified" | "rejected") => {
    const { error } = await supabase
      .from("contractor_profiles")
      .update({ kyc_status, kyc_reviewed_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    await supabase.from("notifications").insert({
      user_id: row.user_id,
      type: "system",
      message: kyc_status === "verified"
        ? "Your business verification was approved. The Verified badge is now on your profile."
        : "Your business verification was rejected. Please resubmit with clearer documents.",
    });
    toast.success(kyc_status === "verified" ? "Contractor verified" : "Submission rejected");
    load();
  };

  const submitted = rows.filter((r) => r.business_registration_number);
  const visible = submitted.filter((r) => (r.kyc_status ?? "pending") === tab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Contractor KYC Review</h1>
        <p className="text-sm text-muted-foreground">Approve or reject business verification submissions.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({submitted.filter((r) => (r.kyc_status ?? "pending") === "pending").length})</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : visible.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="Nothing here" description="No submissions with this status." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Registration No.</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Reviewed</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.company_name}</TableCell>
                    <TableCell className="font-mono text-xs">{r.business_registration_number}</TableCell>
                    <TableCell className="font-mono text-xs">{r.gst_number || "—"}</TableCell>
                    <TableCell>
                      {r.kyc_document_url ? (
                        <a href={r.kyc_document_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-accent underline">
                          <FileText className="h-3 w-3" /> Preview
                        </a>
                      ) : <span className="text-xs text-muted-foreground">None</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.kyc_reviewed_at ? format(new Date(r.kyc_reviewed_at), "PP") : "—"}
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      {r.kyc_status !== "verified" && (
                        <Button size="sm" className="bg-gradient-primary" onClick={() => decide(r, "verified")}>
                          <Check className="mr-1 h-3 w-3" />Approve
                        </Button>
                      )}
                      {r.kyc_status !== "rejected" && (
                        <Button size="sm" variant="outline" onClick={() => decide(r, "rejected")}>
                          <X className="mr-1 h-3 w-3" />Reject
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContractorKyc;
