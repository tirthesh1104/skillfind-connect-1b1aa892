import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, HandCoins } from "lucide-react";
import { toast } from "sonner";

const MONTHLY = 100;

export default function Insurance() {
  const { user } = useAuth();
  const [pool, setPool] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [poolTotal, setPoolTotal] = useState(0);
  const [amt, setAmt] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    const [{ data: p }, { data: c }, { data: all }] = await Promise.all([
      supabase.from("insurance_pool").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("insurance_claims").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("insurance_pool").select("total_contributed"),
    ]);
    setPool(p);
    setClaims(c ?? []);
    setPoolTotal((all ?? []).reduce((s: number, r: any) => s + (r.total_contributed ?? 0), 0));
  };

  useEffect(() => { load(); }, [user]);

  const toggleOptIn = async (v: boolean) => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("insurance_pool").upsert({
      user_id: user.id,
      is_opted_in: v,
      total_contributed: pool?.total_contributed ?? (v ? MONTHLY : 0),
    }, { onConflict: "user_id" });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(v ? "Joined insurance pool (₹100 contributed)" : "Opted out");
    load();
  };

  const contribute = async () => {
    if (!user || !pool) return;
    setLoading(true);
    const { error } = await supabase.from("insurance_pool")
      .update({ total_contributed: (pool.total_contributed ?? 0) + MONTHLY })
      .eq("user_id", user.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(`₹${MONTHLY} contributed`);
    load();
  };

  const fileClaim = async () => {
    if (!user) return;
    const n = Number(amt);
    if (!n || !desc.trim()) return toast.error("Enter amount and description");
    setLoading(true);
    const { error } = await supabase.from("insurance_claims").insert({
      user_id: user.id, claim_amount: n, description: desc, status: "pending",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Claim submitted");
    setAmt(""); setDesc("");
    load();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Shield className="h-7 w-7 text-primary" /> Micro-Insurance Pool</h1>
        <p className="text-muted-foreground text-sm mt-1">Community fund for workers. ₹100/month gives access to emergency claims.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Pool Status</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-xs text-muted-foreground">Total Pool</p>
              <p className="text-2xl font-bold">₹{poolTotal.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-xs text-muted-foreground">Your Contribution</p>
              <p className="text-2xl font-bold">₹{(pool?.total_contributed ?? 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="opt" className="flex-1">Opt-in to insurance pool</Label>
            <Switch id="opt" checked={!!pool?.is_opted_in} onCheckedChange={toggleOptIn} disabled={loading} />
          </div>
          {pool?.is_opted_in && (
            <Button onClick={contribute} disabled={loading} className="w-full">
              <HandCoins className="mr-2 h-4 w-4" /> Contribute ₹{MONTHLY} this month
            </Button>
          )}
        </CardContent>
      </Card>

      {pool?.is_opted_in && (
        <Card>
          <CardHeader><CardTitle>File a Claim</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Amount (₹)</Label>
              <Input type="number" value={amt} onChange={e => setAmt(e.target.value)} placeholder="5000" />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Injury at site, medical bill, etc." />
            </div>
            <Button onClick={fileClaim} disabled={loading}>Submit Claim</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>My Claims</CardTitle></CardHeader>
        <CardContent>
          {claims.length === 0 ? (
            <p className="text-sm text-muted-foreground">No claims yet.</p>
          ) : (
            <div className="space-y-2">
              {claims.map(c => (
                <div key={c.id} className="flex items-start justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-semibold">₹{c.claim_amount}</p>
                    <p className="text-sm text-muted-foreground">{c.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(c.created_at).toLocaleDateString()}</p>
                    {c.admin_note && <p className="text-xs mt-1"><b>Admin:</b> {c.admin_note}</p>}
                  </div>
                  <Badge variant={c.status === "approved" ? "default" : c.status === "rejected" ? "destructive" : "secondary"}>
                    {c.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
