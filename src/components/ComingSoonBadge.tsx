import { cn } from "@/lib/utils";

/** Small chip marking a feature that is visible but not yet functional. */
export const ComingSoonBadge = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-400",
      className
    )}
  >
    Coming soon
  </span>
);
