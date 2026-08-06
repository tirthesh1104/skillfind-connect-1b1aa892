import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const GovernmentId = () => {
  const { user } = useAuth();
  const [num, setNum] = useState("");
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles")
      .select("eshram_number, eshram_verified").eq("id", user.id).maybeSingle();
    setNum(data?.eshram_number ?? "");
    setVerified(!!data?.eshram_verified);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const verify = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("verify-eshram", {
      body: { eshram_number: num },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (!data?.verified) return toast.error(data?.reason || "Verification failed");
    toast.success("e-Shram number verified. You are government scheme eligible.");
    load();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
          <ShieldCheck className="h-6 w-6 text-primary" /> Government ID
        </h1>
        <p className="text-sm text-muted-foreground">
          Link your e-Shram / UAN card to unlock government scheme eligibility.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            e-Shram Card
            {verified && (
              <Badge className="gap-1"><BadgeCheck className="h-3 w-3" /> Government Scheme Eligible</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eshram">e-Shram / UAN number (12 digits)</Label>
            <Input id="eshram" value={num} maxLength={20} placeholder="e.g. 123456789012"
              onChange={(e) => setNum(e.target.value)} />
          </div>
          <Button onClick={verify} disabled={busy || !num.trim()}>
            {busy ? "Verifying..." : verified ? "Re-verify" : "Verify Now"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Verification currently checks the card number format. Live government API checks will be enabled later.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GovernmentId;
