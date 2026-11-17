import { Check } from "lucide-react";
import { cn } from "@/lib/utils.ts";

/** Every custom or quoted tier uses this name and look, so Enterprise reads the same on every page. */
export const ENTERPRISE_TIER_NAME = "Enterprise";

/** The page background is also midnight in dark mode, so the orange edge carries the card there. */
export const ENTERPRISE_CARD =
  "relative isolate flex h-full flex-col overflow-hidden rounded-2xl border border-brand-orange/45 bg-brand-midnight p-6 text-white shadow-xl shadow-brand-orange/10 ring-1 ring-brand-orange/20 dark:border-brand-orange/60 dark:shadow-brand-orange/5";

export const ENTERPRISE_MUTED = "text-white/70";

export const ENTERPRISE_BUTTON =
  "bg-brand-orange font-semibold text-brand-midnight shadow-md shadow-brand-orange/25 hover:bg-brand-orange/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export const ENTERPRISE_LINK =
  "font-medium text-white/75 underline-offset-4 hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/** Orange top edge and a soft glow behind the heading. Decorative only. */
export function EnterpriseGlow() {
  return (
    <>
      <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-brand-orange" />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 -z-10 size-56 rounded-full bg-brand-orange/20 blur-3xl"
      />
    </>
  );
}

export function EnterpriseBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full border border-brand-orange/50 bg-brand-orange/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-brand-orange",
        className,
      )}
    >
      Custom scope
    </span>
  );
}

export function EnterpriseTick() {
  return (
    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-brand-orange/20 text-brand-orange">
      <Check className="size-2.5" strokeWidth={3.5} aria-hidden />
    </span>
  );
}
