import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    period: "forever",
    features: ["5 hire requests / month", "1 active site", "Basic muster roll", "Receipts & payslips"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹499",
    period: "per month",
    highlight: true,
    features: [
      "Unlimited hire requests",
      "Up to 5 sites",
      "Multi-site dashboard & DPR",
      "Appointment letters + compliance",
      "Priority support",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: "₹1,499",
    period: "per month",
    features: [
      "Everything in Pro",
      "Unlimited sites & sub-contractors",
      "Material & budget analytics",
      "Bulk gang payouts",
      "Dedicated account manager",
    ],
  },
];

const Pricing = () => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("contractor_plans" as any)
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle();
      setPlan(((data as any)?.plan as string) ?? "free");
      setLoading(false);
    })();
  }, [user]);

  const choose = async (id: string) => {
    if (!user) return;
    setBusy(id);
    const { error } = await supabase.from("contractor_plans" as any).upsert(
      {
        user_id: user.id,
        plan: id,
        status: "active",
        started_at: new Date().toISOString(),
        expires_at: id === "free" ? null : new Date(Date.now() + 30 * 86400000).toISOString(),
      } as any,
      { onConflict: "user_id" }
    );
    setBusy(null);
    if (error) return toast.error(error.message);
    setPlan(id);
    toast.success(id === "free" ? "Switched to Free plan" : `${id === "pro" ? "Pro" : "Business"} plan activated for 30 days`);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Crown className="h-6 w-6 text-primary" /> Plans & Billing
        </h1>
        <p className="text-sm text-muted-foreground">तुमचा प्लॅन निवडा · Pick the plan that fits your sites.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const current = plan === p.id;
          return (
            <Card key={p.id} className={p.highlight ? "border-primary/60 shadow-glow" : undefined}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{p.name}</CardTitle>
                  {p.highlight && <Badge><Sparkles className="mr-1 h-3 w-3" />Popular</Badge>}
                  {current && !p.highlight && <Badge variant="secondary">Current</Badge>}
                </div>
                <p className="text-3xl font-bold">{p.price}<span className="ml-1 text-xs font-normal text-muted-foreground">{p.period}</span></p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={current ? "outline" : p.highlight ? "default" : "secondary"}
                  disabled={current || busy === p.id}
                  onClick={() => choose(p.id)}
                >
                  {busy === p.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {current ? "Current plan" : `Choose ${p.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Plans are activated instantly for 30 days. Online payment collection can be enabled later.
      </p>
    </div>
  );
};

export default Pricing;
