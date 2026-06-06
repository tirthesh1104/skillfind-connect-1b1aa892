import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Download, Share2, Copy, AlertCircle } from "lucide-react";
import { IdCard, IdCardData } from "@/components/IdCard";

const MyIdCard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<IdCardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      const { data: lp } = await supabase.from("labour_profiles").select("skill, experience_years").eq("user_id", user.id).maybeSingle();
      if (!p?.id_card_number) { setLoading(false); return; }
      setData({
        id_card_number: p.id_card_number,
        full_name: p.full_name,
        skill: lp?.skill,
        experience_years: lp?.experience_years,
        phone: p.phone,
        upi_id: p.upi_id,
        rating_avg: p.rating_avg,
        profile_photo_url: p.profile_photo_url,
        bank_name: p.bank_name,
        account_number: p.account_number,
        ifsc_code: p.ifsc_code,
        id_card_generated_at: p.id_card_generated_at,
        verified: !!p.aadhaar_last4,
        worker_user_id: p.id,
      });
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <Skeleton className="h-96" />;
  if (!data) return (
    <div className="max-w-md mx-auto text-center space-y-4 py-12">
      <AlertCircle className="h-12 w-12 mx-auto text-orange-500" />
      <h2 className="text-xl font-bold">Complete your profile first</h2>
      <p className="text-sm text-muted-foreground">Fill your details to generate your ID Card.</p>
      <Button onClick={() => navigate("/my-payment-details")} className="bg-gradient-primary">Complete Profile</Button>
    </div>
  );

  const copyId = () => { navigator.clipboard.writeText(data.id_card_number); toast.success("ID copied!"); };
  const share = async () => {
    const url = `${window.location.origin}/worker/${data.worker_user_id}`;
    if (navigator.share) {
      try { await navigator.share({ title: "My Worker ID", text: `${data.full_name} — ${data.id_card_number}`, url }); }
      catch {}
    } else {
      navigator.clipboard.writeText(url); toast.success("Profile link copied!");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold md:text-3xl">🪪 My ID Card</h1>
        <p className="text-sm text-muted-foreground">Show this QR to contractors for instant verification & payment.</p>
      </div>

      <div className="print-only-card"><IdCard data={data} /></div>

      <div className="flex flex-wrap gap-2 print:hidden">
        <Button onClick={() => window.print()} className="bg-gradient-primary"><Download className="mr-1 h-4 w-4" />Download / Print</Button>
        <Button variant="outline" onClick={share}><Share2 className="mr-1 h-4 w-4" />Share</Button>
        <Button variant="outline" onClick={copyId}><Copy className="mr-1 h-4 w-4" />Copy ID: {data.id_card_number}</Button>
      </div>
    </div>
  );
};

export default MyIdCard;
