import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/EmptyState";
import { ExternalLink, Siren } from "lucide-react";
import { toast } from "sonner";

const AdminSOS = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase.from("sos_alerts").select("*").order("created_at", { ascending: false });
    const ids = Array.from(new Set((data || []).map((a: any) => a.worker_id)));
    const { data: profs } = ids.length ? await supabase.from("profiles").select("id, full_name, phone").in("id", ids) : { data: [] };
    const pm = new Map((profs || []).map((p: any) => [p.id, p]));
    setAlerts((data || []).map((a: any) => ({ ...a, profile: pm.get(a.worker_id) })));
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("sos-admin").on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, () => load()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const resolve = async (id: string) => {
    const { error } = await supabase.from("sos_alerts").update({ status: "resolved", admin_notes: notes[id] || null, resolved_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Marked resolved");
    load();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2"><Siren className="h-6 w-6 text-red-500" /> SOS Alerts</h1>
        <p className="text-sm text-muted-foreground">Emergency alerts from workers in the field.</p>
      </div>
      {alerts.length === 0 ? <EmptyState icon={Siren} title="No SOS alerts" description="All clear." /> : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div key={a.id} className={`glass-card p-4 ${a.status === "active" ? "border-red-500/60" : ""}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{a.profile?.full_name || "Worker"} <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${a.status === "active" ? "bg-red-500/20 text-red-600" : "bg-green-500/20 text-green-600"}`}>{a.status}</span></p>
                  <p className="text-xs text-muted-foreground">Phone: {a.profile?.phone || "—"} · {new Date(a.created_at).toLocaleString()}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                    <span className={`rounded-full px-2 py-0.5 ${a.whatsapp_status === "sent" ? "bg-green-500/20 text-green-600" : a.whatsapp_status === "skipped" ? "bg-muted text-muted-foreground" : "bg-red-500/20 text-red-600"}`}>
                      WhatsApp: {a.whatsapp_status || "pending"}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 ${a.email_status === "sent" ? "bg-green-500/20 text-green-600" : a.email_status === "skipped" ? "bg-muted text-muted-foreground" : "bg-red-500/20 text-red-600"}`}>
                      Email: {a.email_status || "pending"}
                    </span>
                  </div>
                  {a.notify_detail && <p className="mt-1 text-[11px] text-muted-foreground">{a.notify_detail}</p>}
                </div>
                {a.latitude && (
                  <a href={`https://maps.google.com/?q=${a.latitude},${a.longitude}`} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                    <ExternalLink className="inline h-3 w-3" /> Open map
                  </a>
                )}
              </div>
              {a.status === "active" && (
                <div className="mt-3 flex gap-2">
                  <Textarea placeholder="Resolution notes" value={notes[a.id] || ""} onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })} className="flex-1" rows={2} />
                  <Button onClick={() => resolve(a.id)}>Mark Resolved</Button>
                </div>
              )}
              {a.admin_notes && <p className="mt-2 text-xs text-muted-foreground">Notes: {a.admin_notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSOS;
