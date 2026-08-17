import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { MapPin, Radio } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// OpenStreetMap tiles need no API key. If tiles are ever swapped for Mapbox/Google,
// read the token from a secret (e.g. VITE_MAP_TILE_TOKEN) — never hardcode it.

// Fixes the two classic Leaflet bugs: container measured at 0px height on first
// paint (blank map), and the map never re-centering when new pins arrive.
const MapSync = ({ center, hasPins }: { center: [number, number]; hasPins: boolean }) => {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);
  useEffect(() => {
    if (hasPins) map.setView(center, Math.max(map.getZoom(), 10), { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], hasPins]);
  return null;
};

interface Checkin {
  id: string;
  worker_id: string;
  job_id: string | null;
  kind: string;
  latitude: number | null;
  longitude: number | null;
  place_name: string | null;
  created_at: string;
}

const statusOf = (c: Checkin) => {
  const hours = (Date.now() - new Date(c.created_at).getTime()) / 36e5;
  if (c.kind === "out") return { color: "#eab308", label: "Checked out" };
  if (hours > 12) return { color: "#ef4444", label: "Stale (12h+)" };
  return { color: "#22c55e", label: "On site" };
};

const LiveMap = () => {
  const { user, role } = useAuth();
  const [rows, setRows] = useState<Checkin[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const since = new Date(Date.now() - 3 * 864e5).toISOString();
    const { data } = await supabase
      .from("site_checkins")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(300);
    const list = (data ?? []) as Checkin[];
    setRows(list);
    const ids = Array.from(new Set(list.map((r) => r.worker_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      const map: Record<string, string> = {};
      (profs ?? []).forEach((p: any) => (map[p.id] = p.full_name));
      setNames(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const channel = supabase
      .channel("live-map-checkins")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_checkins" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // latest check-in per worker (that has coordinates)
  const pins = useMemo(() => {
    const seen = new Set<string>();
    return rows.filter((r) => {
      if (r.latitude == null || r.longitude == null) return false;
      if (seen.has(r.worker_id)) return false;
      seen.add(r.worker_id);
      return true;
    });
  }, [rows]);

  const center: [number, number] = pins.length
    ? [pins[0].latitude as number, pins[0].longitude as number]
    : [19.076, 72.877];

  const scopeLabel =
    role === "labour"
      ? "तुमची स्वतःची हजेरी"
      : role === "contractor"
      ? "तुमच्या साइट्स व कामगार"
      : role === "admin"
      ? "संपूर्ण प्लॅटफॉर्म"
      : "तुमच्या प्रकल्पाची साइट";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Live Command Map</h1>
        <p className="text-sm text-muted-foreground">Realtime GPS check-ins · {scopeLabel}</p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline" className="gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> On site</Badge>
        <Badge variant="outline" className="gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500" /> Checked out</Badge>
        <Badge variant="outline" className="gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Stale / flagged</Badge>
      </div>

      <div className="glass-card overflow-hidden p-0">
        <div className="h-[380px] w-full md:h-[460px]">
          <MapContainer center={center} zoom={pins.length ? 10 : 5} className="h-full w-full" scrollWheelZoom>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapSync center={center} hasPins={pins.length > 0} />
            {pins.map((p) => {
              const s = statusOf(p);
              return (
                <CircleMarker
                  key={p.id}
                  center={[p.latitude as number, p.longitude as number]}
                  radius={9}
                  pathOptions={{ color: s.color, fillColor: s.color, fillOpacity: 0.7 }}
                >
                  <Popup>
                    <div className="text-xs">
                      <p className="font-semibold">{names[p.worker_id] ?? "Worker"}</p>
                      <p>{p.place_name ?? "Location"}</p>
                      <p>{s.label} · {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
        {!loading && pins.length === 0 && (
          <p className="border-t border-border p-3 text-xs text-muted-foreground">
            No GPS coordinates yet. Workers must press <strong>Check In</strong> on their dashboard and allow
            location access in the browser — check-ins saved without location won't appear as pins here.
          </p>
        )}
      </div>


      <div className="glass-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Radio className="h-4 w-4 text-primary" /> Live Feed
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <EmptyState icon={MapPin} title="No check-ins yet" description="GPS check-ins will appear here in real time." />
        ) : (
          <ul className="divide-y divide-border">
            {rows.slice(0, 25).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{names[r.worker_id] ?? "Worker"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.kind === "in" ? "Checked in" : "Checked out"} · {r.place_name ?? "Location N/A"}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LiveMap;
