// Server-side payslip: recalculates the payslip, builds a PDF and emails it via Resend.
// Requires RESEND_API_KEY. Client-side download stays unchanged; this is an extra option.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const FROM = Deno.env.get("PAYSLIP_EMAIL_FROM") || "SkillFind Payslip <onboarding@resend.dev>";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const { receipt_id } = await req.json().catch(() => ({}));
    if (!receipt_id || typeof receipt_id !== "string") return json({ error: "receipt_id is required" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: auth } = await anon.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) return json({ error: "Unauthorized" }, 401);

    const { data: r } = await admin.from("payment_receipts").select("*").eq("id", receipt_id).maybeSingle();
    if (!r) return json({ error: "Receipt not found" }, 404);
    if (r.labour_id !== uid && r.contractor_id !== uid) return json({ error: "Forbidden" }, 403);

    // Server-side recalculation
    const days = Number(r.days_worked ?? 0);
    const gross = Number(r.amount ?? 0);
    const { data: adv } = await admin
      .from("advances")
      .select("balance")
      .eq("worker_id", r.labour_id)
      .eq("contractor_id", r.contractor_id);
    const deductions = 0; // advances are tracked separately and not auto-deducted from a settled receipt
    const outstanding = (adv ?? []).reduce((s: number, a: any) => s + Number(a.balance ?? 0), 0);
    const net = gross - deductions;
    const rate = days > 0 ? Math.round(gross / days) : 0;

    // Build PDF
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    page.drawRectangle({ x: 0, y: 772, width: 595, height: 70, color: rgb(0.08, 0.39, 0.94) });
    page.drawText("LABOUR CONNECTOR", { x: 40, y: 812, size: 18, font: bold, color: rgb(1, 1, 1) });
    page.drawText("Digital Payslip / Salary Slip", { x: 40, y: 792, size: 10, font, color: rgb(1, 1, 1) });

    let y = 730;
    const line = (label: string, value: string) => {
      page.drawText(label, { x: 40, y, size: 11, font: bold });
      page.drawText(value, { x: 220, y, size: 11, font });
      y -= 22;
    };
    line("Slip No", String(r.receipt_number ?? "-"));
    line("Worker", String(r.labour_name ?? "-"));
    line("Skill", String(r.skill ?? "-"));
    line("Contractor", String(r.contractor_name ?? "-"));
    line("Paid On", new Date(r.created_at).toLocaleString("en-IN"));
    line("Days Worked", String(days));
    line("Daily Rate", `Rs. ${rate}`);
    line("Gross Pay", `Rs. ${gross}`);
    line("Deductions", `Rs. ${deductions}`);
    line("NET PAID", `Rs. ${net}`);
    line("Payment Method", String(r.payment_method ?? "-"));
    line("Reference", String(r.payment_reference ?? "-"));
    if (outstanding > 0) line("Advance Outstanding", `Rs. ${outstanding}`);
    page.drawText("Computer generated payslip - no signature required.", { x: 40, y: 60, size: 9, font });

    const bytes = await pdf.save();
    let b64 = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      b64 += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    const base64 = btoa(b64);

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) return json({ sent: false, reason: "no_api_key", detail: "RESEND_API_KEY not configured" });

    const recipients: string[] = [];
    const { data: w } = await admin.auth.admin.getUserById(r.labour_id);
    if (w?.user?.email) recipients.push(w.user.email);
    if (!recipients.length) return json({ sent: false, reason: "no_email" });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: recipients,
        subject: `Payslip ${r.receipt_number ?? ""} — Rs. ${net}`,
        html: `<div style="font-family:system-ui,sans-serif;line-height:1.6">
          <h2>Your payslip is attached</h2>
          <p>Worker: ${r.labour_name ?? "-"}<br/>Contractor: ${r.contractor_name ?? "-"}<br/>
          Days: ${days} · Gross: Rs. ${gross} · Net: Rs. ${net}</p>
        </div>`,
        attachments: [{ filename: `payslip-${r.receipt_number ?? receipt_id}.pdf`, content: base64 }],
      }),
    });

    if (!res.ok) return json({ sent: false, detail: (await res.text()).slice(0, 200) });
    return json({ sent: true, recipients: recipients.length, net, gross, days });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
