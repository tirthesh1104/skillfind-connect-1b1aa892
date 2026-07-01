import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";

export interface AppointmentLetterData {
  workerName: string;
  workerAadhaar?: string;
  workerAddress?: string;
  contractorName: string;
  contractorGst?: string;
  siteAddress: string;
  role: string;
  startDate: string;
  duration: string;
  wagePerDay: number;
  workingHours: string;
  pfEsic?: string;
  noticePeriod: string;
}

export function generateAppointmentLetterPDF(data: AppointmentLetterData): Blob {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 50;

  doc.setFont("helvetica", "bold").setFontSize(18);
  doc.text("APPOINTMENT LETTER", W / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(10).setFont("helvetica", "normal");
  doc.text("(As per New Labour Code 2025)", W / 2, y + 12, { align: "center" });
  y += 40;

  doc.setFontSize(11);
  const line = (label: string, val: string) => {
    doc.setFont("helvetica", "bold"); doc.text(label, 50, y);
    doc.setFont("helvetica", "normal"); doc.text(String(val || "—"), 200, y);
    y += 20;
  };
  doc.setFont("helvetica", "bold").setFontSize(13).text("Employer Details", 50, y); y += 20;
  line("Contractor:", data.contractorName);
  line("GST No:", data.contractorGst || "—");
  line("Site Address:", data.siteAddress);

  y += 10;
  doc.setFont("helvetica", "bold").setFontSize(13).text("Employee Details", 50, y); y += 20;
  line("Worker Name:", data.workerName);
  line("Aadhaar:", data.workerAadhaar || "—");
  line("Address:", data.workerAddress || "—");

  y += 10;
  doc.setFont("helvetica", "bold").setFontSize(13).text("Terms of Employment", 50, y); y += 20;
  line("Role:", data.role);
  line("Start Date:", data.startDate);
  line("Duration:", data.duration);
  line("Wage Rate:", `Rs. ${data.wagePerDay}/day`);
  line("Working Hours:", data.workingHours);
  line("PF / ESIC:", data.pfEsic || "As per statutory rules");
  line("Notice Period:", data.noticePeriod);

  y += 30;
  doc.setFont("helvetica", "italic").setFontSize(9);
  doc.text("This letter is issued in compliance with the Occupational Safety, Health and Working Conditions Code, 2020.", 50, y, { maxWidth: W - 100 });

  y = doc.internal.pageSize.getHeight() - 100;
  doc.setFont("helvetica", "normal").setFontSize(11);
  doc.text("_______________________", 60, y);
  doc.text("Contractor Signature", 60, y + 15);
  doc.text("_______________________", W - 220, y);
  doc.text("Worker Signature", W - 220, y + 15);

  return doc.output("blob");
}

export async function uploadAppointmentLetter(
  contractorId: string,
  workerId: string,
  blob: Blob,
): Promise<string> {
  const path = `${contractorId}/${workerId}/${Date.now()}.pdf`;
  const { error } = await supabase.storage.from("appointment-letters").upload(path, blob, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function getSignedLetterUrl(path: string): Promise<string> {
  const { data } = await supabase.storage.from("appointment-letters").createSignedUrl(path, 3600);
  return data?.signedUrl ?? "";
}

export function whatsappShareLink(phone: string, msg: string) {
  const p = phone.replace(/\D/g, "");
  return `https://wa.me/${p}?text=${encodeURIComponent(msg)}`;
}
