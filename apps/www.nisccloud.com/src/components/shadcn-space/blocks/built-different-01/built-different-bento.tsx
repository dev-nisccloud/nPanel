import { motion } from "motion/react";
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
};

function BentoCard({
  point,
  theme,
  index,
}: {
  point: BuiltDifferentPoint;
  theme: VisualTheme;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-32px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.3) }}
    >
      <Card className="h-full overflow-hidden border-border/60 py-0 shadow-sm transition-colors duration-300 hover:border-primary/25">
        <CardContent className="flex h-full flex-col gap-4 p-5 pt-5">
          <ContextualVisual point={point} theme={theme} />
          <div className="mt-auto space-y-1.5 text-center">
            <h3 className="text-base font-semibold tracking-tight text-foreground">
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
  headline = "Why Teams Choose Us",
  subtext,
  badge,
  className,
}: BuiltDifferentBentoProps) {
  if (points.length === 0) return null;

  const items = points.slice(0, 6);
  const themes = assignUniqueThemes(items);

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
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{headline}</h2>
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
