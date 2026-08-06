import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { MapPin, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";

const haversine = (a: [number, number], b: [number, number]) => {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]), dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
};

const SiteAttendance = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobId, setJobId] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data: r } = await supabase.rpc("get_user_role", { _user_id: user.id });
    setRole(r as string);

    if (r === "contractor") {
      const { data: cp } = await supabase.from("contractor_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (cp) {
        const { data: js } = await supabase.from("jobs").select("id, title, location, site_lat, site_lng, geofence_radius_m").eq("contractor_id", cp.id);
        setJobs(js ?? []);
      }
    } else {
      const { data: lp } = await supabase.from("labour_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (lp) {
        const { data: reqs } = await supabase
          .from("requests")
          .select("job:jobs(id, title, location, site_lat, site_lng, geofence_radius_m)")
          .eq("labour_id", lp.id).eq("status", "accepted");
        const js = (reqs ?? []).map((x: any) => x.job).filter(Boolean);
        setJobs(js);
      }
    }

    const { data } = await supabase.from("site_attendance").select("*").order("check_in_time", { ascending: false }).limit(100);
    const list = data ?? [];
    setRows(list);
    const ids = Array.from(new Set(list.map((a: any) => a.worker_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      setNames(Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.full_name])));
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const openRow = rows.find((a) => a.worker_id === user?.id && !a.check_out_time);

  const getPos = () => new Promise<GeolocationPosition>((res, rej) =>
    navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 12000 }));

  const checkIn = async () => {
    if (!jobId) return toast.error("Select your site first");
    const job = jobs.find((j) => j.id === jobId);
    setBusy(true);
    try {
      const pos = await getPos();
      const me: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      let distance: number | null = null;
      let within = true;
      if (job?.site_lat != null && job?.site_lng != null) {
        distance = haversine(me, [job.site_lat, job.site_lng]);
        within = distance <= (job.geofence_radius_m ?? 200);
      }
      const { data: cp } = await supabase.from("contractor_profiles").select("user_id").eq("id", job?.contractor_id ?? "").maybeSingle();
      const { error } = await supabase.from("site_attendance").insert({
        worker_id: user!.id, job_id: jobId, check_in_lat: me[0], check_in_lng: me[1],
        distance_m: distance, is_within_geofence: within, contractor_id: cp?.user_id ?? null,
      });
      if (error) throw new Error(error.message);
      toast[within ? "success" : "warning"](
        within ? "Checked in on site ✅" : `Checked in ${distance}m away from site — marked outside geofence.`
      );
      load();
    } catch (e: any) {
      toast.error(e?.message || "Could not read your location");
    } finally { setBusy(false); }
  };

  const checkOut = async () => {
    if (!openRow) return;
    setBusy(true);
    const { error } = await supabase.from("site_attendance")
      .update({ check_out_time: new Date().toISOString() }).eq("id", openRow.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Checked out");
    load();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
          <MapPin className="h-6 w-6 text-primary" /> Geofenced Attendance
        </h1>
        <p className="text-sm text-muted-foreground">GPS-verified check-in at the site. No proxy attendance.</p>
      </div>

      {role !== "admin" && (
        <Card>
          <CardHeader><CardTitle className="text-base">{openRow ? "You are checked in" : "Check in to site"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!openRow && (
              <div className="space-y-1.5">
                <Label>Site / Job</Label>
                <Select value={jobId} onValueChange={setJobId}>
                  <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                  <SelectContent>
                    {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title} — {j.location}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {openRow ? (
              <Button onClick={checkOut} disabled={busy} variant="destructive" className="w-full sm:w-auto">
                <LogOut className="mr-2 h-4 w-4" /> Check Out
              </Button>
            ) : (
              <Button onClick={checkIn} disabled={busy} className="w-full sm:w-auto">
                <LogIn className="mr-2 h-4 w-4" /> {busy ? "Locating..." : "Check In with GPS"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {rows.length === 0 ? (
        <EmptyState icon={MapPin} title="No attendance yet" description="GPS check-ins will show up here." />
      ) : (
        <div className="space-y-2">
          {rows.map((a) => (
            <div key={a.id} className="glass-card flex flex-col gap-1 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{names[a.worker_id] ?? "Worker"}</p>
                <p className="text-xs text-muted-foreground">
                  In: {new Date(a.check_in_time).toLocaleString()}
                  {a.check_out_time ? ` · Out: ${new Date(a.check_out_time).toLocaleTimeString()}` : " · still on site"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {a.distance_m != null && <span className="text-xs text-muted-foreground">{a.distance_m}m</span>}
                <Badge variant={a.is_within_geofence ? "default" : "destructive"}>
                  {a.is_within_geofence ? "On site" : "Outside site"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SiteAttendance;
