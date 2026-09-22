import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Wallet, IndianRupee, Clock, Receipt } from "lucide-react";
import { format } from "date-fns";
import { useRealtime } from "@/hooks/useRealtime";

interface Row {
  id: string;
  labour_id: string;
  contractor_id: string;
  skill: string | null;
  days_worked: number;
  daily_rate: number;
  amount_due: number;
  advance_paid: number;
  status: string;
  created_at: string;
  expected_payment_date: string | null;
}

const WageLedger = () => {
  const { user, role } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    let q = supabase.from("labour_payments").select("*").order("created_at", { ascending: false }).limit(300);
    if (role === "labour") q = q.eq("labour_id", user.id);
    else if (role === "contractor") q = q.eq("contractor_id", user.id);
    const { data } = await q;
    const list = (data ?? []) as Row[];
    setRows(list);
    const ids = Array.from(new Set(list.flatMap((r) => [r.labour_id, r.contractor_id])));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      const map: Record<string, string> = {};
      (profs ?? []).forEach((p: any) => (map[p.id] = p.full_name));
      setNames(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user, role]);
  useRealtime(["labour_payments", "payment_history"], load, !!user);

  const totals = useMemo(() => {
    const gross = rows.reduce((s, r) => s + r.days_worked * r.daily_rate, 0);
    const advances = rows.reduce((s, r) => s + (r.advance_paid ?? 0), 0);
    const paid = rows.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount_due, 0);
    const pending = rows.filter((r) => r.status !== "paid").reduce((s, r) => s + r.amount_due, 0);
    return { gross, advances, paid, pending };
  }, [rows]);

  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Wage Ledger</h1>
        <p className="text-sm text-muted-foreground">
          {role === "labour" ? "तुमची मजुरी, advance आणि बाकी रक्कम." : "Site-wise payroll: gross, advances, paid and outstanding."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={IndianRupee} label="Gross Wages" value={inr(totals.gross)} accent="primary" />
        <StatCard icon={Wallet} label="Advances" value={inr(totals.advances)} accent="warning" />
        <StatCard icon={Receipt} label="Paid" value={inr(totals.paid)} accent="success" />
        <StatCard icon={Clock} label="Outstanding" value={inr(totals.pending)} accent="warning" />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState icon={Wallet} title="No wage entries yet" description="Payments recorded on the platform appear here as an itemised ledger." />
      ) : (
        <div className="glass-card overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">{role === "labour" ? "Contractor" : "Worker"}</th>
                <th className="p-3">Skill</th>
                <th className="p-3">Days × Rate</th>
                <th className="p-3">Advance</th>
                <th className="p-3">Net Due</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/50">
                  <td className="p-3 text-muted-foreground">{format(new Date(r.created_at), "dd MMM yy")}</td>
                  <td className="p-3">{names[role === "labour" ? r.contractor_id : r.labour_id] ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{r.skill ?? "—"}</td>
                  <td className="p-3">{r.days_worked} × {inr(r.daily_rate)}</td>
                  <td className="p-3 text-muted-foreground">{inr(r.advance_paid ?? 0)}</td>
                  <td className="p-3 font-semibold">{inr(r.amount_due)}</td>
                  <td className="p-3">
                    <Badge variant={r.status === "paid" ? "default" : "secondary"} className="capitalize">{r.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WageLedger;
