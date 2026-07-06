import jsPDF from "jspdf";

export interface CertificateInput {
  certificate_number: string;
  worker_name: string;
  contractor_name: string;
  job_title: string;
  site_name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  skills?: string | null;
  issued_at: string;
}

export const generateCompletionCertificate = (data: CertificateInput) => {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Border
  doc.setDrawColor(20, 100, 240).setLineWidth(4).rect(24, 24, W - 48, H - 48);
  doc.setDrawColor(180, 200, 240).setLineWidth(1).rect(36, 36, W - 72, H - 72);

  // Title
  doc.setTextColor(20, 100, 240).setFontSize(28).setFont("helvetica", "bold");
  doc.text("CERTIFICATE OF COMPLETION", W / 2, 100, { align: "center" });

  doc.setTextColor(80, 80, 80).setFontSize(12).setFont("helvetica", "normal");
  doc.text("Issued by Labour Connector", W / 2, 122, { align: "center" });

  doc.setTextColor(0, 0, 0).setFontSize(13).setFont("helvetica", "normal");
  doc.text("This is to certify that", W / 2, 170, { align: "center" });

  doc.setFontSize(26).setFont("helvetica", "bold").setTextColor(20, 30, 60);
  doc.text(data.worker_name, W / 2, 210, { align: "center" });

  doc.setFontSize(12).setFont("helvetica", "normal").setTextColor(60, 60, 60);
  const body = `has successfully completed the assignment "${data.job_title}"${data.site_name ? ` at ${data.site_name}` : ""} under contractor ${data.contractor_name}.`;
  const lines = doc.splitTextToSize(body, W - 200);
  doc.text(lines, W / 2, 250, { align: "center" });

  const rangeY = 320;
  doc.setFontSize(11).setFont("helvetica", "bold");
  doc.text(`Duration:`, W / 2 - 200, rangeY);
  doc.text(`Skills:`, W / 2 - 200, rangeY + 24);
  doc.text(`Certificate No:`, W / 2 - 200, rangeY + 48);

  doc.setFont("helvetica", "normal");
  doc.text(
    `${data.start_date ? new Date(data.start_date).toLocaleDateString() : "—"}  to  ${data.end_date ? new Date(data.end_date).toLocaleDateString() : "—"}`,
    W / 2 - 90,
    rangeY
  );
  doc.text(data.skills || "—", W / 2 - 90, rangeY + 24);
  doc.text(data.certificate_number, W / 2 - 90, rangeY + 48);

  // Signature
  doc.setDrawColor(120, 120, 120).line(80, H - 90, 260, H - 90);
  doc.setFontSize(10).text(data.contractor_name, 170, H - 74, { align: "center" });
  doc.setFontSize(9).setTextColor(120, 120, 120).text("Contractor Signature", 170, H - 60, { align: "center" });

  doc.setDrawColor(120, 120, 120).line(W - 260, H - 90, W - 80, H - 90);
  doc.setFontSize(10).setTextColor(0, 0, 0).text("Labour Connector", W - 170, H - 74, { align: "center" });
  doc.setFontSize(9).setTextColor(120, 120, 120).text(`Issued ${new Date(data.issued_at).toLocaleDateString()}`, W - 170, H - 60, { align: "center" });

  doc.save(`Certificate-${data.certificate_number}.pdf`);
};
