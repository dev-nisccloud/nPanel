import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils.ts";

const CORES = ["Core 1", "Core 2", "Core 3", "Core 4"];

/** Plays once: four cores lock in as reserved for this server. */
export function ReservedCoresArt() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5, once: true });
  const reduceMotion = useReducedMotion() ?? false;
  const [held, setHeld] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setHeld(CORES.length);
      return;
    }
    if (!inView) return;
    const timers = CORES.map((_, i) => window.setTimeout(() => setHeld(i + 1), 350 + i * 480));
    return () => timers.forEach(window.clearTimeout);
  }, [inView, reduceMotion]);

  const done = held >= CORES.length;

  return (
    <div
      ref={ref}
      role="img"
      aria-label="Illustration: four processor cores locking in one by one, reserved for a single server so other customers cannot use them."
      className="rounded-3xl border border-border bg-card p-6 shadow-[0_30px_60px_-40px_rgb(2_132_199_/_0.45)] sm:p-8"
    >
      <p className="text-base font-medium text-foreground" aria-hidden>
        Cores on this server
      </p>
      <ul className="mt-5 grid grid-cols-2 gap-3" aria-hidden>
        {CORES.map((label, i) => {
          const on = i < held;
          return (
            <li
              key={label}
              className={cn(
                "flex items-center justify-between gap-3 rounded-2xl border px-4 py-5 transition-colors duration-500",
                on ? "border-primary bg-primary/10" : "border-dashed border-border bg-muted/40",
              )}
            >
              <span className={cn("text-base", on ? "text-foreground" : "text-muted-foreground")}>{label}</span>
              <span
                className={cn(
                  "flex items-center gap-1.5 text-sm text-primary transition-opacity duration-500 dark:text-primary",
                  on ? "opacity-100" : "opacity-0",
                )}
              >
                <Lock className="size-4" aria-hidden />
                Held
              </span>
            </li>
          );
        })}
      </ul>
      <p
        className={cn("mt-5 min-h-6 text-base text-foreground transition-opacity duration-500", done ? "opacity-100" : "opacity-0")}
        aria-hidden
      >
        Reserved for your server. Not shared.
      </p>
    </div>
  );
}
