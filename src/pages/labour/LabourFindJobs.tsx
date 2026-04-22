import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { SKILL_OPTIONS, skillBadgeClass } from "@/lib/labour";
import { Search, Briefcase, Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const LabourFindJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [labourId, setLabourId] = useState<string | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: lp } = await supabase.from("labour_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (lp) {
        setLabourId(lp.id);
        const { data: applied } = await supabase.from("requests").select("job_id").eq("labour_id", lp.id);
        setAppliedJobIds(new Set((applied ?? []).map((r) => r.job_id).filter(Boolean) as string[]));
      }
      const { data } = await supabase
        .from("jobs")
        .select("id, title, work_type, required_skill, location, price_offered, status, created_at, contractor_id, contractor:contractor_profiles!inner(id, user_id, company_name, profiles:profiles!inner(full_name))")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      setJobs(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  const filtered = useMemo(() => jobs.filter((j) => {
    if (skillFilter !== "all" && j.required_skill !== skillFilter) return false;
    if (j.price_offered < priceRange[0] || j.price_offered > priceRange[1]) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!j.title.toLowerCase().includes(q) && !j.location.toLowerCase().includes(q) && !j.contractor?.company_name?.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [jobs, search, skillFilter, priceRange]);

  const apply = async (j: any) => {
    if (!labourId) return toast.error("Profile not found");
    const { error } = await supabase.from("requests").insert({
      contractor_id: j.contractor.id, labour_id: labourId, job_id: j.id,
      status: "pending", initiated_by: "labour",
    });
    if (error) return toast.error(error.message);
    await supabase.from("notifications").insert({
      user_id: j.contractor.user_id, type: "request",
      message: `New application for "${j.title}".`,
    });
    toast.success("Application sent!");
    setAppliedJobIds((s) => new Set([...s, j.id]));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Find Jobs</h1>
        <p className="text-sm text-muted-foreground">Browse open opportunities from contractors.</p>
      </div>

      <div className="glass-card grid gap-4 p-4 md:grid-cols-3">
        <div>
          <Label className="text-xs">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title, contractor, location" className="pl-9" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Skill</Label>
          <Select value={skillFilter} onValueChange={setSkillFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skills</SelectItem>
              {SKILL_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Price Rs. {priceRange[0]} – {priceRange[1]}</Label>
          <Slider min={0} max={2000} step={50} value={priceRange} onValueChange={(v) => setPriceRange(v as [number, number])} className="mt-3" />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Briefcase} title="No jobs match your filters" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Job</TableHead><TableHead>Contractor</TableHead><TableHead>Skill</TableHead><TableHead>Location</TableHead><TableHead>Price</TableHead><TableHead>Posted</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((j) => {
                  const applied = appliedJobIds.has(j.id);
                  return (
                    <TableRow key={j.id}>
                      <TableCell className="font-medium">{j.title}</TableCell>
                      <TableCell>{j.contractor?.company_name}</TableCell>
                      <TableCell><span className={cn("rounded-full border px-2 py-0.5 text-xs", skillBadgeClass(j.required_skill))}>{j.required_skill}</span></TableCell>
                      <TableCell>{j.location}</TableCell>
                      <TableCell className="font-semibold text-accent">Rs. {j.price_offered}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(j.created_at), "PP")}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" className="bg-gradient-primary" disabled={applied} onClick={() => apply(j)}>
                          <Send className="mr-1 h-3 w-3" />{applied ? "Applied" : "Apply"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabourFindJobs;
