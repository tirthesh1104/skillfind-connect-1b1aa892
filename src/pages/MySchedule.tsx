import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface JobEvent {
  id: string;
  title: string;
  location: string;
  start: Date;
  end: Date;
  wage: number;
  counterparty: string;
}

const MySchedule = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<"labour" | "contractor" | null>(null);
  const [events, setEvents] = useState<JobEvent[]>([]);
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<JobEvent | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
      const rr = (r?.role === "contractor" ? "contractor" : "labour");
      setRole(rr);

      if (rr === "contractor") {
        const { data: cp } = await supabase.from("contractor_profiles").select("id").eq("user_id", user.id).maybeSingle();
        if (!cp) return;
        const { data: jobs } = await supabase.from("jobs").select("id, title, location, start_date, duration_days, wage_per_day, price_offered").eq("contractor_id", cp.id);
        setEvents((jobs || []).filter((j: any) => j.start_date).map((j: any) => {
          const s = new Date(j.start_date);
          const e = new Date(s); e.setDate(e.getDate() + Math.max((j.duration_days || 1) - 1, 0));
          return { id: j.id, title: j.title, location: j.location, start: s, end: e, wage: j.wage_per_day || j.price_offered, counterparty: "" };
        }));
      } else {
        const { data: lp } = await supabase.from("labour_profiles").select("id").eq("user_id", user.id).maybeSingle();
        if (!lp) return;
        const { data: reqs } = await supabase.from("requests").select("id, job_id, status").eq("labour_id", lp.id).eq("status", "accepted");
        const jobIds = (reqs || []).map((r: any) => r.job_id).filter(Boolean);
        if (!jobIds.length) return;
        const { data: jobs } = await supabase.from("jobs").select("id, title, location, start_date, duration_days, wage_per_day, price_offered, contractor_id").in("id", jobIds);
        const contractorIds = Array.from(new Set((jobs || []).map((j: any) => j.contractor_id)));
        const { data: cps } = await supabase.from("contractor_profiles").select("id, company_name").in("id", contractorIds);
        const cpMap = new Map((cps || []).map((c: any) => [c.id, c.company_name]));
        setEvents((jobs || []).filter((j: any) => j.start_date).map((j: any) => {
          const s = new Date(j.start_date);
          const e = new Date(s); e.setDate(e.getDate() + Math.max((j.duration_days || 1) - 1, 0));
          return { id: j.id, title: j.title, location: j.location, start: s, end: e, wage: j.wage_per_day || j.price_offered, counterparty: cpMap.get(j.contractor_id) || "" };
        }));
      }
    })();
  }, [user]);

  const grid = useMemo(() => {
    const y = cursor.getFullYear(), m = cursor.getMonth();
    const first = new Date(y, m, 1);
    const startWeekday = first.getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(new Date(y, m, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const eventsOn = (d: Date) => events.filter((e) => d >= new Date(e.start.toDateString()) && d <= new Date(e.end.toDateString()));

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {role === "contractor" ? "Site Schedule" : "My Schedule"}
        </h1>
        <p className="text-sm text-muted-foreground">Monthly view of confirmed jobs.</p>
      </div>

      <div className="glass-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <p className="font-semibold">{monthLabel}</p>
          <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {["S","M","T","W","T","F","S"].map((d,i) => <div key={i}>{d}</div>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {grid.map((d, i) => {
            if (!d) return <div key={i} className="aspect-square rounded-md" />;
            const ev = eventsOn(d);
            const isToday = d.toDateString() === new Date().toDateString();
            return (
              <button
                key={i}
                onClick={() => ev[0] && setSelected(ev[0])}
                className={cn(
                  "aspect-square rounded-md border p-1 text-left text-xs transition-colors",
                  isToday ? "border-primary" : "border-border",
                  ev.length ? "bg-primary/10 hover:bg-primary/20" : "hover:bg-secondary/50"
                )}
              >
                <div className="font-medium">{d.getDate()}</div>
                {ev.slice(0, 2).map((e) => (
                  <div key={e.id} className="mt-0.5 flex items-center gap-1 truncate">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span className="truncate">{e.title}</span>
                  </div>
                ))}
                {ev.length > 2 && <div className="text-[10px] text-muted-foreground">+{ev.length - 2}</div>}
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="glass-card p-4">
          <p className="text-sm font-semibold">{selected.title}</p>
          <p className="text-xs text-muted-foreground">Location: {selected.location}</p>
          {selected.counterparty && <p className="text-xs text-muted-foreground">Contractor: {selected.counterparty}</p>}
          <p className="text-xs text-muted-foreground">
            {selected.start.toLocaleDateString()} → {selected.end.toLocaleDateString()}
          </p>
          <p className="text-xs">Wage: ₹{selected.wage}/day</p>
        </div>
      )}
    </div>
  );
};

export default MySchedule;
