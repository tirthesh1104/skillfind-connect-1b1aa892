import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { SKILL_OPTIONS, skillBadgeClass } from "@/lib/labour";
import { Search, MapPin, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Labour {
  id: string;
  user_id: string;
  skill: string;
  price_per_day: number;
  experience_years: number;
  is_available: boolean;
  bio: string | null;
  profile: { full_name: string; location: string | null; profile_image_url: string | null };
}

const FindLabour = () => {
  const { user } = useAuth();
  const [labours, setLabours] = useState<Labour[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [contractor, setContractor] = useState<{ id: string; max_labour_per_day: number; total_hired_today: number } | null>(null);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Labour | null>(null);

  const load = async () => {
    setLoading(true);
    if (user) {
      const { data: cp } = await supabase.from("contractor_profiles").select("id, max_labour_per_day, total_hired_today").eq("user_id", user.id).maybeSingle();
      setContractor(cp);
      if (cp) {
        const { data: reqs } = await supabase.from("requests").select("labour_id").eq("contractor_id", cp.id).in("status", ["pending", "accepted"]);
        setRequestedIds(new Set((reqs ?? []).map((r) => r.labour_id)));
      }
    }
    const { data } = await supabase
      .from("labour_profiles")
      .select("id, user_id, skill, price_per_day, experience_years, is_available, bio, profile:profiles!inner(full_name, location, profile_image_url)")
      .order("created_at", { ascending: false });
    setLabours((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const filtered = useMemo(() => {
    return labours.filter((l) => {
      if (onlyAvailable && !l.is_available) return false;
      if (skillFilter !== "all" && l.skill !== skillFilter) return false;
      if (l.price_per_day < priceRange[0] || l.price_per_day > priceRange[1]) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!l.profile.full_name.toLowerCase().includes(q) && !l.skill.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [labours, search, skillFilter, priceRange, onlyAvailable]);

  const sendRequest = async (l: Labour) => {
    if (!contractor) return toast.error("Contractor profile missing");
    if (contractor.total_hired_today >= contractor.max_labour_per_day) {
      return toast.error(`Daily hire limit reached (${contractor.max_labour_per_day}). Try again tomorrow.`);
    }
    const { error } = await supabase.from("requests").insert({
      contractor_id: contractor.id, labour_id: l.id, status: "pending", initiated_by: "contractor",
    });
    if (error) return toast.error(error.message);
    await supabase.from("notifications").insert({
      user_id: l.user_id, type: "request",
      message: `You have a new hire request from a contractor for ${l.skill} work.`,
    });
    toast.success(`Request sent to ${l.profile.full_name}!`);
    setRequestedIds((s) => new Set([...s, l.id]));
    setSelected(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Find Labour</h1>
          <p className="text-sm text-muted-foreground">Browse skilled workers ready to hire.</p>
        </div>
        {contractor && (
          <div className="rounded-xl border border-border bg-card/60 px-4 py-2 text-sm">
            Hired today: <span className="font-bold text-accent">{contractor.total_hired_today}</span> / {contractor.max_labour_per_day}
          </div>
        )}
      </div>

      <div className="glass-card grid gap-4 p-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <Label className="text-xs">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or skill..." className="pl-9" />
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
        <div className="flex items-center gap-3 pt-5">
          <Switch id="avail" checked={onlyAvailable} onCheckedChange={setOnlyAvailable} />
          <Label htmlFor="avail" className="cursor-pointer text-sm">Only available</Label>
        </div>
        <div className="md:col-span-4">
          <Label className="text-xs">Price range: Rs. {priceRange[0]} – Rs. {priceRange[1]} / day</Label>
          <Slider min={0} max={2000} step={50} value={priceRange} onValueChange={(v) => setPriceRange(v as [number, number])} className="mt-2" />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No labourers found" description="Try adjusting your filters." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => {
            const requested = requestedIds.has(l.id);
            return (
              <div key={l.id} className="glass-card group p-5 transition-all hover:-translate-y-1 hover:border-accent/50 hover:shadow-glow">
                <div className="flex items-start gap-3">
                  <InitialsAvatar name={l.profile.full_name} src={l.profile.profile_image_url} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold">{l.profile.full_name}</p>
                      {l.is_available && <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgb(52,211,153)]" />}
                    </div>
                    <span className={cn("mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide", skillBadgeClass(l.skill))}>
                      {l.skill}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <p className="font-bold text-accent">Rs. {l.price_per_day}<span className="text-xs font-normal text-muted-foreground">/day</span></p>
                  <p className="text-xs text-muted-foreground">{l.experience_years} yrs exp</p>
                </div>
                {l.profile.location && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {l.profile.location}
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelected(l)}>View</Button>
                  <Button size="sm" className="flex-1 bg-gradient-primary" disabled={requested || !l.is_available} onClick={() => sendRequest(l)}>
                    <Send className="mr-1 h-3 w-3" />{requested ? "Sent" : "Request"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Labour Profile</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-4">
                <InitialsAvatar name={selected.profile.full_name} src={selected.profile.profile_image_url} size="xl" />
                <div>
                  <p className="text-lg font-bold">{selected.profile.full_name}</p>
                  <span className={cn("mt-1 inline-block rounded-full border px-2 py-0.5 text-xs", skillBadgeClass(selected.skill))}>{selected.skill}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-secondary/50 p-3"><p className="text-xs text-muted-foreground">Price/Day</p><p className="font-semibold">Rs. {selected.price_per_day}</p></div>
                <div className="rounded-lg bg-secondary/50 p-3"><p className="text-xs text-muted-foreground">Experience</p><p className="font-semibold">{selected.experience_years} years</p></div>
                {selected.profile.location && <div className="col-span-2 rounded-lg bg-secondary/50 p-3"><p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />Location</p><p className="font-semibold">{selected.profile.location}</p></div>}
                {/* Phone hidden — contact happens after request is accepted */}
              </div>
              {selected.bio && <p className="text-sm text-muted-foreground">{selected.bio}</p>}
              <Button className="w-full bg-gradient-primary" disabled={requestedIds.has(selected.id) || !selected.is_available} onClick={() => sendRequest(selected)}>
                <Send className="mr-2 h-4 w-4" />{requestedIds.has(selected.id) ? "Request Sent" : "Send Request"}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FindLabour;
