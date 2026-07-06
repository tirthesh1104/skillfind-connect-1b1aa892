import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { Download, Share2, Star } from "lucide-react";
import { toast } from "sonner";

const MyQR = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [skill, setSkill] = useState<any>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("full_name, rating_avg, rating_count, profile_photo_url").eq("id", user.id).maybeSingle();
      setProfile(p);
      const { data: lp } = await supabase.from("labour_profiles").select("skill, price_per_day, experience_years").eq("user_id", user.id).maybeSingle();
      setSkill(lp);
    })();
  }, [user]);

  const url = `${window.location.origin}/worker/${user?.id}`;

  const download = async () => {
    if (!cardRef.current) return;
    try {
      const png = await toPng(cardRef.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `LabourConnect-${profile?.full_name || "card"}.png`;
      link.href = png;
      link.click();
    } catch { toast.error("Could not generate image"); }
  };

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "My Labour Connect Profile", url }); } catch { /* ignore */ }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Profile link copied");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My QR Card</h1>
        <p className="text-sm text-muted-foreground">Share this QR with any employer to show your verified profile.</p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div ref={cardRef} className="w-[320px] rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <InitialsAvatar name={profile?.full_name || "Worker"} size="lg" />
            <div className="min-w-0">
              <p className="truncate font-bold">{profile?.full_name || "Worker"}</p>
              <p className="text-xs opacity-80">{skill?.skill || "General"} · {skill?.experience_years ?? 0} yrs</p>
              <div className="mt-1 flex items-center gap-1 text-xs">
                <Star className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                {Number(profile?.rating_avg ?? 0).toFixed(1)} ({profile?.rating_count ?? 0})
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center rounded-xl bg-white p-3">
            <QRCodeSVG value={url} size={200} />
          </div>
          <p className="mt-3 text-center text-[10px] opacity-80">Scan to view verified profile · Labour Connector</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={download} className="bg-gradient-primary"><Download className="mr-1 h-4 w-4" /> Download</Button>
          <Button onClick={share} variant="outline"><Share2 className="mr-1 h-4 w-4" /> Share</Button>
        </div>
      </div>
    </div>
  );
};

export default MyQR;
