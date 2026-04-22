import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export const EmptyState = ({ icon: Icon, title, description }: Props) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 p-12 text-center">
    <div className="mb-4 rounded-2xl bg-secondary p-4">
      <Icon className="h-8 w-8 text-muted-foreground" />
    </div>
    <p className="font-semibold">{title}</p>
    {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
  </div>
);
