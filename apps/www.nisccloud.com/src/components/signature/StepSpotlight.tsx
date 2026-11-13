import type { ElementType, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils.ts";

export type SpotlightStep = { icon: ElementType; title: string; text: string };

/**
 * Feature spotlight: a numbered journey that draws itself in, beside a framed illustration.
 * Steps should describe what the service actually includes; keep claims in line with the page.
 */
export function StepSpotlight({
  id,
  eyebrow,
  title,
  intro,
  steps,
  art,
  artLabel,
  tone = "light",
  artSide = "right",
  framed = true,
  className,
}: {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  intro: ReactNode;
  steps: readonly SpotlightStep[];
  art: ReactNode;
  artLabel: string;
  tone?: "light" | "dark";
  artSide?: "left" | "right";
  /** Turn off for artwork that already draws its own backdrop. */
  framed?: boolean;
  className?: string;
}) {
  const dark = tone === "dark";
  const reduce = useReducedMotion() ?? false;
  return (
    <section id={id} className={cn("scroll-mt-24 px-4 py-16 md:px-8 md:py-24", className)}>
      <div
        className={cn(
          "relative mx-auto max-w-7xl overflow-hidden rounded-[32px] border",
          dark ? "border-white/10 bg-[#02070A] text-white" : "border-border bg-card",
        )}
      >
        <div
          aria-hidden
          className={cn("pointer-events-none absolute inset-0", dark ? "opacity-40" : "opacity-60 dark:opacity-25")}
          style={{
            backgroundImage: dark
              ? "radial-gradient(circle at 1px 1px, rgb(56 182 255 / 0.18) 1px, transparent 0)"
              : "radial-gradient(circle at 1px 1px, rgb(14 87 118 / 0.14) 1px, transparent 0)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(ellipse 70% 80% at 30% 40%, black, transparent)",
          }}
        />
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-[#38b6ff]/20 blur-3xl" />

        <div
          className={cn(
            "relative grid items-center gap-10 p-6 sm:p-10 lg:grid-cols-2 lg:gap-14 lg:p-14",
            artSide === "left" && "lg:[&>*:first-child]:order-2",
          )}
        >
          <div>
            <p className="type-label text-[#38b6ff]">{eyebrow}</p>
            <h2 className={cn("type-h2 mt-3 text-balance", dark && "text-white")}>{title}</h2>
            <p className={cn("mt-4 max-w-[58ch] text-base leading-relaxed md:text-lg", dark ? "text-white/70" : "text-muted-foreground")}>{intro}</p>

            <ol className="relative mt-8 space-y-5">
              <span aria-hidden className={cn("absolute bottom-3 left-[19px] top-3 w-px", dark ? "bg-white/10" : "bg-border")} />
              <motion.span
                aria-hidden
                className="absolute bottom-3 left-[19px] top-3 w-px origin-top bg-gradient-to-b from-[#38b6ff] to-[#fc734d]"
                initial={reduce ? false : { scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              />
              {steps.map((step, i) => (
                <motion.li
                  key={step.title}
                  className="relative flex gap-4"
                  initial={reduce ? false : { opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.45, delay: 0.15 + i * 0.18 }}
                >
                  <span
                    className={cn(
                      "relative z-10 grid size-10 shrink-0 place-items-center rounded-xl ring-4",
                      i === steps.length - 1 ? "bg-[#fc734d] text-white" : "bg-[#38b6ff] text-[#02070A]",
                      dark ? "ring-[#02070A]" : "ring-card",
                    )}
                  >
                    <step.icon className="size-[18px]" aria-hidden />
                  </span>
                  <div className="pt-0.5">
                    <p className={cn("text-base font-semibold", dark ? "text-white" : "text-foreground")}>
                      <span className={cn("mr-2 text-sm font-medium", dark ? "text-white/40" : "text-muted-foreground")}>{String(i + 1).padStart(2, "0")}</span>
                      {step.title}
                    </p>
                    <p className={cn("mt-1 text-sm leading-relaxed", dark ? "text-white/65" : "text-muted-foreground")}>{step.text}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>

          <figure
            role="img"
            aria-label={artLabel}
            className={cn(
              "relative overflow-hidden rounded-[28px]",
              !framed ? "" : dark ? "p-3 sm:p-5 bg-white/[0.04] ring-1 ring-white/10" : "p-3 sm:p-5 bg-gradient-to-br from-[#38b6ff]/25 via-[#38b6ff]/10 to-[#fc734d]/10 ring-1 ring-[#38b6ff]/20",
            )}
          >
            {framed ? (
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute bottom-0 right-0 h-0 w-0 border-b-[180px] border-l-[180px] border-l-transparent",
                  dark ? "border-b-[#38b6ff]/10" : "border-b-[#38b6ff]/25",
                )}
              />
            ) : null}
            <div className="relative">{art}</div>
          </figure>
        </div>
      </div>
    </section>
  );
}
