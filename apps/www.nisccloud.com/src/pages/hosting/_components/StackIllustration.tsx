import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRightLeft, Check, Globe, Mail, Server, ServerCog, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import type { FinderChoice, StackLayer } from "./cloud-catalog.ts";

const LAYER_STYLE: Record<StackLayer, { icon: LucideIcon; tile: string }> = {
  domain: { icon: Globe, tile: "bg-primary text-[#02070a]" },
  ssl: { icon: ShieldCheck, tile: "bg-emerald-500 text-white" },
  hosting: { icon: Server, tile: "bg-[#02070a] text-sky-300 dark:bg-slate-800" },
  server: { icon: ServerCog, tile: "bg-[#02070a] text-sky-300 dark:bg-slate-800" },
  email: { icon: Mail, tile: "bg-brand-orange text-white" },
  move: { icon: ArrowRightLeft, tile: "bg-sky-700 text-white" },
};

const BLUEPRINT: { layer: StackLayer; label: string }[] = [
  { layer: "domain", label: "Domain" },
  { layer: "ssl", label: "SSL" },
  { layer: "hosting", label: "Hosting" },
  { layer: "server", label: "Servers" },
  { layer: "email", label: "Email" },
];

/** Illustration of the services a choice needs, stacked and connected through nPanel. */
export function StackIllustration({ choice }: { choice: FinderChoice | null }) {
  const reduceMotion = useReducedMotion();
  const layers = choice?.stack ?? BLUEPRINT;
  const built = choice !== null;

  return (
    <figure
      aria-label={
        built
          ? `Illustration of the services for ${choice.label.toLowerCase()}: ${layers.map((l) => l.label).join(", ")}, managed in nPanel`
          : "Illustration of a service stack: domain, SSL, hosting, servers and email, managed in nPanel"
      }
      className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-sky-50 via-white to-orange-50/60 p-5 shadow-[0_30px_60px_-45px_rgb(2_7_10_/_0.45)] sm:p-7 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(56_182_255_/_0.18)_1px,transparent_0)] [background-size:18px_18px]" />

      <div className="relative mb-5 flex items-center justify-between">
        <span className="type-label text-foreground">{built ? "Your stack" : "Stack blueprint"}</span>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
            built ? "bg-primary/15 text-sky-800 dark:text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          {built ? `${layers.length} services` : "Pick an option"}
        </span>
      </div>

      <div className="relative">
        <span aria-hidden className="absolute bottom-7 left-[1.375rem] top-5 w-px border-l-2 border-dashed border-primary/35" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.ol
            key={choice?.id ?? "blueprint"}
            className="relative space-y-2.5"
            initial={reduceMotion ? false : "hidden"}
            animate="shown"
            exit={reduceMotion ? undefined : "hidden"}
            variants={{ shown: { transition: { staggerChildren: 0.07 } } }}
          >
            {layers.map(({ layer, label }, index) => {
              const { icon: Icon, tile } = LAYER_STYLE[layer];
              return (
                <motion.li
                  key={`${layer}-${label}`}
                  variants={{
                    hidden: { opacity: 0, x: -12 },
                    shown: { opacity: 1, x: 0, transition: { duration: 0.28, ease: "easeOut" } },
                  }}
                  style={{ marginLeft: built ? `${index * 14}px` : 0 }}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-2.5 pr-4",
                    built
                      ? "border-border bg-card shadow-[0_10px_24px_-20px_rgb(2_7_10_/_0.6)]"
                      : "border-dashed border-primary/30 bg-card",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl",
                      built ? tile : "border border-dashed border-primary/40 text-sky-700 dark:text-primary",
                    )}
                  >
                    <Icon size={18} strokeWidth={1.9} />
                  </span>
                  <span className={cn("min-w-0 flex-1 text-sm font-semibold", built ? "text-foreground" : "text-muted-foreground")}>
                    {label}
                  </span>
                  {built ? <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={3} aria-hidden /> : null}
                </motion.li>
              );
            })}
          </motion.ol>
        </AnimatePresence>

        <div
          className={cn(
            "relative mt-4 flex items-center gap-3 rounded-2xl p-3 transition-colors",
            built ? "bg-[#02070a] text-white" : "border border-dashed border-primary/30 bg-card text-muted-foreground",
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white">
            <img src="/nisciconoriginal.png" alt="" className="size-6 object-contain" />
          </span>
          <span className="text-sm font-semibold">Managed together in nPanel</span>
        </div>
      </div>
    </figure>
  );
}
