import jsPDF from "jspdf";

export interface PayslipInput {
  receipt_number?: string | null;
  payment_reference?: string | null;
  labour_name: string;
  labour_id_card?: string | null;
  skill?: string | null;
  contractor_name: string;
  period_from?: string | null;
  period_to?: string | null;
  days_worked?: number | null;
  daily_rate?: number | null;
  gross: number;
  advance_deducted?: number | null;
  net: number;
  payment_method: string;
  upi_id?: string | null;
  paid_on: string;
}

export const generatePayslip = (data: PayslipInput) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 50;

  // Header
  doc.setFillColor(20, 100, 240);
  doc.rect(0, 0, W, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20).setFont("helvetica", "bold");
  doc.text("LABOUR CONNECTOR", 40, 30);
  doc.setFontSize(10).setFont("helvetica", "normal");
  doc.text("Digital Payslip / Salary Slip", 40, 48);
  doc.setFontSize(9);
  doc.text(`Issued: ${new Date().toLocaleDateString()}`, W - 40, 30, { align: "right" });
  doc.text(`Slip No: ${data.receipt_number || data.payment_reference || "—"}`, W - 40, 48, { align: "right" });

  doc.setTextColor(0, 0, 0);
  y = 100;

  // Worker / Contractor
  doc.setFontSize(11).setFont("helvetica", "bold");
  doc.text("WORKER DETAILS", 40, y);
  doc.text("CONTRACTOR DETAILS", W / 2 + 10, y);
  y += 6;
  doc.setLineWidth(0.5).line(40, y, W - 40, y);
  y += 16;

  doc.setFontSize(10).setFont("helvetica", "normal");
  const wl: [string, string][] = [
    ["Name", data.labour_name],
    ["Worker ID", data.labour_id_card || "—"],
    ["Skill", data.skill || "—"],
    ["UPI", data.upi_id || "—"],
  ];
  const cl: [string, string][] = [
    ["Name", data.contractor_name],
    ["Paid On", new Date(data.paid_on).toLocaleString()],
    ["Method", data.payment_method],
    ["Reference", data.payment_reference || "—"],
  ];
  wl.forEach(([k, v], i) => {
    doc.setFont("helvetica", "bold").text(`${k}:`, 40, y + i * 16);
    doc.setFont("helvetica", "normal").text(String(v).slice(0, 40), 110, y + i * 16);
  });
  cl.forEach(([k, v], i) => {
    doc.setFont("helvetica", "bold").text(`${k}:`, W / 2 + 10, y + i * 16);
    doc.setFont("helvetica", "normal").text(String(v).slice(0, 40), W / 2 + 90, y + i * 16);
  });
  y += 16 * 4 + 20;

  // Period
  doc.setFont("helvetica", "bold").setFontSize(11);
  doc.text("WORK PERIOD", 40, y);
  y += 6;
  doc.line(40, y, W - 40, y);
  y += 16;
  doc.setFont("helvetica", "normal").setFontSize(10);
  doc.text(`From: ${data.period_from ? new Date(data.period_from).toLocaleDateString() : "—"}`, 40, y);
  doc.text(`To: ${data.period_to ? new Date(data.period_to).toLocaleDateString() : "—"}`, 200, y);
  doc.text(`Days Worked: ${data.days_worked ?? "—"}`, 360, y);
  y += 30;

  // Earnings
  doc.setFont("helvetica", "bold").setFontSize(11);
  doc.text("EARNINGS BREAKDOWN", 40, y);
  y += 6;
  doc.line(40, y, W - 40, y);
  y += 20;

  const rate = data.daily_rate ?? (data.days_worked ? Math.round(data.gross / Math.max(data.days_worked, 1)) : 0);
  const lines: [string, string][] = [
    ["Daily Rate", `Rs ${rate.toLocaleString()}`],
    ["Days Worked", String(data.days_worked ?? 0)],
    ["Gross Earnings", `Rs ${data.gross.toLocaleString()}`],
    ["Advance Recovery", `- Rs ${(data.advance_deducted || 0).toLocaleString()}`],
  ];
  doc.setFont("helvetica", "normal").setFontSize(10);
  lines.forEach(([k, v]) => {
    doc.text(k, 60, y);
    doc.text(v, W - 60, y, { align: "right" });
    y += 18;
  });

  y += 6;
  doc.setLineWidth(1).line(40, y, W - 40, y);
  y += 22;
  doc.setFont("helvetica", "bold").setFontSize(13);
  doc.setFillColor(230, 255, 230);
  doc.rect(40, y - 16, W - 80, 26, "F");
  doc.text("NET PAID", 60, y);
  doc.text(`Rs ${data.net.toLocaleString()}`, W - 60, y, { align: "right" });

  // Footer
  doc.setFont("helvetica", "italic").setFontSize(8).setTextColor(120, 120, 120);
  doc.text(
    "This is a system-generated payslip from Labour Connector. Keep this for your records.",
    W / 2,
    doc.internal.pageSize.getHeight() - 30,
    { align: "center" }
  );

  doc.save(`Payslip-${data.receipt_number || data.labour_name}-${Date.now()}.pdf`);
};
