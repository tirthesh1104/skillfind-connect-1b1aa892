import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users, UserCheck, HardHat, Briefcase, FileText, AlertTriangle,
  Star, Shield, Search, MapPin, Phone, Mail, Calendar, IndianRupee,
  TrendingUp, Activity, Eye, BarChart3,
} from "lucide-react";
import { format } from "date-fns";

type Profile = {
  id: string; full_name: string; phone: string | null; location: string | null;
  pin_code: string | null; created_at: string; rating_avg: number; rating_count: number;
  is_available: boolean; profile_image_url: string | null;
};
type Role = "admin" | "contractor" | "labour";

const fmtINR = (n: number | null | undefined) => `₹ ${(n ?? 0).toLocaleString("en-IN")}`;

const AdminHome = () => {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Record<string, Role>>({});
  const [contractors, setContractors] = useState<any[]>([]);
  const [labours, setLabours] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [insurance, setInsurance] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState<Profile | null>(null);

  useEffect(() => {
    (async () => {
      const [p, r, c, l, j, rq, ag, ds, rt, ins] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("contractor_profiles").select("*"),
        supabase.from("labour_profiles").select("*"),
        supabase.from("jobs").select("*").order("created_at", { ascending: false }),
        supabase.from("requests").select("*").order("created_at", { ascending: false }),
        supabase.from("wage_agreements").select("*").order("created_at", { ascending: false }),
        supabase.from("disputes").select("*").order("created_at", { ascending: false }),
        supabase.from("ratings").select("*").order("created_at", { ascending: false }),
        supabase.from("insurance_pool").select("*"),
      ]);
      setProfiles((p.data ?? []) as Profile[]);
      const rmap: Record<string, Role> = {};
      (r.data ?? []).forEach((row: any) => { rmap[row.user_id] = row.role; });
      setRoles(rmap);
      setContractors(c.data ?? []);
      setLabours(l.data ?? []);
      setJobs(j.data ?? []);
      setRequests(rq.data ?? []);
      setAgreements(ag.data ?? []);
      setDisputes(ds.data ?? []);
      setRatings(rt.data ?? []);
      setInsurance(ins.data ?? []);
      setLoading(false);
    })();
  }, []);

  const nameOf = (id?: string | null) => profiles.find((p) => p.id === id)?.full_name ?? "—";
  const contractorById = (id?: string | null) => contractors.find((c) => c.id === id);
  const labourById = (id?: string | null) => labours.find((l) => l.id === id);
  const contractorByUser = (uid: string) => contractors.find((c) => c.user_id === uid);
  const labourByUser = (uid: string) => labours.find((l) => l.user_id === uid);

  const totals = useMemo(() => ({
    users: profiles.length,
    contractors: contractors.length,
    labours: labours.length,
    jobs: jobs.length,
    openJobs: jobs.filter((j) => j.status === "open").length,
    requests: requests.length,
    pendingRequests: requests.filter((r) => r.status === "pending").length,
    agreements: agreements.length,
    disputes: disputes.length,
    openDisputes: disputes.filter((d) => d.status === "open").length,
    insuranceOptIn: insurance.filter((i) => i.is_opted_in).length,
    insurancePool: insurance.reduce((s, i) => s + (i.total_contributed ?? 0), 0),
  }), [profiles, contractors, labours, jobs, requests, agreements, disputes, insurance]);

  const filteredProfiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) =>
      p.full_name.toLowerCase().includes(q) ||
      (p.phone ?? "").toLowerCase().includes(q) ||
      (p.location ?? "").toLowerCase().includes(q)
    );
  }, [profiles, search]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="glass-card relative overflow-hidden p-6 md:p-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-gradient-primary p-3 shadow-glow">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">Admin Command Center</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Full visibility across users, jobs, agreements, disputes, ratings and insurance.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/users"><Button variant="outline" size="sm"><Users className="mr-2 h-4 w-4" />Users</Button></Link>
            <Link to="/admin/jobs"><Button variant="outline" size="sm"><Briefcase className="mr-2 h-4 w-4" />Jobs</Button></Link>
            <Link to="/admin/requests"><Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4" />Requests</Button></Link>
            <Link to="/admin/disputes"><Button variant="outline" size="sm"><AlertTriangle className="mr-2 h-4 w-4" />Disputes</Button></Link>
            <Link to="/admin/analytics"><Button size="sm" className="bg-gradient-primary shadow-glow hover:opacity-90"><BarChart3 className="mr-2 h-4 w-4" />Analytics</Button></Link>
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard icon={Users} label="Total Users" value={totals.users} accent="primary" />
        <StatCard icon={UserCheck} label="Contractors" value={totals.contractors} accent="success" />
        <StatCard icon={HardHat} label="Labourers" value={totals.labours} accent="warning" />
        <StatCard icon={Briefcase} label="Open Jobs" value={totals.openJobs} hint={`${totals.jobs} total`} accent="primary" />
        <StatCard icon={FileText} label="Pending Requests" value={totals.pendingRequests} hint={`${totals.requests} total`} accent="warning" />
        <StatCard icon={AlertTriangle} label="Open Disputes" value={totals.openDisputes} hint={`${totals.disputes} total`} accent="destructive" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Wage Agreements</p>
              <p className="mt-1 text-2xl font-bold">{totals.agreements}</p>
            </div>
            <Activity className="h-5 w-5 text-accent" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Confirmed work contracts on platform.</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Insurance Pool</p>
              <p className="mt-1 text-2xl font-bold">{fmtINR(totals.insurancePool)}</p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{totals.insuranceOptIn} workers opted in.</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Ratings</p>
              <p className="mt-1 text-2xl font-bold">{ratings.length}</p>
            </div>
            <Star className="h-5 w-5 text-amber-400" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Reputation signals exchanged.</p>
        </div>
      </div>

      {/* Master tabs */}
      <Tabs defaultValue="users" className="w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="flex-wrap">
            <TabsTrigger value="users">All Users</TabsTrigger>
            <TabsTrigger value="contractors">Contractors</TabsTrigger>
            <TabsTrigger value="labourers">Labourers</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="agreements">Agreements</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="ratings">Ratings</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
          </TabsList>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="pl-9" />
          </div>
        </div>

        {/* USERS */}
        <TabsContent value="users" className="mt-4">
          <div className="glass-card overflow-hidden">
            {filteredProfiles.length === 0 ? <EmptyState icon={Users} title="No users" /> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>User</TableHead><TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead><TableHead>Location</TableHead>
                    <TableHead>Rating</TableHead><TableHead>Joined</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredProfiles.map((p) => {
                      const role = roles[p.id];
                      return (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <InitialsAvatar name={p.full_name} size="sm" />
                              <div>
                                <p className="font-medium">{p.full_name}</p>
                                {role === "contractor" && <p className="text-xs text-muted-foreground">{contractorByUser(p.id)?.company_name}</p>}
                                {role === "labour" && <p className="text-xs text-muted-foreground">{labourByUser(p.id)?.skill}</p>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{role ?? "—"}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">{p.phone ?? "—"}</TableCell>
                          <TableCell className="text-xs">{p.location ?? "—"} {p.pin_code && <span className="text-muted-foreground">· {p.pin_code}</span>}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-xs">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {Number(p.rating_avg ?? 0).toFixed(1)} <span className="text-muted-foreground">({p.rating_count})</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{format(new Date(p.created_at), "PP")}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => setDrawer(p)}>
                              <Eye className="mr-1 h-3 w-3" />View
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
        </TabsContent>

        {/* CONTRACTORS */}
        <TabsContent value="contractors" className="mt-4">
          <div className="glass-card overflow-hidden">
            {contractors.length === 0 ? <EmptyState icon={UserCheck} title="No contractors" /> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Company</TableHead><TableHead>Owner</TableHead>
                    <TableHead>Daily Capacity</TableHead><TableHead>Hired Today</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {contractors.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.company_name}</TableCell>
                        <TableCell>{nameOf(c.user_id)}</TableCell>
                        <TableCell>{c.max_labour_per_day}/day</TableCell>
                        <TableCell><Badge variant="secondary">{c.total_hired_today}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(c.created_at), "PP")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* LABOURERS */}
        <TabsContent value="labourers" className="mt-4">
          <div className="glass-card overflow-hidden">
            {labours.length === 0 ? <EmptyState icon={HardHat} title="No labourers" /> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Name</TableHead><TableHead>Skill</TableHead>
                    <TableHead>Day Rate</TableHead><TableHead>Experience</TableHead>
                    <TableHead>Available</TableHead><TableHead>Joined</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {labours.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{nameOf(l.user_id)}</TableCell>
                        <TableCell><Badge variant="outline">{l.skill}</Badge></TableCell>
                        <TableCell>{fmtINR(l.price_per_day)}</TableCell>
                        <TableCell>{l.experience_years} yrs</TableCell>
                        <TableCell>
                          <span className={`inline-flex h-2 w-2 rounded-full ${l.is_available ? "bg-emerald-400" : "bg-muted-foreground"}`} />
                          <span className="ml-2 text-xs">{l.is_available ? "Yes" : "No"}</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(l.created_at), "PP")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* JOBS */}
        <TabsContent value="jobs" className="mt-4">
          <div className="glass-card overflow-hidden">
            {jobs.length === 0 ? <EmptyState icon={Briefcase} title="No jobs" /> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Title</TableHead><TableHead>Contractor</TableHead>
                    <TableHead>Skill</TableHead><TableHead>Wage</TableHead>
                    <TableHead>Location</TableHead><TableHead>Status</TableHead>
                    <TableHead>Posted</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {jobs.map((j) => {
                      const c = contractorById(j.contractor_id);
                      return (
                        <TableRow key={j.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {j.title}
                              {j.is_urgent && <Badge variant="destructive" className="text-[10px]">URGENT</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>{c?.company_name ?? "—"}</TableCell>
                          <TableCell><Badge variant="outline">{j.required_skill}</Badge></TableCell>
                          <TableCell>{fmtINR(j.wage_per_day ?? j.price_offered)}{j.wage_per_day ? "/day" : ""}</TableCell>
                          <TableCell className="text-xs">{j.location} {j.pin_code && <span className="text-muted-foreground">· {j.pin_code}</span>}</TableCell>
                          <TableCell><StatusBadge status={j.status} /></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{format(new Date(j.created_at), "PP")}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* REQUESTS */}
        <TabsContent value="requests" className="mt-4">
          <div className="glass-card overflow-hidden">
            {requests.length === 0 ? <EmptyState icon={FileText} title="No requests" /> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Contractor</TableHead><TableHead>Labour</TableHead>
                    <TableHead>Initiated by</TableHead><TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {requests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{contractorById(r.contractor_id)?.company_name ?? "—"}</TableCell>
                        <TableCell>{nameOf(labourById(r.labour_id)?.user_id)}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{r.initiated_by}</Badge></TableCell>
                        <TableCell><StatusBadge status={r.status} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(r.created_at), "PPp")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* AGREEMENTS */}
        <TabsContent value="agreements" className="mt-4">
          <div className="glass-card overflow-hidden">
            {agreements.length === 0 ? <EmptyState icon={Activity} title="No wage agreements" /> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Contractor</TableHead><TableHead>Labour</TableHead>
                    <TableHead>Wage</TableHead><TableHead>Duration</TableHead>
                    <TableHead>Confirmations</TableHead><TableHead>Payment</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {agreements.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{contractorById(a.contractor_id)?.company_name ?? "—"}</TableCell>
                        <TableCell>{nameOf(labourById(a.labour_id)?.user_id)}</TableCell>
                        <TableCell className="font-medium">{fmtINR(a.agreed_wage)}/day</TableCell>
                        <TableCell className="text-xs">{a.agreed_duration_days ?? "—"} days{a.agreed_start_date && <span className="text-muted-foreground"> · {format(new Date(a.agreed_start_date), "PP")}</span>}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Badge variant={a.contractor_confirmed ? "default" : "outline"} className="text-[10px]">C {a.contractor_confirmed ? "✓" : "✗"}</Badge>
                            <Badge variant={a.labour_confirmed ? "default" : "outline"} className="text-[10px]">L {a.labour_confirmed ? "✓" : "✗"}</Badge>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="capitalize">{a.payment_status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* DISPUTES */}
        <TabsContent value="disputes" className="mt-4">
          <div className="glass-card overflow-hidden">
            {disputes.length === 0 ? <EmptyState icon={AlertTriangle} title="No disputes" /> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Raised by</TableHead><TableHead>Against</TableHead>
                    <TableHead>Claimed</TableHead><TableHead>Agreed</TableHead>
                    <TableHead>Status</TableHead><TableHead>Date</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {disputes.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{nameOf(d.raised_by)}</TableCell>
                        <TableCell>{nameOf(d.against_user)}</TableCell>
                        <TableCell className="font-medium text-destructive">{fmtINR(d.amount_claimed)}</TableCell>
                        <TableCell>{fmtINR(d.amount_agreed)}</TableCell>
                        <TableCell><Badge variant={d.status === "open" ? "destructive" : "secondary"} className="capitalize">{d.status}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(d.created_at), "PP")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* RATINGS */}
        <TabsContent value="ratings" className="mt-4">
          <div className="glass-card overflow-hidden">
            {ratings.length === 0 ? <EmptyState icon={Star} title="No ratings" /> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>From</TableHead><TableHead>To</TableHead>
                    <TableHead>Score</TableHead><TableHead>Comment</TableHead>
                    <TableHead>Verified Skill</TableHead><TableHead>Date</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {ratings.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{nameOf(r.given_by)}</TableCell>
                        <TableCell>{nameOf(r.given_to)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < r.score ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-xs text-muted-foreground">{r.comment ?? "—"}</TableCell>
                        <TableCell>{r.skill_verified ? <Badge>Verified</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(r.created_at), "PP")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* INSURANCE */}
        <TabsContent value="insurance" className="mt-4">
          <div className="glass-card overflow-hidden">
            {insurance.length === 0 ? <EmptyState icon={Shield} title="No insurance records" /> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>User</TableHead><TableHead>Opted In</TableHead>
                    <TableHead>Total Contributed</TableHead><TableHead>Joined Pool</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {insurance.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="font-medium">{nameOf(i.user_id)}</TableCell>
                        <TableCell>{i.is_opted_in ? <Badge>Yes</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
                        <TableCell className="font-medium">{fmtINR(i.total_contributed)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(i.created_at), "PP")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* User detail drawer */}
      <Sheet open={!!drawer} onOpenChange={(o) => !o && setDrawer(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {drawer && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-4">
                  <InitialsAvatar name={drawer.full_name} size="lg" />
                  <div>
                    <SheetTitle className="text-xl">{drawer.full_name}</SheetTitle>
                    <SheetDescription className="capitalize">{roles[drawer.id] ?? "—"}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <ScrollArea className="mt-6 space-y-4">
                <div className="grid gap-3">
                  <DetailRow icon={Phone} label="Phone" value={drawer.phone ?? "—"} />
                  <DetailRow icon={MapPin} label="Location" value={`${drawer.location ?? "—"}${drawer.pin_code ? " · " + drawer.pin_code : ""}`} />
                  <DetailRow icon={Star} label="Rating" value={`${Number(drawer.rating_avg ?? 0).toFixed(1)} (${drawer.rating_count} reviews)`} />
                  <DetailRow icon={Calendar} label="Joined" value={format(new Date(drawer.created_at), "PPP")} />
                </div>

                {roles[drawer.id] === "contractor" && (() => {
                  const c = contractorByUser(drawer.id);
                  if (!c) return null;
                  const cJobs = jobs.filter((j) => j.contractor_id === c.id);
                  return (
                    <div className="mt-6 space-y-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contractor profile</h3>
                      <div className="glass-card p-4">
                        <p className="font-bold">{c.company_name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Capacity: {c.max_labour_per_day}/day · Hired today: {c.total_hired_today}</p>
                      </div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Posted jobs ({cJobs.length})</h3>
                      <div className="space-y-2">
                        {cJobs.length === 0 ? <p className="text-xs text-muted-foreground">No jobs posted.</p> :
                          cJobs.slice(0, 5).map((j) => (
                            <div key={j.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                              <div>
                                <p className="font-medium">{j.title}</p>
                                <p className="text-xs text-muted-foreground">{j.required_skill} · {fmtINR(j.wage_per_day ?? j.price_offered)}</p>
                              </div>
                              <StatusBadge status={j.status} />
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })()}

                {roles[drawer.id] === "labour" && (() => {
                  const l = labourByUser(drawer.id);
                  if (!l) return null;
                  const lRatings = ratings.filter((r) => r.given_to === drawer.id);
                  return (
                    <div className="mt-6 space-y-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Labour profile</h3>
                      <div className="glass-card p-4 space-y-2">
                        <div className="flex items-center gap-2"><Badge>{l.skill}</Badge><Badge variant="outline">{l.experience_years} yrs exp</Badge></div>
                        <p className="flex items-center gap-1 text-sm font-medium"><IndianRupee className="h-3 w-3" />{l.price_per_day}/day</p>
                        {l.bio && <p className="text-xs text-muted-foreground">{l.bio}</p>}
                      </div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent ratings ({lRatings.length})</h3>
                      <div className="space-y-2">
                        {lRatings.length === 0 ? <p className="text-xs text-muted-foreground">No ratings yet.</p> :
                          lRatings.slice(0, 5).map((r) => (
                            <div key={r.id} className="rounded-lg border border-border p-3 text-sm">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`h-3 w-3 ${i < r.score ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                                ))}
                                <span className="ml-2 text-xs text-muted-foreground">{format(new Date(r.created_at), "PP")}</span>
                              </div>
                              {r.comment && <p className="mt-1 text-xs">{r.comment}</p>}
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })()}
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const DetailRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-center justify-between rounded-lg border border-border bg-card/40 p-3 text-sm">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4" />
      <span className="text-xs uppercase tracking-wider">{label}</span>
    </div>
    <span className="font-medium">{value}</span>
  </div>
);

export default AdminHome;
