import { forwardRef } from "react";

export interface IdCardData {
  id_card_number: string;
  full_name: string;
  skill?: string | null;
  experience_years?: number | null;
  phone?: string | null;
  upi_id?: string | null;
  rating_avg?: number | null;
  profile_photo_url?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  id_card_generated_at?: string | null;
  verified?: boolean;
  worker_user_id: string;
}

export const IdCard = forwardRef<HTMLDivElement, { data: IdCardData }>(({ data }, ref) => {
  const issued = data.id_card_generated_at ? new Date(data.id_card_generated_at) : new Date();
  const validUntil = new Date(issued); validUntil.setFullYear(validUntil.getFullYear() + 1);
  const profileUrl = `${window.location.origin}/worker/${data.worker_user_id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(profileUrl)}`;
  const maskedAcc = data.account_number ? `XXXX XXXX ${data.account_number.slice(-4)}` : "—";

  return (
    <div ref={ref} className="id-card mx-auto w-full max-w-[420px] rounded-2xl overflow-hidden shadow-elegant border-2 border-primary/30 bg-white text-black print:shadow-none print:border-black">
      <div className="bg-gradient-primary px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-widest opacity-90">🏗️ LABOUR CONNECTOR</p>
            <p className="text-sm font-bold">WORKER IDENTITY CARD</p>
          </div>
          <p className="text-[10px] font-mono">{data.id_card_number}</p>
        </div>
      </div>

      <div className="grid grid-cols-[120px_1fr] gap-3 p-4">
        <div className="space-y-2">
          {data.profile_photo_url ? (
            <img src={data.profile_photo_url} alt={data.full_name} className="h-28 w-28 rounded-lg object-cover border" />
          ) : (
            <div className="h-28 w-28 rounded-lg border-2 border-dashed flex items-center justify-center text-3xl bg-muted">👤</div>
          )}
          <img src={qrUrl} alt="QR" className="h-28 w-28 rounded-lg border bg-white" />
        </div>
        <div className="text-[11px] leading-relaxed space-y-1">
          <Row label="Name" value={data.full_name} />
          <Row label="Skill" value={data.skill ?? "—"} />
          <Row label="Exp" value={`${data.experience_years ?? 0} years`} />
          <Row label="Phone" value={data.phone ?? "—"} />
          <Row label="UPI" value={data.upi_id ?? "—"} />
          <Row label="Rating" value={`⭐ ${(data.rating_avg ?? 0).toFixed(1)}`} />
          <p className={`text-xs font-bold ${data.verified ? "text-green-600" : "text-orange-600"}`}>
            {data.verified ? "✅ Verified" : "⏳ Pending Verification"}
          </p>
        </div>
      </div>

      <div className="border-t bg-muted/40 px-4 py-2 text-[10px] space-y-0.5">
        <Row label="Bank" value={data.bank_name ?? "—"} />
        <Row label="A/C" value={maskedAcc} />
        <Row label="IFSC" value={data.ifsc_code ?? "—"} />
      </div>

      <div className="border-t bg-primary/5 px-4 py-2 text-[10px] flex justify-between text-muted-foreground">
        <span>Issued: {issued.toLocaleDateString()}</span>
        <span>Valid Until: {validUntil.toLocaleDateString()}</span>
      </div>
    </div>
  );
});
IdCard.displayName = "IdCard";

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-2"><span className="w-12 text-muted-foreground">{label}:</span><span className="font-medium truncate">{value}</span></div>
);
