import { cn } from "@/lib/utils";
import { colorFromName, getInitials } from "@/lib/labour";

interface Props {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
};

export const InitialsAvatar = ({ name, src, size = "md", className }: Props) => {
  const initials = getInitials(name || "?");
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn("rounded-full object-cover ring-2 ring-border/40", sizes[size], className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-border/40",
        sizes[size],
        className
      )}
      style={{ background: colorFromName(name || "?") }}
    >
      {initials}
    </div>
  );
};
