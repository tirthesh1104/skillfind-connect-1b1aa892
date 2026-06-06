import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy } from "lucide-react";
import { IdCard, IdCardData } from "./IdCard";
import { toast } from "sonner";

export const IdCardModal = ({ open, onOpenChange, data, onPay }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  data: IdCardData | null;
  onPay?: () => void;
}) => {
  if (!data) return null;
  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/worker/${data.worker_user_id}`);
    toast.success("Profile link copied!");
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>🪪 Worker ID Card</DialogTitle></DialogHeader>
        <IdCard data={data} />
        <div className="flex flex-wrap gap-2">
          {onPay && <Button className="bg-gradient-primary flex-1" onClick={onPay}>💸 Pay Now</Button>}
          <Button variant="outline" onClick={() => window.print()}><Download className="mr-1 h-4 w-4" />Download</Button>
          <Button variant="outline" onClick={copyLink}><Copy className="mr-1 h-4 w-4" />Copy Link</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
