import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Bell } from "lucide-react";

// The VAPID public key is safe to expose in the client (private key stays in
// the VAPID_PRIVATE_KEY backend secret). Fetched from the backend at runtime.
const fetchVapidKey = async (): Promise<string> => {
  const { data } = await supabase.functions.invoke("push-vapid-key");
  return (data as any)?.publicKey ?? "";
};

const urlBase64ToUint8Array = (base64: string) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

export const PushAlertsToggle = () => {
  const { user } = useAuth();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("push_subscriptions")
      .select("enabled")
      .eq("worker_id", user.id)
      .maybeSingle()
      .then(({ data }) => setOn(!!data?.enabled));
  }, [user]);

  const toggle = async (next: boolean) => {
    if (!user) return;
    setBusy(true);
    try {
      if (!next) {
        await supabase.from("push_subscriptions").update({ enabled: false }).eq("worker_id", user.id);
        setOn(false);
        toast.success("Job alerts off");
        return;
      }

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        toast.error("This browser does not support push notifications.");
        return;
      }
      const vapidKey = await fetchVapidKey();
      if (!vapidKey) {
        toast.error("Push alerts not configured yet (VAPID key missing).");
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast.error("Notifications blocked — browser settings मध्ये Allow करा.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));

      const json = sub.toJSON();
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          worker_id: user.id,
          endpoint: json.endpoint!,
          subscription: json as any,
          enabled: true,
        },
        { onConflict: "worker_id,endpoint" }
      );
      if (error) throw error;
      setOn(true);
      toast.success("Nearby job alerts चालू ✅");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not enable alerts");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass-card flex items-center justify-between gap-3 p-4">
      <div className="flex items-center gap-3">
        <Bell className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-semibold">Nearby Job Alerts</p>
          <p className="text-xs text-muted-foreground">जवळचं नवीन काम आल्यावर फोनवर notification</p>
        </div>
      </div>
      <Switch checked={on} disabled={busy} onCheckedChange={toggle} />
    </div>
  );
};
