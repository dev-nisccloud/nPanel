import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { ArrowRight, Check, FlaskConical, Globe } from "lucide-react";
import { cn } from "@/lib/utils.ts";

const CHECKS = ["Plugins updated", "Pages checked", "Checkout tested"];
/** 0 idle, 1 updating, 2–4 checks pass, 5 pushed to live. */
const FINAL_STEP = 5;

function useStagingSequence() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5, once: true });
  const reduceMotion = useReducedMotion() ?? false;
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (reduceMotion) {
      setStep(FINAL_STEP);
      return;
    }
    if (!inView) return;
    const timers = Array.from({ length: FINAL_STEP }, (_, i) => window.setTimeout(() => setStep(i + 1), 400 + i * 650));
    return () => timers.forEach(window.clearTimeout);
  }, [inView, reduceMotion]);
  return { ref, step };
}

function SiteFrame({ label, icon: Icon, tone, children }: { label: string; icon: typeof Globe; tone: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-border bg-card shadow-[0_14px_30px_-24px_rgb(2_7_10_/_0.6)]">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <span className={cn("flex size-6 items-center justify-center rounded-md", tone)}>
          <Icon className="size-3.5" />
        </span>
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>
      <div className="flex-1 p-3">{children}</div>
    </div>
  );
}

/** Illustration of testing a WordPress change on staging, then pushing it to the live site. */
export function StagingToLiveArt() {
  const { ref, step } = useStagingSequence();
  const pushed = step >= FINAL_STEP;

  return (
    <div
      ref={ref}
      role="img"
      aria-label="Illustration: plugin updates are tested on a staging copy of a WordPress site, then pushed to the live site"
      className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-sky-50 via-white to-orange-50/60 p-5 sm:p-6 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(56_182_255_/_0.16)_1px,transparent_0)] [background-size:18px_18px]" />

      <div className="relative flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <SiteFrame label="Staging copy" icon={FlaskConical} tone="bg-brand-orange/15 text-[#b9411f] dark:text-brand-orange">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand-orange transition-[width] duration-700 ease-out"
              style={{ width: step >= 1 ? "100%" : "8%" }}
            />
          </div>
          <ul className="mt-3 space-y-2">
            {CHECKS.map((check, i) => {
              const done = step >= i + 2;
              return (
                <li key={check} className="flex items-center gap-2 text-sm">
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
                      done ? "border-emerald-500 bg-emerald-500 text-white" : "border-border text-transparent",
                    )}
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  <span className={done ? "text-foreground" : "text-muted-foreground"}>{check}</span>
                </li>
              );
            })}
          </ul>
        </SiteFrame>

        <div className="flex items-center justify-center" aria-hidden>
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-500",
              pushed ? "bg-primary text-[#02070a]" : "bg-muted text-muted-foreground",
            )}
          >
            Push to live
            <ArrowRight className={cn("size-3.5 transition-transform duration-500 sm:rotate-0", pushed ? "translate-x-0.5" : "")} />
          </span>
        </div>

        <SiteFrame label="Live site" icon={Globe} tone="bg-primary/15 text-sky-800 dark:text-primary">
          <div className="space-y-2" aria-hidden>
            <div className="h-10 rounded-lg bg-gradient-to-r from-primary/30 to-primary/10" />
            <div className="h-2 w-3/4 rounded bg-muted" />
            <div className="h-2 w-1/2 rounded bg-muted" />
          </div>
          <span
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors duration-500",
              pushed ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground",
            )}
          >
            <span className={cn("size-1.5 rounded-full", pushed ? "bg-emerald-500" : "bg-muted-foreground/50")} />
            {pushed ? "Updated after testing" : "Live and unchanged"}
          </span>
        </SiteFrame>
      </div>
    </div>
  );
}
