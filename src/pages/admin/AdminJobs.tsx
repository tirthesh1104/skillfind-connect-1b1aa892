import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { Briefcase, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const AdminJobs = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("jobs")
      .select("*, contractor:contractor_profiles(company_name)")
      .order("created_at", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const close = async (id: string) => {
    const { error } = await supabase.from("jobs").update({ status: "closed" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Job closed"); load();
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Job deleted"); load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Manage Jobs</h1>
      </div>
      <div className="glass-card overflow-hidden">
        {loading ? <div className="space-y-2 p-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        : rows.length === 0 ? <EmptyState icon={Briefcase} title="No jobs" /> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Contractor</TableHead><TableHead>Skill</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead>Posted</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell className="font-medium">{j.title}</TableCell>
                    <TableCell>{j.contractor?.company_name}</TableCell>
                    <TableCell>{j.required_skill}</TableCell>
                    <TableCell>Rs. {j.price_offered}</TableCell>
                    <TableCell><StatusBadge status={j.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(j.created_at), "PP")}</TableCell>
                    <TableCell className="text-right">
                      {j.status === "open" && <Button variant="ghost" size="sm" onClick={() => close(j.id)}><X className="h-3 w-3" /></Button>}
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(j.id)}><Trash2 className="h-3 w-3" /></Button>
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

export default AdminJobs;
