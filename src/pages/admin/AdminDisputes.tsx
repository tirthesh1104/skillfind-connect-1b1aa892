import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { AlertTriangle, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { toast } from "sonner";

const AdminDisputes = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<any | null>(null);
  const [resolution, setResolution] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("disputes")
      .select("*, raiser:profiles!disputes_raised_by_fkey(full_name), against:profiles!disputes_against_user_fkey(full_name)")
      .order("created_at", { ascending: false });
    // fallback: relations may not be defined; try simpler select
    if (!data) {
      const r2 = await supabase.from("disputes").select("*").order("created_at", { ascending: false });
      setRows(r2.data ?? []);
    } else {
      setRows(data);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resolve = async (status: "resolved" | "rejected") => {
    if (!active) return;
    const { error } = await supabase
      .from("disputes")
      .update({ status, admin_resolution: resolution })
      .eq("id", active.id);
    if (error) return toast.error(error.message);
    toast.success(`Dispute ${status}`);
    setActive(null);
    setResolution("");
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Disputes</h1>
        <p className="text-sm text-muted-foreground">Review and resolve wage disputes.</p>
      </div>
      <div className="glass-card overflow-hidden">
        {loading ? <div className="space-y-2 p-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        : rows.length === 0 ? <EmptyState icon={AlertTriangle} title="No disputes" />
        : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Raised by</TableHead><TableHead>Against</TableHead><TableHead>Claimed</TableHead><TableHead>Agreed</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.raiser?.full_name ?? d.raised_by?.slice(0, 8)}</TableCell>
                    <TableCell>{d.against?.full_name ?? d.against_user?.slice(0, 8)}</TableCell>
                    <TableCell>₹ {d.amount_claimed?.toLocaleString("en-IN")}</TableCell>
                    <TableCell>₹ {d.amount_agreed?.toLocaleString("en-IN")}</TableCell>
                    <TableCell><span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs capitalize">{d.status}</span></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(d.created_at), "PP")}</TableCell>
                    <TableCell className="text-right">
                      {d.status === "open" && (
                        <Button variant="ghost" size="sm" onClick={() => setActive(d)}>Review</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => { if (!o) { setActive(null); setResolution(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resolve dispute</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">{active?.description ?? "No description"}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Claimed</p><p className="font-bold">₹ {active?.amount_claimed?.toLocaleString("en-IN")}</p></div>
              <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Agreed</p><p className="font-bold">₹ {active?.amount_agreed?.toLocaleString("en-IN")}</p></div>
            </div>
            <Textarea placeholder="Resolution notes..." value={resolution} onChange={(e) => setResolution(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => resolve("rejected")}><X className="mr-2 h-4 w-4" />Reject</Button>
            <Button onClick={() => resolve("resolved")}><Check className="mr-2 h-4 w-4" />Resolve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDisputes;
