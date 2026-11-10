import { useEffect, useRef, useState } from "react";
import { Check, ShieldCheck, Terminal } from "lucide-react";
import { useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils.ts";

export type ClosingVariant = "storefront" | "timeline" | "rack" | "command" | "brief" | "paths" | "shield";

/** Plays a short sequence once when the visual scrolls into view; reduced motion jumps to the end. */
function useSequence(steps: number, stepMs = 450, startMs = 350) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4, once: true });
  const reduceMotion = useReducedMotion() ?? false;
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (reduceMotion) {
      setStep(steps);
      return;
    }
    if (!inView) return;
    const timers = Array.from({ length: steps }, (_, i) => window.setTimeout(() => setStep(i + 1), startMs + i * stepMs));
    return () => timers.forEach(window.clearTimeout);
  }, [inView, reduceMotion, steps, stepMs, startMs]);
  return { ref, step };
}

const SHELL = "rounded-2xl bg-white p-5 text-[#02070a] shadow-[0_24px_50px_-32px_rgb(2_7_10_/_0.55)] dark:bg-slate-950 dark:text-white dark:ring-1 dark:ring-white/10";

/** Product pages: an order summary that prints itself line by line. */
export function StorefrontReceipt({ product, domain, cta }: { product: string; domain?: string; cta: string }) {
  const { ref, step } = useSequence(4);
  const rows = [
    { label: "Plan", value: product },
    { label: "Domain", value: domain ?? "Connect or register a domain" },
    { label: "Includes", value: "Email, SSL, CDN, backups" },
    { label: "Manage in", value: "nPanel" },
  ];
  return (
    <div ref={ref} className={SHELL}>
      <div className="flex items-center justify-between border-b border-dashed border-border pb-3">
        <p className="type-label text-sky-700 dark:text-primary">Order summary</p>
        <span className="size-9" aria-hidden />
      </div>
      <dl className="mt-3 space-y-3">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={cn(
              "flex items-baseline justify-between gap-4 transition-all duration-500",
              i < step ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
            )}
          >
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="max-w-[60%] text-right text-[15px] font-semibold">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex items-center justify-between border-t border-dashed border-border pt-3">
        <span className="text-sm font-semibold">{step >= 4 ? cta : "Preparing…"}</span>
        <span className="flex gap-1" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={cn("h-1.5 w-4 rounded-full", i < step ? "bg-primary" : "bg-muted")} />
          ))}
        </span>
      </div>
    </div>
  );
}

