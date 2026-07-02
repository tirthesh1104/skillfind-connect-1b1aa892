import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { toast } from "sonner";

export default function AdminInsuranceClaims() {
  const [claims, setClaims] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase
      .from("insurance_claims")
      .select("*, profiles:user_id(full_name, phone)")
      .order("created_at", { ascending: false });
    setClaims(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const decide = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("insurance_claims").update({
      status, admin_note: notes[id] ?? null,
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Claim ${status}`);
    load();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Shield className="h-7 w-7 text-primary" /> Insurance Claims</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and decide worker claims against the pool.</p>
      </div>

      {claims.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No claims yet.</CardContent></Card>
      ) : claims.map(c => (
        <Card key={c.id}>
          <CardHeader className="flex-row items-start justify-between">
            <CardTitle className="text-base">₹{c.claim_amount} · {c.profiles?.full_name ?? "User"}</CardTitle>
            <Badge variant={c.status === "approved" ? "default" : c.status === "rejected" ? "destructive" : "secondary"}>{c.status}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">{c.description}</p>
            <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</p>
            {c.status === "pending" && (
              <>
                <Textarea placeholder="Admin note (optional)" value={notes[c.id] ?? ""} onChange={e => setNotes(n => ({ ...n, [c.id]: e.target.value }))} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => decide(c.id, "approved")}>Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => decide(c.id, "rejected")}>Reject</Button>
                </div>
              </>
            )}
            {c.admin_note && c.status !== "pending" && (
              <p className="text-xs bg-muted rounded p-2"><b>Admin note:</b> {c.admin_note}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
