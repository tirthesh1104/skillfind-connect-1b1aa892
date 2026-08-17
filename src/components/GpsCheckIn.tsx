import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MapPin, LogIn, LogOut, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface Checkin {
  id: string;
  kind: string;
  place_name: string | null;
  created_at: string;
}

const getPosition = () =>
  new Promise<GeolocationPosition>((res, rej) =>
    navigator.geolocation.getCurrentPosition(res, rej, {
      timeout: 15000,
      enableHighAccuracy: true,
      maximumAge: 0, // never use a stale cached fix
    })
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
  const [permission, setPermission] = useState<PermissionState | "unsupported" | "insecure" | null>(null);

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

  // Permission / secure-origin pre-check. Browsers block geolocation on
  // non-HTTPS origins (localhost is exempt) — surface that instead of failing silently.
  useEffect(() => {
    if (!("geolocation" in navigator)) return setPermission("unsupported");
    if (!window.isSecureContext) return setPermission("insecure");
    navigator.permissions
      ?.query({ name: "geolocation" as PermissionName })
      .then((p) => {
        setPermission(p.state);
        p.onchange = () => setPermission(p.state);
      })
      .catch(() => setPermission(null));
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const mark = async (kind: "in" | "out") => {
    if (!user) return;

    if (permission === "unsupported") return toast.error("This browser does not support GPS location.");
    if (permission === "insecure")
      return toast.error("Location needs a secure (HTTPS) connection. Open the site over https://");

    setBusy(true);
    let lat: number | null = null;
    let lon: number | null = null;
    let place: string | null = null;
    try {
      const pos = await getPosition();
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
      place = await reverseGeocode(lat, lon);
    } catch (err) {
      const code = (err as GeolocationPositionError)?.code;
      if (code === 1) {
        setPermission("denied");
        setBusy(false);
        return toast.error(
          "Location blocked. Browser/phone settings मध्ये या साइटसाठी Location 'Allow' करा, मग पुन्हा प्रयत्न करा."
        );
      }
      if (code === 3) toast.warning("GPS signal slow — location न घेता नोंद होईल");
      else toast.warning("Location unavailable — GPS शिवाय नोंद होईल");
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
    if (error) return toast.error(`Check-in save failed: ${error.message}`);
    toast.success(
      kind === "in"
        ? lat
          ? "Check-in झाले ✅ (location saved)"
          : "Check-in झाले ✅ (location नाही)"
        : "Check-out झाले 👋"
    );
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

      {(permission === "denied" || permission === "insecure" || permission === "unsupported") && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {permission === "denied"
              ? "Location access denied. Chrome: address bar चा 🔒 icon → Location → Allow. Phone: Settings → Apps → Browser → Permissions → Location."
              : permission === "insecure"
              ? "Geolocation works only on a secure HTTPS connection."
              : "This device/browser does not provide GPS location."}
          </span>
        </div>
      )}
    </div>
  );
};
