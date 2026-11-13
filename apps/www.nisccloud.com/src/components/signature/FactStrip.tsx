import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils.ts";

export type Fact = { value: string; label: string; Art?: ComponentType };

/**
 * Joined row of facts, each with a large value, one line of context and an optional small illustration.
 * Only use real, verifiable facts here.
 */
export function FactStrip({
  id,
  eyebrow,
  title,
  facts,
  tone = "light",
  className,
}: {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  facts: readonly Fact[];
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <section id={id} className={cn("scroll-mt-24 px-4 py-20 md:px-8 md:py-28", dark ? "bg-[#02070A] text-white" : "bg-background", className)}>
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="type-label text-[#38b6ff]">{eyebrow}</p>
          <h2 className={cn("type-h2 mx-auto mt-3 max-w-3xl text-balance", dark && "text-white")}>{title}</h2>
        </div>
        <ul
          className={cn(
            "mt-12 grid gap-px overflow-hidden rounded-[28px] border",
            dark ? "border-white/10 bg-white/10" : "border-border bg-border",
            facts.length === 4 ? "grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3",
          )}
        >
          {facts.map((fact) => (
            <li key={fact.value} className={cn("flex flex-col px-4 py-7 text-center sm:px-6 sm:py-9 md:px-8", dark ? "bg-[#07131b]" : "bg-card")}>
              <p className="text-3xl font-semibold tracking-tight text-[#38b6ff] sm:text-4xl md:text-5xl">{fact.value}</p>
              <p className={cn("mx-auto mt-3 max-w-xs text-sm leading-relaxed", dark ? "text-white/70" : "text-muted-foreground")}>{fact.label}</p>
              {fact.Art ? (
                <div className="mt-auto">
                  <fact.Art />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
