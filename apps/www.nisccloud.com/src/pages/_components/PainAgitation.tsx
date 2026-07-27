import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  Check,
  Globe,
  LineChart,
  Rocket,
  Server,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";

const vendors = [
  { label: "Design agency", icon: Rocket, rotate: -3, delay: 0 },
  { label: "Web developer", icon: Globe, rotate: 2.5, delay: 0.06 },
  { label: "Hosting provider", icon: Server, rotate: -2, delay: 0.12 },
  { label: "Marketing agency", icon: LineChart, rotate: 3, delay: 0.18 },
  { label: "AI tools vendor", icon: Bot, rotate: -1.5, delay: 0.24 },
] as const;

const withoutPoints = [
  "5 invoices, 5 logins, 5 different contacts",
  "Brand looks different on every channel",
  "Nobody takes ownership when things break",
  "Months pass with no measurable results",
];

const withPoints = [
  "One team, one invoice, one strategy",
  "Consistent brand voice everywhere",
  "One account manager who owns outcomes",
  "Results in 30 days — or we keep working",
  "AI automation runs the repetitive work",
];

/** Home “Sound familiar?” — chaos of vendors vs Nisc Cloud. */
export default function PainAgitation() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <section className="relative overflow-hidden py-16 md:py-20">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 55% 40% at 50% 0%, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent 70%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <motion.div
          className="mx-auto mb-12 max-w-2xl text-center"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.45 }}
        >
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
            Tired of paying separate teams?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground md:text-base">
            Most growing businesses end up with a patchwork of vendors. Here is
            what that usually looks like — and what changes with Nisc Cloud.
          </p>
        </motion.div>

        {/* The old way */}
        <motion.div
          className="mb-10 md:mb-12"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.45, delay: 0.05 }}
        >
          <p className="mb-5 text-center text-xs font-bold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">
            The old way — chaos
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            {vendors.map((v) => (
              <motion.div
                key={v.label}
                className="relative"
                style={{ rotate: `${v.rotate}deg` }}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 22,
                  delay: reduceMotion ? 0 : 0.1 + v.delay,
                }}
              >
                <motion.div
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          y: [0, -5, 0],
                        }
                  }
                  transition={{
                    duration: 3.4 + v.delay * 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: v.delay * 3,
                  }}
                >
                  <div
                    className={cn(
                      "flex items-center gap-2.5 rounded-full border border-dashed border-rose-300/80 bg-card px-3.5 py-2.5 shadow-sm",
                      "dark:border-rose-500/40",
                    )}
                  >
                    <span className="flex size-8 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      <v.icon className="size-4" aria-hidden />
                    </span>
                    <span className="text-sm font-semibold text-foreground">{v.label}</span>
                    <span className="rounded-md bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                      +invoice
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            ))}

            <motion.div
              className="flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-600/25"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 20,
                delay: reduceMotion ? 0 : 0.45,
              }}
            >
              <X className="size-4 shrink-0" aria-hidden />
              No one talks to each other
            </motion.div>
          </div>
        </motion.div>

        {/* Without / With */}
        <div className="grid gap-4 md:grid-cols-2 md:gap-6 md:items-stretch">
          <motion.div
            className="flex flex-col rounded-2xl border border-rose-200/80 bg-rose-50/60 p-6 dark:border-rose-500/25 dark:bg-rose-950/25 md:p-7"
            initial={reduceMotion ? false : { opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ type: "spring", stiffness: 240, damping: 24, delay: 0.1 }}
          >
            <div className="mb-5 flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-full bg-rose-500 text-white">
                <X className="size-4" aria-hidden />
              </span>
              <h3 className="text-base font-bold tracking-tight text-rose-800 dark:text-rose-200 md:text-lg">
                With other vendors
              </h3>
            </div>
            <ul className="mb-6 space-y-3.5">
              {withoutPoints.map((point, i) => (
                <motion.li
                  key={point}
                  className="flex items-start gap-3 text-sm leading-relaxed text-rose-950/80 dark:text-rose-100/80"
                  initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: reduceMotion ? 0 : 0.2 + i * 0.07 }}
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
                    <X className="size-3" aria-hidden />
                  </span>
                  {point}
                </motion.li>
              ))}
            </ul>
            <div className="mt-auto space-y-2">
              <Button
                asChild
                variant="outline"
                className="h-11 w-full gap-2 rounded-xl border-rose-300/80 bg-background/70 font-semibold text-rose-800 hover:bg-rose-100/80 dark:border-rose-500/40 dark:text-rose-100 dark:hover:bg-rose-950/50"
              >
                <Link to="/services">
                  See why teams switch
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <p className="text-center text-[11px] text-rose-800/60 dark:text-rose-200/50">
                Still juggling vendors? See how the switch works.
              </p>
            </div>
          </motion.div>

          <motion.div
            className="flex flex-col rounded-2xl border border-primary/25 bg-primary/5 p-6 shadow-[0_12px_40px_-24px_color-mix(in_srgb,var(--color-primary)_55%,transparent)] md:p-7"
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ type: "spring", stiffness: 240, damping: 24, delay: 0.18 }}
          >
            <div className="mb-5 flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-4" aria-hidden />
              </span>
              <h3 className="text-base font-bold tracking-tight text-foreground md:text-lg">
                With Nisc Cloud
              </h3>
            </div>
            <ul className="mb-6 space-y-3.5">
              {withPoints.map((point, i) => (
                <motion.li
                  key={point}
                  className="flex items-start gap-3 text-sm leading-relaxed text-foreground/85"
                  initial={reduceMotion ? false : { opacity: 0, x: 8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: reduceMotion ? 0 : 0.28 + i * 0.07 }}
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="size-3" aria-hidden />
                  </span>
                  {point}
                </motion.li>
              ))}
            </ul>
            <div className="mt-auto space-y-2">
              <Button asChild className="h-11 w-full gap-2 rounded-xl font-semibold">
                <Link to="/contact">
                  Talk to us. It is free.
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                No pressure. A clear plan in about 30 minutes.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
