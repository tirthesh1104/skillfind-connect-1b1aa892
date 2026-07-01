import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  AppointmentLetterData,
  generateAppointmentLetterPDF,
  uploadAppointmentLetter,
  getSignedLetterUrl,
  whatsappShareLink,
} from "@/lib/appointmentLetter";
import { FileText, Download, Share2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workerId: string;
  workerName: string;
  workerPhone?: string;
  contractorName: string;
  defaultWage?: number;
  jobId?: string;
}

export const AppointmentLetterDialog = ({
  open, onOpenChange, workerId, workerName, workerPhone,
  contractorName, defaultWage = 500, jobId,
}: Props) => {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<AppointmentLetterData>({
    workerName,
    workerAadhaar: "",
    workerAddress: "",
    contractorName,
    contractorGst: "",
    siteAddress: "",
    role: "General Labour",
    startDate: new Date().toISOString().slice(0, 10),
    duration: "30 days",
    wagePerDay: defaultWage,
    workingHours: "8 hours/day",
    pfEsic: "As applicable",
    noticePeriod: "7 days",
  });
  const [pdfPath, setPdfPath] = useState<string | null>(null);

  const set = <K extends keyof AppointmentLetterData>(k: K, v: AppointmentLetterData[K]) =>
    setData(d => ({ ...d, [k]: v }));

  const generate = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const blob = generateAppointmentLetterPDF(data);
      const path = await uploadAppointmentLetter(user.id, workerId, blob);
      await supabase.from("appointment_letters" as any).insert({
        job_id: jobId ?? null,
        worker_id: workerId,
        contractor_id: user.id,
        content_json: data as any,
        pdf_url: path,
        status: "signed",
        signed_at: new Date().toISOString(),
      });
      setPdfPath(path);
      toast.success("Appointment letter generated");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate letter");
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    if (!pdfPath) return;
    const url = await getSignedLetterUrl(pdfPath);
    window.open(url, "_blank");
  };

  const shareWA = async () => {
    if (!pdfPath || !workerPhone) { toast.error("Worker phone missing"); return; }
    const url = await getSignedLetterUrl(pdfPath);
    const msg = `नमस्कार ${workerName}, तुमचं Appointment Letter येथे आहे: ${url}`;
    window.open(whatsappShareLink(workerPhone, msg), "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/> Appointment Letter</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Worker Name</Label><Input value={data.workerName} onChange={e=>set("workerName", e.target.value)} /></div>
          <div><Label>Aadhaar (last 4)</Label><Input value={data.workerAadhaar} onChange={e=>set("workerAadhaar", e.target.value)} placeholder="XXXX-XXXX-1234" /></div>
          <div className="sm:col-span-2"><Label>Worker Address</Label><Textarea rows={2} value={data.workerAddress} onChange={e=>set("workerAddress", e.target.value)} /></div>
          <div><Label>Contractor</Label><Input value={data.contractorName} onChange={e=>set("contractorName", e.target.value)} /></div>
          <div><Label>GST No.</Label><Input value={data.contractorGst} onChange={e=>set("contractorGst", e.target.value)} /></div>
          <div className="sm:col-span-2"><Label>Site Address</Label><Textarea rows={2} value={data.siteAddress} onChange={e=>set("siteAddress", e.target.value)} /></div>
          <div><Label>Role</Label><Input value={data.role} onChange={e=>set("role", e.target.value)} /></div>
          <div><Label>Start Date</Label><Input type="date" value={data.startDate} onChange={e=>set("startDate", e.target.value)} /></div>
          <div><Label>Duration</Label><Input value={data.duration} onChange={e=>set("duration", e.target.value)} /></div>
          <div><Label>Wage / day (₹)</Label><Input type="number" value={data.wagePerDay} onChange={e=>set("wagePerDay", Number(e.target.value))} /></div>
          <div><Label>Working Hours</Label><Input value={data.workingHours} onChange={e=>set("workingHours", e.target.value)} /></div>
          <div><Label>PF / ESIC</Label><Input value={data.pfEsic} onChange={e=>set("pfEsic", e.target.value)} /></div>
          <div><Label>Notice Period</Label><Input value={data.noticePeriod} onChange={e=>set("noticePeriod", e.target.value)} /></div>
        </div>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          {!pdfPath ? (
            <Button onClick={generate} disabled={busy} className="w-full sm:w-auto">
              <FileText className="mr-2 h-4 w-4"/> {busy ? "Generating..." : "Generate PDF"}
            </Button>
          ) : (
            <>
              <Button onClick={download} variant="outline"><Download className="mr-2 h-4 w-4"/>Download</Button>
              <Button onClick={shareWA}><Share2 className="mr-2 h-4 w-4"/>Send via WhatsApp</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
