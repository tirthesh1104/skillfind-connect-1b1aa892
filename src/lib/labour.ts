// Avatar helper — generates a deterministic colored circle with initials
export const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const palette = [
  "hsl(217 91% 60%)",
  "hsl(142 71% 45%)",
  "hsl(38 92% 55%)",
  "hsl(262 83% 58%)",
  "hsl(199 89% 48%)",
  "hsl(340 82% 60%)",
];

export const colorFromName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

export const SKILL_OPTIONS = ["Plumber", "Mason", "Electrician", "Carpenter", "Painter", "Welder", "Helper"];

export const skillBadgeClass = (skill: string) => {
  const map: Record<string, string> = {
    Plumber: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    Mason: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    Electrician: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
    Carpenter: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    Painter: "bg-pink-500/15 text-pink-300 border-pink-500/30",
    Welder: "bg-red-500/15 text-red-300 border-red-500/30",
    Helper: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  };
  return map[skill] ?? "bg-secondary text-secondary-foreground border-border";
};
