import { ChartNoAxesCombined, PencilRuler, ServerCog } from "lucide-react";
import { ZepoMascot } from "@/components/zepo-mascot.tsx";
import { cn } from "@/lib/utils.ts";

export type Pillar = "build" | "run" | "grow" | "ai";

const PILLAR_ICONS = {
  build: PencilRuler,
  run: ServerCog,
  grow: ChartNoAxesCombined,
} as const;

const TONES: Record<Pillar, { idle: string; active: string; accent: string }> = {
  build: {
    idle: "bg-brand-orange/10 text-[#b9411f] dark:text-brand-orange",
    active: "bg-brand-orange text-white",
    accent: "bg-primary",
  },
  run: {
    idle: "bg-primary/10 text-primary dark:text-primary",
    active: "bg-primary text-[#02070a]",
    accent: "bg-brand-orange",
  },
  grow: {
    idle: "bg-slate-950/[0.06] text-slate-800 dark:bg-white/10 dark:text-slate-100",
    active: "bg-slate-950 text-[#38b6ff] ring-1 ring-white/15",
    accent: "bg-brand-orange",
  },
  ai: {
    idle: "bg-primary/[0.08]",
    active: "bg-white ring-2 ring-primary dark:bg-slate-900",
    accent: "bg-brand-orange",
  },
};

/** Icon tile identifying a Build, Run, Grow or Zepo AI pillar. */
export function PillarIcon({
  pillar,
  active = false,
  className,
}: {
  pillar: Pillar;
  active?: boolean;
  className?: string;
}) {
  const tone = TONES[pillar];
  const Icon = pillar === "ai" ? null : PILLAR_ICONS[pillar];
  return (
    <span
      aria-hidden
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-200",
        active ? tone.active : tone.idle,
        className,
      )}
    >
      {Icon ? <Icon size={20} strokeWidth={1.9} /> : <ZepoMascot className="size-7" />}
      <span
        className={cn(
          "absolute -right-1 -top-1 size-2.5 rounded-full ring-2 ring-card transition-opacity duration-200",
          tone.accent,
          active ? "opacity-100" : "opacity-0",
        )}
      />
    </span>
  );
}
