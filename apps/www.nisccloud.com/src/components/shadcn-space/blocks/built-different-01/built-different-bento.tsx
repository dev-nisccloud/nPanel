import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { cn } from "@/lib/utils.ts";
import { ContextualVisual } from "./context-visuals.tsx";
import {
  assignUniqueThemes,
  type BuiltDifferentPoint,
  type VisualTheme,
} from "./visual-context.ts";

export type { BuiltDifferentPoint };

export type BuiltDifferentBentoProps = {
  points: BuiltDifferentPoint[];
  headline?: string;
  subtext?: string;
  badge?: string;
  className?: string;
  /** `simple` drops the illustrations and fits every point on one row on desktop. */
  variant?: "visual" | "simple";
};

function SimpleCard({ point }: { point: BuiltDifferentPoint }) {
  return (
    <article className="h-full rounded-2xl border border-border bg-card p-6">
      <span aria-hidden className="block h-1 w-10 rounded-full bg-primary" />
      <h3 className="type-h3 mt-5 text-foreground">{point.title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{point.desc}</p>
    </article>
  );
}

function BentoCard({
  point,
  theme,
  index,
}: {
  point: BuiltDifferentPoint;
  theme: VisualTheme;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-32px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.3) }}
    >
      <Card className="h-full overflow-hidden border-border/60 py-0 shadow-sm transition-colors duration-300 hover:border-primary/25">
        <CardContent className="flex h-full flex-col gap-4 p-5 pt-5">
          <ContextualVisual point={point} theme={theme} loop={inView && !reduceMotion} />
          <div className="mt-auto space-y-1.5 text-center">
            <h3 className="type-h3 text-foreground">
              {point.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {point.desc}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function BuiltDifferentBento({
  points,
  headline = "Why teams choose us",
  subtext,
  badge,
  className,
  variant = "visual",
}: BuiltDifferentBentoProps) {
  if (points.length === 0) return null;

  const items = points.slice(0, 6);
  const themes = assignUniqueThemes(items);

  if (variant === "simple") {
    return (
      <section
        className={cn("relative border-t border-border/40 bg-muted/15 py-16 md:py-20 dark:bg-transparent", className)}
      >
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="type-h2 mb-10">{headline}</h2>
          <div
            className={cn(
              "grid grid-cols-1 gap-4 sm:grid-cols-2",
              items.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
            )}
          >
            {items.map((point) => (
              <SimpleCard key={point.title} point={point} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "relative border-t border-border/40 bg-muted/15 py-16 md:py-24 dark:bg-transparent",
        className,
      )}
    >
      <div className="relative mx-auto max-w-5xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-12 text-center"
        >
          {badge ? (
            <span className="mb-3 inline-block text-xs font-medium uppercase tracking-widest text-primary">
              {badge}
            </span>
          ) : null}
          <h2 className="type-h2">{headline}</h2>
          {subtext ? (
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{subtext}</p>
          ) : null}
        </motion.div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((point, index) => (
            <BentoCard
              key={point.title}
              point={point}
              theme={themes[index]!}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export { BuiltDifferentBento };
