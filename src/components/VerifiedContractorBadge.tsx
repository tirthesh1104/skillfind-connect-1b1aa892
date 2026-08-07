import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Trust badge shown next to a contractor whose business KYC is approved. */
export const VerifiedContractorBadge = ({
  status,
  className,
  compact,
}: {
  status?: string | null;
  className?: string;
  compact?: boolean;
}) => {
  if (status !== "verified") return null;
  return (
    <span
      title="Business verified by Labour Connect"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400",
        className
      )}
    >
      <BadgeCheck className="h-3 w-3" />
      {!compact && "Verified"}
    </span>
  );
};
