import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Siren } from "lucide-react";

// NOTE (pre-deployment): WhatsApp delivery uses the official wa.me deep link and opens
// a pre-filled message for each recipient (contractor + family emergency contact).
// A server-side WhatsApp Business/bot API is NOT connected yet — when it is, replace
// the openWhatsApp() calls below with an edge-function send and keep the same statuses.
const openWhatsApp = (phone: string, text: string) => {
  const digits = phone.replace(/\D/g, "");
  const num = digits.length === 10 ? `91${digits}` : digits;
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
};

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

    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name, phone, emergency_contact_name, emergency_contact_phone, emergency_contact_email")
      .eq("id", user.id)
      .maybeSingle();
    const name = prof?.full_name || "Worker";

    const { data: alert, error } = await supabase.from("sos_alerts").insert({
      worker_id: user.id, latitude: lat, longitude: lon, address: mapsLink,
    }).select("id, created_at").maybeSingle();

    if (error) { setSending(false); return toast.error(error.message); }

    // Find the worker's most recent contractor (assigned/accepted request)
    let contractorUserId: string | null = null;
    let contractorPhone: string | null = null;
    const { data: lp } = await supabase.from("labour_profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (lp) {
      const { data: req } = await supabase
        .from("requests")
        .select("contractor_id, created_at")
        .eq("labour_id", lp.id)
        .eq("status", "accepted")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (req?.contractor_id) {
        const { data: cp } = await supabase.from("contractor_profiles").select("user_id").eq("id", req.contractor_id).maybeSingle();
        if (cp?.user_id) {
          contractorUserId = cp.user_id;
          const { data: cprof } = await supabase.from("profiles").select("phone").eq("id", cp.user_id).maybeSingle();
          contractorPhone = cprof?.phone ?? null;
        }
      }
    }

    // Notify all admins in-app (existing behaviour)
    const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
    const inAppTargets = [...(admins?.map((a: any) => a.user_id) ?? []), ...(contractorUserId ? [contractorUserId] : [])];
    if (inAppTargets.length) {
      const rows = inAppTargets.map((uid) => ({
        user_id: uid,
        title: "🆘 SOS Alert",
        body: `${name} needs urgent help. ${mapsLink ? "Location: " + mapsLink : "Location unavailable"}`,
        link: "/admin/sos",
        type: "system" as const,
        message: `SOS from ${name}`,
      }));
      await supabase.from("notifications").insert(rows as any);
    }

    // WhatsApp to BOTH contractor and family emergency contact
    const waText = `🆘 SOS ALERT\n${name} has raised an SOS alert and may be in danger.\nPhone: ${prof?.phone || "N/A"}\nLocation: ${mapsLink || "unavailable"}\nTime: ${new Date().toLocaleString("en-IN")}`;
    const waTargets = [contractorPhone, prof?.emergency_contact_phone].filter(Boolean) as string[];
    waTargets.forEach((p) => openWhatsApp(p, waText));

    // Email to contractor + emergency contact (real send via Resend edge function)
    let emailOk = false;
    try {
      const { data: res } = await supabase.functions.invoke("send-sos-email", {
        body: {
          alert_id: alert?.id,
          worker_name: name,
          worker_phone: prof?.phone ?? null,
          latitude: lat,
          longitude: lon,
          contractor_id: contractorUserId,
          emergency_email: prof?.emergency_contact_email ?? null,
          created_at: alert?.created_at ?? new Date().toISOString(),
        },
      });
      emailOk = !!(res as any)?.sent;
    } catch { /* status stays failed */ }

    if (alert?.id) {
      await supabase.from("sos_alerts").update({
        whatsapp_status: waTargets.length ? "sent" : "skipped",
      }).eq("id", alert.id);
    }

    setSending(false);
    toast.success(
      `SOS bheja gaya. WhatsApp: ${waTargets.length ? waTargets.length + " recipient(s)" : "no number saved"} · Email: ${emailOk ? "sent" : "not sent"}`
    );
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
            This shares your live location with the admin team, your contractor and your family emergency contact — via app alert, WhatsApp and email.
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
