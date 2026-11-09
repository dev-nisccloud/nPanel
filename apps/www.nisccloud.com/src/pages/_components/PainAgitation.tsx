import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

const fragmentedPoints = [
  "Multiple dashboards, contracts and support teams",
  "Providers and systems operating independently",
  "Unclear ownership when cross-platform issues arise",
  "Delays caused by handoffs between teams",
];

const connectedPoints = [
  "One accountable technology partner",
  "Infrastructure and growth services coordinated",
  "Clear ownership across the services you purchase",
  "A connected place to manage and track delivery",
];

/** Homepage comparison: fragmented providers vs one connected partner. */
export default function PainAgitation() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <section
      aria-labelledby="comparison-heading"
      className="relative overflow-hidden py-14 md:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <motion.div
          className="mx-auto mb-10 max-w-2xl text-center"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.45 }}
        >
          <h2
            id="comparison-heading"
            className="text-balance text-3xl font-bold tracking-tight md:text-4xl"
          >
            Your digital services should work together.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Managing separate providers can make everyday work harder than it
            needs to be. Nisc Cloud connects infrastructure, development and
            growth under one accountable partner.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          <div className="rounded-3xl border border-border bg-muted/40 p-6 md:p-8">
            <h3 className="mb-5 text-base font-bold tracking-tight text-muted-foreground md:text-lg">
              With fragmented providers
            </h3>
            <ul className="space-y-3.5">
              {fragmentedPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground"
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground/10">
                    <Minus className="size-3" aria-hidden />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col rounded-3xl border border-primary/30 bg-primary/5 p-6 shadow-[0_12px_40px_-24px_color-mix(in_srgb,var(--color-primary)_55%,transparent)] md:p-8">
            <h3 className="mb-5 text-base font-bold tracking-tight text-foreground md:text-lg">
              With Nisc Cloud
            </h3>
            <ul className="mb-7 space-y-3.5">
              {connectedPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 text-sm leading-relaxed text-foreground/90"
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="size-3" aria-hidden />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <Button
              asChild
              className="mt-auto h-11 w-full gap-2 rounded-xl font-semibold sm:w-fit sm:px-6"
            >
              <Link to="/contact?service=full">
                Discuss your requirements
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
