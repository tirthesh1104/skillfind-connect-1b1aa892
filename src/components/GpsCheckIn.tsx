import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MapPin, LogIn, LogOut } from "lucide-react";
import { format } from "date-fns";

interface Checkin {
  id: string;
  kind: string;
  place_name: string | null;
  created_at: string;
}

const getPosition = () =>
  new Promise<GeolocationPosition>((res, rej) =>
    navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000, enableHighAccuracy: true })
  );

const reverseGeocode = async (lat: number, lon: number) => {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`
    );
    const d = await r.json();
    return (
      d.address?.suburb || d.address?.village || d.address?.town || d.address?.city || d.display_name || null
    );
  } catch {
    return null;
  }
};

export const GpsCheckIn = () => {
  const { user } = useAuth();
  const [last, setLast] = useState<Checkin | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("site_checkins")
      .select("id, kind, place_name, created_at")
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setLast(data ?? null);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const mark = async (kind: "in" | "out") => {
    if (!user) return;
    setBusy(true);
    let lat: number | null = null;
    let lon: number | null = null;
    let place: string | null = null;
    try {
      const pos = await getPosition();
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
      place = await reverseGeocode(lat, lon);
    } catch {
      toast.warning("Location off — GPS शिवाय नोंद होईल");
    }

    // pick the worker's most recent job, if any
    const { data: lp } = await supabase
      .from("labour_payments")
      .select("job_id")
      .eq("labour_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await supabase.from("site_checkins").insert({
      worker_id: user.id,
      job_id: lp?.job_id ?? null,
      kind,
      latitude: lat,
      longitude: lon,
      place_name: place,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(kind === "in" ? "Check-in झाले ✅" : "Check-out झाले 👋");
    load();
  };

  return (
    <div className="glass-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="h-6 w-6 text-primary" />
          <div>
            <p className="text-sm font-semibold">Site Check-in / हजेरी</p>
            <p className="text-xs text-muted-foreground">
              {last
                ? `Last: ${last.kind === "in" ? "Check-in" : "Check-out"} · ${last.place_name ?? "Location N/A"} · ${format(new Date(last.created_at), "dd MMM p")}`
                : "Aaj tak koi check-in nahi"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" disabled={busy} onClick={() => mark("in")}>
            <LogIn className="mr-2 h-4 w-4" /> Check In
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => mark("out")}>
            <LogOut className="mr-2 h-4 w-4" /> Check Out
          </Button>
        </div>
      </div>
    </div>
  );
};
