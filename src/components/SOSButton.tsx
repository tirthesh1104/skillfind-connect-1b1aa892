import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Siren } from "lucide-react";

export const SOSButton = () => {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);

  const trigger = async () => {
    if (!user) return;
    setSending(true);
    let lat: number | null = null, lon: number | null = null;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
    } catch { /* ignore */ }

    const mapsLink = lat && lon ? `https://maps.google.com/?q=${lat},${lon}` : null;

    const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    const name = prof?.full_name || "Worker";

    const { error } = await supabase.from("sos_alerts").insert({
      worker_id: user.id, latitude: lat, longitude: lon, address: mapsLink,
    });

    // Notify all admins
    const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
    if (admins?.length) {
      const rows = admins.map((a: any) => ({
        user_id: a.user_id,
        title: "🆘 SOS Alert",
        body: `${name} needs urgent help. ${mapsLink ? "Location: " + mapsLink : "Location unavailable"}`,
        link: "/admin",
        type: "system" as const,
        message: `SOS from ${name}`,
      }));
      await supabase.from("notifications").insert(rows as any);
    }

    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("SOS bheja gaya. Admin ko notification mili hai. Shant raho.");
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="fixed bottom-24 right-6 z-40 h-14 w-14 rounded-full bg-red-600 p-0 shadow-lg hover:bg-red-700 animate-pulse">
          <Siren className="h-7 w-7 text-white" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send Emergency SOS?</AlertDialogTitle>
          <AlertDialogDescription>
            This will share your live location with the admin team and any registered emergency contacts.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={sending} onClick={trigger} className="bg-red-600 hover:bg-red-700">
            {sending ? "Sending..." : "Yes, Send SOS"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
