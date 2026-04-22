import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox, Check, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const ContractorRequests = () => {
  const { user } = useAuth();
  const [contractorId, setContractorId] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"incoming" | "outgoing">("outgoing");

  const load = async (cid?: string) => {
    const id = cid ?? contractorId;
    if (!id) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("requests")
      .select("id, status, created_at, initiated_by, message, labour_id, labour:labour_profiles(skill, user_id, profiles:profiles!inner(full_name)), job:jobs(title)")
      .eq("contractor_id", id)
      .order("created_at", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("contractor_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (data) { setContractorId(data.id); load(data.id); } else setLoading(false);
    })();
    // eslint-disable-next-line
  }, [user]);

  const visible = rows.filter((r) => (tab === "incoming" ? r.initiated_by === "labour" : r.initiated_by === "contractor"));

  const respond = async (r: any, status: "accepted" | "rejected") => {
    const { error } = await supabase.from("requests").update({ status }).eq("id", r.id);
    if (error) return toast.error(error.message);
    if (status === "accepted" && contractorId) {
      const { data: cp } = await supabase.from("contractor_profiles").select("total_hired_today").eq("id", contractorId).maybeSingle();
      await supabase.from("contractor_profiles").update({ total_hired_today: (cp?.total_hired_today ?? 0) + 1 }).eq("id", contractorId);
    }
    await supabase.from("notifications").insert({
      user_id: r.labour.user_id,
      type: status,
      message: status === "accepted" ? `Your application was accepted!` : `Your application was rejected.`,
    });
    toast.success(`Request ${status}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Requests</h1>
        <p className="text-sm text-muted-foreground">Manage incoming applications and outgoing hire requests.</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList><TabsTrigger value="incoming">Incoming</TabsTrigger><TabsTrigger value="outgoing">Outgoing</TabsTrigger></TabsList>
        <TabsContent value={tab} className="mt-4">
          <div className="glass-card overflow-hidden">
            {loading ? (
              <div className="space-y-2 p-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : visible.length === 0 ? (
              <EmptyState icon={Inbox} title="No requests" description={tab === "incoming" ? "No labour has applied yet." : "You haven't sent any requests."} />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Labour</TableHead><TableHead>Skill</TableHead><TableHead>Job</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {visible.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.labour?.profiles?.full_name}</TableCell>
                        <TableCell>{r.labour?.skill}</TableCell>
                        <TableCell>{r.job?.title ?? "—"}</TableCell>
                        <TableCell>{format(new Date(r.created_at), "PP")}</TableCell>
                        <TableCell><StatusBadge status={r.status} /></TableCell>
                        <TableCell className="text-right">
                          {r.status === "pending" && tab === "incoming" && (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => respond(r, "accepted")}><Check className="h-3 w-3" /></Button>
                              <Button size="sm" variant="outline" className="border-destructive/50 text-destructive" onClick={() => respond(r, "rejected")}><X className="h-3 w-3" /></Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContractorRequests;
