import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileSpreadsheet, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const monthOptions = () => {
  const now = new Date();
  return Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleString(undefined, { month: "long", year: "numeric" }) };
  });
};

const MusterRoll = () => {
  const { user } = useAuth();
  const [month, setMonth] = useState(monthOptions()[0].value);
  const [rows, setRows] = useState<any[]>([]);
  const [company, setCompany] = useState("");
  const [siteAddress, setSiteAddress] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("contractor_profiles").select("company_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setCompany(data?.company_name ?? ""));
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, month]);

  const load = async () => {
    if (!user) return;
    const [y, m] = month.split("-").map(Number);
    const start = new Date(y, m - 1, 1).toISOString();
    const end = new Date(y, m, 1).toISOString();
    // labour_payments has no work-date columns; the payment record's created_at
    // is the authoritative month filter (matches Form XVI attendance month).
    const { data, error } = await supabase.from("labour_payments")
      .select("labour_id, days_worked, skill, daily_rate, amount_due, created_at, profiles:labour_id(full_name, phone, aadhaar_last4)")
      .eq("contractor_id", user.id)
      .gte("created_at", start)
      .lt("created_at", end);
    if (error) { console.error("MusterRoll load failed:", error.message); setRows([]); return; }
    setRows((data as any) ?? []);
  };

  const exportPDF = () => {
    if (rows.length === 0) return toast.error("No attendance data for this month");
    const doc = new jsPDF({ orientation: "landscape" });
    const [y, m] = month.split("-").map(Number);
    const label = new Date(y, m - 1, 1).toLocaleString(undefined, { month: "long", year: "numeric" });

    doc.setFontSize(16); doc.text("MUSTER ROLL (Form XVI)", 148, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Contractor / Company: ${company || "—"}`, 14, 25);
    doc.text(`Site: ${siteAddress || "—"}`, 14, 31);
    doc.text(`Month: ${label}`, 14, 37);
    doc.text("Under: Building & Other Construction Workers (BOCW) Act, 1996", 14, 43);

    autoTable(doc, {
      startY: 50,
      head: [["#", "Worker Name", "Phone", "Aadhaar (last 4)", "Skill", "Days", "Daily ₹", "Total ₹"]],
      body: rows.map((r, i) => [
        i + 1,
        r.profiles?.full_name ?? "—",
        r.profiles?.phone ?? "—",
        r.profiles?.aadhaar_last4 ? `XXXX-${r.profiles.aadhaar_last4}` : "—",
        r.skill ?? "—",
        r.days_worked ?? 0,
        r.daily_rate ?? 0,
        r.amount_due ?? 0,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 41, 59] },
    });

    const totalDays = rows.reduce((s, r) => s + (r.days_worked || 0), 0);
    const totalAmt = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
    const y2 = (doc as any).lastAutoTable.finalY + 8;
    doc.text(`Total workers: ${rows.length}   |   Total mandays: ${totalDays}   |   Total wages: ₹${totalAmt.toLocaleString()}`, 14, y2);
    doc.text("Contractor Signature: __________________          Inspector: __________________", 14, y2 + 15);

    doc.save(`Muster-Roll-${month}.pdf`);
    toast.success("Muster Roll downloaded");
  };

  const totalDays = rows.reduce((s, r) => s + (r.days_worked || 0), 0);
  const totalAmt = rows.reduce((s, r) => s + Number(r.amount_due || 0), 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <FileSpreadsheet className="h-7 w-7 text-primary" /> Muster Roll / हजेरी पत्रक
        </h1>
        <p className="text-sm text-muted-foreground">BOCW-compliant monthly attendance register (Form XVI)</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Generate for month</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div>
            <Label>Month</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={month} onChange={(e) => setMonth(e.target.value)}>
              {monthOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <Label>Site address (printed on register)</Label>
            <Input value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} placeholder="e.g. Wakad Housing Project, Pune" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Preview — {rows.length} workers, {totalDays} mandays, ₹{totalAmt.toLocaleString()}</CardTitle>
          <Button onClick={exportPDF} className="bg-gradient-primary" disabled={rows.length === 0}>
            <Download className="mr-1 h-4 w-4" /> Download PDF
          </Button>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attendance records for this month.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left border-b">
                  <tr>
                    <th className="p-2">Worker</th><th className="p-2">Skill</th>
                    <th className="p-2 text-right">Days</th><th className="p-2 text-right">Daily ₹</th><th className="p-2 text-right">Total ₹</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-2">{r.profiles?.full_name ?? "—"}</td>
                      <td className="p-2">{r.skill ?? "—"}</td>
                      <td className="p-2 text-right">{r.days_worked}</td>
                      <td className="p-2 text-right">₹{r.daily_rate}</td>
                      <td className="p-2 text-right font-medium">₹{r.amount_due}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MusterRoll;
