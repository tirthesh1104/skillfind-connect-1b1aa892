import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Cloud, CloudRain, Sun } from "lucide-react";

interface Day { date: string; precip: number; code: number; }

// A tiny geocoder for common Maharashtra pins; fallback to Mumbai
const KNOWN: Record<string, [number, number]> = {
  mumbai: [19.076, 72.877], pune: [18.520, 73.856], nagpur: [21.146, 79.088],
  nashik: [19.997, 73.789], thane: [19.219, 72.978], aurangabad: [19.876, 75.343],
};

const resolveCoords = (location: string): [number, number] => {
  const key = (location || "").toLowerCase();
  for (const k of Object.keys(KNOWN)) if (key.includes(k)) return KNOWN[k];
  return KNOWN.mumbai;
};

export const WeatherWidget = () => {
  const { user } = useAuth();
  const [days, setDays] = useState<Day[]>([]);
  const [siteLabel, setSiteLabel] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: cp } = await supabase.from("contractor_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (!cp) return;
      const { data: job } = await supabase.from("jobs").select("location").eq("contractor_id", cp.id).eq("status", "open").order("created_at", { ascending: false }).limit(1).maybeSingle();
      const loc = job?.location || "Mumbai";
      setSiteLabel(loc);
      const [lat, lon] = resolveCoords(loc);
      try {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,weathercode&timezone=Asia/Kolkata&forecast_days=2`);
        const d = await r.json();
        const out: Day[] = (d.daily?.time || []).map((t: string, i: number) => ({
          date: t, precip: d.daily.precipitation_sum[i], code: d.daily.weathercode[i],
        }));
        setDays(out);
      } catch { /* ignore */ }
    })();
  }, [user]);

  if (!days.length) return null;
  const tomorrow = days[1] || days[0];
  const heavyRain = tomorrow.precip > 10 || [95, 96, 99].includes(tomorrow.code);
  const Icon = heavyRain ? CloudRain : tomorrow.precip > 1 ? Cloud : Sun;

  return (
    <div className={`glass-card p-4 ${heavyRain ? "border-red-500/40" : "border-green-500/30"}`}>
      <div className="flex items-center gap-3">
        <Icon className={`h-8 w-8 ${heavyRain ? "text-red-500" : "text-green-500"}`} />
        <div className="flex-1">
          <p className="text-sm font-semibold">Site Weather · {siteLabel}</p>
          <p className="text-xs text-muted-foreground">
            {heavyRain
              ? "⚠️ उद्या पाऊस येण्याची शक्यता आहे. Site बंद ठेवण्याचा विचार करा."
              : "☀️ उद्या हवामान चांगले आहे. काम नियोजित करा."}
          </p>
        </div>
        <div className="text-right text-xs">
          {days.map((d) => (
            <div key={d.date}>{new Date(d.date).toLocaleDateString(undefined, { weekday: "short" })}: {d.precip.toFixed(1)}mm</div>
          ))}
        </div>
      </div>
    </div>
  );
};
