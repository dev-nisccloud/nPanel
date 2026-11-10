import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { Gauge, Globe2, Layers, Zap } from "lucide-react";
import { cn } from "@/lib/utils.ts";

const LAYERS = [
  { label: "Browser request", detail: "Visitor opens a page", icon: Globe2 },
  { label: "Free CDN", detail: "Served from a nearby location", icon: Layers },
  { label: "LiteSpeed cache", detail: "Stored page returned", icon: Zap },
  { label: "WordPress", detail: "Only when the cache misses", icon: Gauge },
];

/** Counts the render time down once, as the cache and CDN layers light up. */
function usePerfSequence() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5, once: true });
  const reduceMotion = useReducedMotion() ?? false;
  const [ms, setMs] = useState(1240);
  const [lit, setLit] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setMs(180);
      setLit(LAYERS.length);
      return;
    }
    if (!inView) return;
    let frame = 0;
    const start = performance.now();
    const id = window.setInterval(() => {
      frame += 1;
      const progress = Math.min(frame / 36, 1);
      setMs(Math.round(1240 - 1060 * progress));
      setLit(Math.min(LAYERS.length, Math.floor(progress * LAYERS.length + 1)));
      if (progress >= 1) window.clearInterval(id);
    }, 55);
    return () => window.clearInterval(id);
  }, [inView, reduceMotion]);

  return { ref, ms, lit };
}

/** Illustration of a cached WordPress page being served through the CDN with a short render time. */
export function WordPressPerformanceArt() {
  const { ref, ms, lit } = usePerfSequence();

  return (
    <div
      ref={ref}
      role="img"
      aria-label="Illustration: a WordPress page served through the free CDN and LiteSpeed cache with a short render time"
      className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-sky-50 via-white to-orange-50/60 p-5 sm:p-6 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(56_182_255_/_0.16)_1px,transparent_0)] [background-size:18px_18px]" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="type-label text-sky-800 dark:text-primary">Page render time</p>
          <p className="mt-1 flex items-baseline gap-1 tabular-nums">
            <span className="text-4xl font-extrabold tracking-tight text-foreground transition-none">
              {ms}
            </span>
            <span className="text-base font-semibold text-muted-foreground">ms</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Cached
          </span>
          <span className="text-xs text-muted-foreground">Illustrative</span>
        </div>
      </div>

      <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-[width] duration-500 ease-out"
          style={{ width: `${Math.min((1240 - ms) / 1060, 1) * 100}%` }}
        />
      </div>

      <ol className="relative mt-5 space-y-2">
        {LAYERS.map(({ label, detail, icon: Icon }, index) => {
          const active = index < lit;
          return (
            <li
              key={label}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-3 transition-colors duration-300",
                active ? "border-primary/40 bg-card" : "border-dashed border-border bg-card/60",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-300",
                  active ? "bg-primary text-[#02070a]" : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{label}</span>
                <span className="block text-xs text-muted-foreground">{detail}</span>
              </span>
              {active ? (
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Ready</span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
