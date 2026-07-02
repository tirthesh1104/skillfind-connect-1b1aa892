import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/role-chatbot`;

type Flag = { entity: string; id: string; severity: "high" | "medium" | "low"; reason: string };

export default function AdminFraud() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [aiReport, setAiReport] = useState("");
  const [loading, setLoading] = useState(false);

  const scan = async () => {
    setLoading(true);
    setFlags([]);
    setAiReport("");
    try {
      const [{ data: profiles }, { data: jobs }, { data: pays }, { data: disputes }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, phone, upi_verified, profile_complete, created_at"),
        supabase.from("jobs").select("id, title, price_offered, contractor_id, created_at, status"),
        supabase.from("labour_payments").select("id, amount, status, contractor_id, labour_id, created_at"),
        supabase.from("disputes").select("id, status, created_at"),
      ]);

      const found: Flag[] = [];

      // Rule 1: duplicate phones
      const phoneMap: Record<string, string[]> = {};
      (profiles ?? []).forEach((p: any) => {
        if (!p.phone) return;
        (phoneMap[p.phone] ||= []).push(p.id);
      });
      Object.entries(phoneMap).forEach(([phone, ids]) => {
        if (ids.length > 1) ids.forEach(id => found.push({ entity: "profile", id, severity: "high", reason: `Duplicate phone ${phone} (${ids.length} accounts)` }));
      });

      // Rule 2: jobs below likely minimum
      (jobs ?? []).forEach((j: any) => {
        if (j.price_offered && j.price_offered < 400)
          found.push({ entity: "job", id: j.id, severity: "high", reason: `Job "${j.title}" pays ₹${j.price_offered}/day — below Maharashtra minimum` });
      });

      // Rule 3: unpaid old payments
      const now = Date.now();
      (pays ?? []).forEach((p: any) => {
        const age = (now - new Date(p.created_at).getTime()) / 86400000;
        if (p.status !== "Paid" && age > 30)
          found.push({ entity: "payment", id: p.id, severity: "medium", reason: `Payment ₹${p.amount} unpaid ${Math.floor(age)} days` });
      });

      // Rule 4: incomplete profiles older than 14 days
      (profiles ?? []).forEach((p: any) => {
        const age = (now - new Date(p.created_at).getTime()) / 86400000;
        if (!p.profile_complete && age > 14)
          found.push({ entity: "profile", id: p.id, severity: "low", reason: `${p.full_name || "User"} — profile incomplete ${Math.floor(age)}d` });
      });

      setFlags(found);

      // AI summary
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          role: "admin",
          language: "en",
          context: {
            total_profiles: profiles?.length ?? 0,
            total_jobs: jobs?.length ?? 0,
            open_disputes: (disputes ?? []).filter((d: any) => d.status === "open").length,
            flags_found: found.length,
          },
          messages: [{
            role: "user",
            content: `Fraud scan found ${found.length} flags. Top issues:\n${found.slice(0, 10).map(f => `- [${f.severity}] ${f.reason}`).join("\n")}\n\nGive a 3-line executive summary and top 3 admin actions to take now.`,
          }],
        }),
      });
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "", acc = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n"); buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const d = line.slice(5).trim();
            if (!d || d === "[DONE]") continue;
            try {
              const j = JSON.parse(d);
              const delta = j.choices?.[0]?.delta?.content;
              if (delta) { acc += delta; setAiReport(acc); }
            } catch {}
          }
        }
      }
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldAlert className="h-7 w-7 text-primary" /> Fraud Detection</h1>
          <p className="text-muted-foreground text-sm mt-1">AI-assisted anomaly scan across profiles, jobs, and payments.</p>
        </div>
        <Button onClick={scan} disabled={loading}><Sparkles className="mr-2 h-4 w-4" />{loading ? "Scanning..." : "Run Scan"}</Button>
      </div>

      {aiReport && (
        <Card>
          <CardHeader><CardTitle>AI Summary</CardTitle></CardHeader>
          <CardContent><div className="whitespace-pre-wrap text-sm">{aiReport}</div></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Flags ({flags.length})</CardTitle></CardHeader>
        <CardContent>
          {flags.length === 0 ? (
            <p className="text-sm text-muted-foreground">Run a scan to detect anomalies.</p>
          ) : (
            <div className="space-y-2">
              {flags.map((f, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 ${f.severity === "high" ? "text-destructive" : f.severity === "medium" ? "text-amber-500" : "text-muted-foreground"}`} />
                  <div className="flex-1">
                    <p className="text-sm">{f.reason}</p>
                    <p className="text-xs text-muted-foreground">{f.entity} · {f.id.slice(0, 8)}</p>
                  </div>
                  <Badge variant={f.severity === "high" ? "destructive" : "secondary"}>{f.severity}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
