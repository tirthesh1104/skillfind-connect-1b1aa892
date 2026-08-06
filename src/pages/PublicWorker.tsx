import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HardHat, MessageCircle, IndianRupee } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const PublicWorker = () => {
  const { id } = useParams();
  const [worker, setWorker] = useState<any>(null);
  const [skill, setSkill] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: w } = await supabase.rpc("get_public_worker", { _user_id: id });
      const { data: s } = await supabase.rpc("get_public_worker_skill", { _user_id: id });
      setWorker(Array.isArray(w) ? w[0] : w);
      setSkill(Array.isArray(s) ? s[0] : s);
      const { data: b } = await supabase.from("worker_skill_badges").select("id, skill_name, badge_level").eq("worker_id", id);
      setBadges(b ?? []);
      setLoading(false);
    })();
  }, [id]);

  const payViaUPI = () => {
    if (!worker?.upi_id) return toast.error("Worker hasn't added UPI");
    const amt = prompt("Enter amount to pay (₹):");
    if (!amt) return;
    const url = `upi://pay?pa=${worker.upi_id}&pn=${encodeURIComponent(worker.full_name)}&am=${amt}&cu=INR&tn=Wage+Payment`;
    window.location.href = url;
  };

  if (loading) return <div className="max-w-md mx-auto p-6"><Skeleton className="h-96" /></div>;
  if (!worker) return <div className="max-w-md mx-auto p-6 text-center">Worker not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background p-4 md:p-8">
      <div className="max-w-md mx-auto space-y-4">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <HardHat className="h-4 w-4" /> Labour Connector
        </Link>

        <Card className="overflow-hidden">
          <div className="bg-gradient-primary h-20" />
          <CardContent className="-mt-12 space-y-3">
            {worker.profile_photo_url ? (
              <img src={worker.profile_photo_url} alt={worker.full_name} className="h-24 w-24 rounded-full border-4 border-background object-cover" />
            ) : (
              <div className="h-24 w-24 rounded-full border-4 border-background bg-muted flex items-center justify-center text-3xl">👤</div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{worker.full_name}</h1>
              <p className="text-sm text-muted-foreground font-mono">{worker.id_card_number}</p>
            </div>

            <div className="space-y-1 text-sm border-t pt-3">
              <Row label="Skill" value={skill?.skill ?? "—"} />
              <Row label="Experience" value={`${skill?.experience_years ?? 0} years`} />
              <Row label="Rate" value={skill?.price_per_day ? `₹${skill.price_per_day}/day` : "—"} />
              <Row label="Rating" value={`⭐ ${(worker.rating_avg ?? 0).toFixed(1)} (${worker.rating_count ?? 0})`} />
              <Row label="Phone" value={worker.phone ?? "—"} />
              <Row label="Location" value={worker.location ?? "—"} />
              <Row label="Verified" value={worker.upi_id ? "✅ Yes" : "⏳ Pending"} />
            </div>

            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {badges.map((b) => (
                  <Badge key={b.id} variant="secondary">🏅 {b.skill_name} · {b.badge_level}</Badge>
                ))}
              </div>
            )}

            <div className="grid gap-2 pt-3">
              <Button onClick={payViaUPI} className="bg-gradient-primary" disabled={!worker.upi_id}>
                <IndianRupee className="mr-1 h-4 w-4" />💸 Pay This Worker
              </Button>
              <Button variant="outline" asChild>
                <Link to="/messages"><MessageCircle className="mr-1 h-4 w-4" />Send Message</Link>
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground text-center pt-2">
              Sensitive info (Aadhaar, full account number) is hidden for privacy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between border-b last:border-0 py-1">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default PublicWorker;
