import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, MessageCircle, Star, MapPin, Briefcase, Shield } from "lucide-react";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { DashboardSections } from "@/components/DashboardSections";

interface WorkerRow {
  id: string;
  full_name: string;
  location: string | null;
  rating_avg: number | null;
  rating_count: number | null;
  skill?: string | null;
  experience_years?: number | null;
  price_per_day?: number | null;
}

interface ContractorRow {
  id: string;
  full_name: string;
  location: string | null;
  rating_avg: number | null;
  rating_count: number | null;
  company_name?: string | null;
}

const ClientHome = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [contractors, setContractors] = useState<ContractorRow[]>([]);
  const [workerSearch, setWorkerSearch] = useState("");
  const [contractorSearch, setContractorSearch] = useState("");
  const [contactTarget, setContactTarget] = useState<{ id: string; name: string } | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: labourRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "labour");
      const labourIds = (labourRoles || []).map((r) => r.user_id);

      const { data: contractorRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "contractor");
      const contractorIds = (contractorRoles || []).map((r) => r.user_id);

      if (labourIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, location, rating_avg, rating_count")
          .in("id", labourIds);
        const { data: lprofs } = await supabase
          .from("labour_profiles")
          .select("user_id, skill, experience_years, price_per_day")
          .in("user_id", labourIds);
        const skillMap = new Map((lprofs || []).map((l: any) => [l.user_id, l]));
        setWorkers(
          (profs || []).map((p: any) => ({
            ...p,
            ...(skillMap.get(p.id) || {}),
          }))
        );
      }

      if (contractorIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, location, rating_avg, rating_count")
          .in("id", contractorIds);
        const { data: cprofs } = await supabase
          .from("contractor_profiles")
          .select("user_id, company_name")
          .in("user_id", contractorIds);
        const cMap = new Map((cprofs || []).map((c: any) => [c.user_id, c.company_name]));
        setContractors(
          (profs || []).map((p: any) => ({
            ...p,
            company_name: cMap.get(p.id) || null,
          }))
        );
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("messages")
      .select("*")
      .eq("sender_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setMyRequests(data || []));
  }, [user]);

  const sendMessage = async () => {
    if (!user || !contactTarget || !message.trim()) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: contactTarget.id,
      message: message.trim(),
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Message sent");
    setMessage("");
    setContactTarget(null);
  };

  const filteredWorkers = workers.filter(
    (w) =>
      !workerSearch ||
      w.full_name?.toLowerCase().includes(workerSearch.toLowerCase()) ||
      w.skill?.toLowerCase().includes(workerSearch.toLowerCase()) ||
      w.location?.toLowerCase().includes(workerSearch.toLowerCase())
  );
  const filteredContractors = contractors.filter(
    (c) =>
      !contractorSearch ||
      c.full_name?.toLowerCase().includes(contractorSearch.toLowerCase()) ||
      c.company_name?.toLowerCase().includes(contractorSearch.toLowerCase()) ||
      c.location?.toLowerCase().includes(contractorSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("client.welcome")}</h1>
          <p className="text-sm text-muted-foreground">Find workers and contractors for your project</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/messages"><MessageCircle className="mr-2 h-4 w-4" /> {t("client.myRequests")}</Link>
        </Button>
      </div>

      <Tabs defaultValue="workers">
        <TabsList>
          <TabsTrigger value="workers">{t("client.searchWorkers")}</TabsTrigger>
          <TabsTrigger value="contractors">{t("client.searchContractors")}</TabsTrigger>
          <TabsTrigger value="requests">{t("client.myRequests")}</TabsTrigger>
        </TabsList>

        <TabsContent value="workers" className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name, skill, or location" value={workerSearch} onChange={(e) => setWorkerSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredWorkers.map((w) => (
              <Card key={w.id} className="p-4">
                <div className="flex items-start gap-3">
                  <InitialsAvatar name={w.full_name} />
                  <div className="min-w-0 flex-1">
                    <Link to={`/worker/${w.id}`} className="font-semibold hover:underline">{w.full_name}</Link>
                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                      {w.skill && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-accent">{w.skill}</span>}
                      {w.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {w.location}</span>}
                      {w.experience_years != null && <span>{w.experience_years}y exp</span>}
                    </div>
                    <div className="mt-1 text-xs flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {Number(w.rating_avg ?? 0).toFixed(1)} ({w.rating_count ?? 0})</div>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setContactTarget({ id: w.id, name: w.full_name })}>
                  <MessageCircle className="mr-1 h-3 w-3" /> {t("common.contact")}
                </Button>
              </Card>
            ))}
            {filteredWorkers.length === 0 && <p className="text-sm text-muted-foreground">No workers found.</p>}
          </div>
        </TabsContent>

        <TabsContent value="contractors" className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by company or location" value={contractorSearch} onChange={(e) => setContractorSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredContractors.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex items-start gap-3">
                  <InitialsAvatar name={c.full_name} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{c.full_name}</div>
                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                      {c.company_name && <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" /> {c.company_name}</span>}
                      {c.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.location}</span>}
                    </div>
                    <div className="mt-1 text-xs flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {Number(c.rating_avg ?? 0).toFixed(1)} ({c.rating_count ?? 0})</div>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setContactTarget({ id: c.id, name: c.full_name })}>
                  <MessageCircle className="mr-1 h-3 w-3" /> {t("common.contact")}
                </Button>
              </Card>
            ))}
            {filteredContractors.length === 0 && <p className="text-sm text-muted-foreground">No contractors found.</p>}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-3">
          {myRequests.length === 0 && <p className="text-sm text-muted-foreground">No messages sent yet.</p>}
          {myRequests.map((m) => (
            <Card key={m.id} className="p-3">
              <p className="text-sm">{m.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</p>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Card className="p-4 border-accent/40 bg-accent/5">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-accent" />
          <div className="flex-1">
            <p className="font-semibold">{t("client.contactAdmin")}</p>
            <p className="text-xs text-muted-foreground">Need help with verification or disputes?</p>
          </div>
          <Button variant="outline" size="sm" onClick={async () => {
            const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin").limit(1);
            if (admins?.[0]) setContactTarget({ id: admins[0].user_id, name: "Admin" });
          }}>
            {t("common.contact")}
          </Button>
        </div>
      </Card>

      <DashboardSections role="client" />

      <Dialog open={!!contactTarget} onOpenChange={(o) => !o && setContactTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message {contactTarget?.name}</DialogTitle>
          </DialogHeader>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message..." rows={5} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setContactTarget(null)}>{t("common.cancel")}</Button>
            <Button onClick={sendMessage} disabled={sending || !message.trim()}>{t("common.send")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientHome;