/** Managed services: a delivery timeline that draws itself to the next step. */
export function CampaignTimeline({ steps }: { steps: string[] }) {
  const { ref, step } = useSequence(steps.length);
  return (
    <div ref={ref} className={SHELL}>
      <p className="type-label text-sky-700 dark:text-primary">How the work runs</p>
      <ol className="mt-5">
        {steps.map((label, i) => {
          const on = i < step;
          const last = i === steps.length - 1;
          return (
            <li key={label} className="relative flex gap-3 pb-5 last:pb-0">
              <span className="relative flex flex-col items-center">
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors duration-500",
                    on ? "border-primary bg-primary text-[#02070a]" : "border-primary/30 text-sky-700 dark:text-primary",
                  )}
                >
                  {on ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : i + 1}
                </span>
                {!last ? (
                  <span
                    className={cn("mt-1 w-0.5 flex-1 rounded-full transition-colors duration-500", on ? "bg-primary" : "bg-border")}
                    aria-hidden
                  />
                ) : null}
              </span>
              <span className={cn("pt-0.5 text-base font-semibold leading-snug transition-colors", on ? "text-foreground" : "text-muted-foreground")}>
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Cloud hub: a short server rack that runs a status check. */
export function ServerRack() {
  const { ref, step } = useSequence(6, 260, 200);
  return (
    <div ref={ref} className={cn(SHELL, "bg-[#02070a] text-white dark:bg-[#02070a] dark:ring-white/10")}>
      <div className="flex items-center justify-between">
        <p className="type-label text-sky-300">Platform status</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
          <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />
          {step >= 6 ? "All services ready" : "Checking…"}
        </span>
      </div>
      <ul className="mt-4 space-y-1.5" aria-hidden>
        {["Domains", "Web hosting", "Email", "Servers", "Backups", "nPanel"].map((label, i) => (
          <li key={label} className="flex items-center gap-3 rounded-lg bg-white/[0.06] px-3 py-1.5">
            <span className="text-xs font-medium text-white/80">{label}</span>
            <span className="ml-auto flex gap-1">
              {[0, 1, 2, 3].map((dot) => (
                <span
                  key={dot}
                  className={cn(
                    "size-1.5 rounded-full transition-colors duration-300",
                    i < step ? (dot === 0 ? "bg-emerald-400" : "bg-sky-400/60") : "bg-white/15",
                  )}
                />
              ))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Platform: a mini nPanel window typing the sign-in command. */
export function CommandBar() {
  const { ref, step } = useSequence(1, 0, 200);
  const command = "open npanel.nisccloud.com";
  const [typed, setTyped] = useState(0);
  const reduceMotion = useReducedMotion() ?? false;
  useEffect(() => {
    if (step === 0) return;
    if (reduceMotion) {
      setTyped(command.length);
      return;
    }
    const id = window.setInterval(() => {
      setTyped((n) => {
        if (n >= command.length) {
          window.clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, 55);
    return () => window.clearInterval(id);
  }, [command.length, reduceMotion, step]);
  return (
    <div ref={ref} className={cn(SHELL, "bg-[#02070a] text-slate-100 dark:ring-white/10")}>
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <Terminal className="size-4 text-primary" />
        <span className="text-sm font-semibold text-white">nPanel</span>
      </div>
      <p className="mt-3 font-mono text-[13px]">
        <span className="mr-2 text-primary">$</span>
        {command.slice(0, typed)}
        <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 bg-primary" aria-hidden />
      </p>
      <ul className="mt-3 space-y-1 text-xs text-white/60" aria-hidden>
        <li>Signed in to your workspace</li>
        <li>Domains, hosting, email and invoices together</li>
      </ul>
    </div>
  );
}

/** Our Work and About: a project brief that fills in. */
export function BriefCard({ fields }: { fields: string[] }) {
  const { ref, step } = useSequence(fields.length + 1);
  return (
    <div ref={ref} className={SHELL}>
      <p className="type-label text-sky-700 dark:text-primary">Project brief</p>
      <ul className="mt-4 space-y-2.5">
        {fields.map((field, i) => (
          <li key={field} className="flex items-center gap-2.5">
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                i < step ? "bg-primary text-[#02070a]" : "border border-border text-transparent",
              )}
            >
              <Check className="size-3" strokeWidth={3} aria-hidden />
            </span>
            <span className="flex-1 border-b border-dashed border-border pb-1 text-[15px] font-medium">{field}</span>
          </li>
        ))}
      </ul>
      <span
        className={cn(
          "mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-500",
          step > fields.length ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground",
        )}
      >
        {step > fields.length ? "Ready to discuss" : "Drafting"}
      </span>
    </div>
  );
}

/** Pricing: two paths with a pointer that moves between them. */
export function PathChooser({ primary, secondary }: { primary: string; secondary: string }) {
  const { ref, step } = useSequence(2, 700);
  return (
    <div ref={ref} className={SHELL}>
      <p className="type-label text-sky-700 dark:text-primary">Two ways to start</p>
      <div className="mt-4 space-y-2.5">
        {[primary, secondary].map((label, i) => (
          <div
            key={label}
            className={cn(
              "flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-500",
              i < step ? "border-primary bg-primary/10" : "border-border",
            )}
          >
            <span className="text-[15px] font-semibold">{label}</span>
            <span
              className={cn("text-xs font-semibold transition-opacity duration-500", i < step ? "opacity-100" : "opacity-0")}
              aria-hidden
            >
              →
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Security: a ring that sweeps around the shield once and reports the result. */
export function ShieldScan({ checks }: { checks: string[] }) {
  const { ref, step } = useSequence(1, 0, 300);
  const done = step >= 1;
  return (
    <div ref={ref} className={SHELL}>
      <div className="flex items-center gap-4">
        <span className="relative flex size-20 shrink-0 items-center justify-center">
          <svg viewBox="0 0 80 80" className="absolute inset-0 size-full" aria-hidden>
            <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4" />
            <circle
              cx="40"
              cy="40"
              r="35"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="220"
              strokeDashoffset={done ? 0 : 220}
              className="text-primary transition-[stroke-dashoffset] duration-1000 ease-out"
              transform="rotate(-90 40 40)"
            />
          </svg>
          <ShieldCheck className={cn("relative size-9 transition-colors duration-500", done ? "text-primary" : "text-muted-foreground")} />
        </span>
        <div className="min-w-0">
          <p className="type-label text-sky-700 dark:text-primary">Security check</p>
          <p className="mt-1 text-base font-semibold">{done ? "Protected" : "Scanning…"}</p>
          <p className="text-sm text-muted-foreground">SSL, firewall, backups</p>
        </div>
      </div>
      <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
        {checks.map((check) => (
          <li key={check} className="flex items-center gap-2">
            <Check className={cn("size-4 shrink-0 transition-colors duration-500", done ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/40")} strokeWidth={3} aria-hidden />
            {check}
          </li>
        ))}
      </ul>
    </div>
  );
}
