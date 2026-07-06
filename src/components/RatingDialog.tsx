import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  jobId?: string | null;
  ratedUserId: string;
  ratedUserName: string;
  role: "worker_rating_contractor" | "contractor_rating_worker";
  onSaved?: () => void;
}

const WORKER_TAGS = ["Punctual", "Hard Worker", "Skilled", "Reliable"];

export const RatingDialog = ({ open, onOpenChange, jobId, ratedUserId, ratedUserName, role, onSaved }: Props) => {
  const { user } = useAuth();
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleTag = (t: string) => setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("ratings").insert({
      job_id: jobId ?? null,
      given_by: user.id,
      given_to: ratedUserId,
      score: stars,
      comment: comment || null,
      tags: role === "contractor_rating_worker" ? tags : [],
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Thanks for your review!");
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate {ratedUserName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setStars(n)}>
                <Star className={cn("h-8 w-8", n <= stars ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
              </button>
            ))}
          </div>
          {role === "contractor_rating_worker" && (
            <div className="flex flex-wrap gap-2">
              {WORKER_TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs",
                    tags.includes(t) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          <Textarea placeholder="Optional comment" value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Skip</Button>
          <Button onClick={save} disabled={saving} className="bg-gradient-primary">Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
