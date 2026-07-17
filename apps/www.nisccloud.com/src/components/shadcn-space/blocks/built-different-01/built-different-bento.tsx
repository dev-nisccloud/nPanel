import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { cn } from "@/lib/utils.ts";
import { ContextualVisual } from "./context-visuals.tsx";
import {
  detectVisualTheme,
  type BuiltDifferentPoint,
  type VisualTheme,
} from "./visual-context.ts";
import {
  Globe2,
  Lock,
  MapPin,
  Server,
  Shield,
  Smartphone,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type { BuiltDifferentPoint };

export type BuiltDifferentBentoProps = {
  points: BuiltDifferentPoint[];
  headline?: string;
  subtext?: string;
  badge?: string;
  className?: string;
};

type LayoutVariant = "stat" | "ring" | "chart" | "shield-wide" | "social-wide" | "banner";

const LAYOUTS: { variant: LayoutVariant; className: string }[] = [
  { variant: "stat", className: "col-span-full lg:col-span-2" },
  { variant: "ring", className: "col-span-full sm:col-span-3 lg:col-span-2" },
  { variant: "chart", className: "col-span-full sm:col-span-3 lg:col-span-2" },
  { variant: "shield-wide", className: "col-span-full lg:col-span-3" },
  { variant: "social-wide", className: "col-span-full lg:col-span-3" },
  { variant: "banner", className: "col-span-full" },
];

const THEME_ICONS: Record<VisualTheme, LucideIcon> = {
  uptime: Server,
  speed: Zap,
  mpesa: Smartphone,
  security: Lock,
  migration: Server,
  trust: Users,
  pricing: TrendingUp,
  location: MapPin,
  growth: TrendingUp,
  support: Users,
  deploy: Server,
  default: Globe2,
};

function BentoCard({
  point,
  index,
  variant,
  layoutClassName,
  theme,
}: {
  point: BuiltDifferentPoint;
  index: number;
  variant: LayoutVariant;
  layoutClassName: string;
  theme: VisualTheme;
}) {
  const isWide = variant === "shield-wide" || variant === "social-wide";
  const isStat = variant === "stat";
  const isBanner = variant === "banner";
  const Icon = THEME_ICONS[theme] ?? Shield;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={layoutClassName}
    >
      <Card
        className={cn(
          "group relative h-full overflow-hidden border-border/60 py-0 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
          isStat && "flex",
        )}
      >
        {/* Ambient glow on hover */}
        <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/5 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

        <CardContent
          className={cn(
            "pt-6",
            isWide && "grid sm:grid-cols-2",
            isStat && "relative m-auto size-fit w-full",
            isBanner && "flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8",
          )}
        >
          {isWide ? (
            <>
              <div className="relative z-10 flex flex-col justify-between space-y-8 lg:space-y-6">
                <motion.div
                  className="relative flex aspect-square size-12 rounded-full border border-border before:absolute before:-inset-2 before:rounded-full before:border before:border-border/60"
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Icon className="m-auto size-5 text-primary" strokeWidth={1.25} />
                </motion.div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-foreground transition group-hover:text-primary">
                    {point.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{point.desc}</p>
                </div>
              </div>
              <div
                className={
                  variant === "social-wide"
                    ? "before:bg-border relative mt-6 before:absolute before:inset-0 before:mx-auto before:w-px sm:-my-6 sm:-mr-6 sm:mt-0"
                    : ""
                }
              >
                <ContextualVisual point={point} theme={theme} variant={variant} />
              </div>
            </>
          ) : isBanner ? (
            <>
              <ContextualVisual point={point} theme={theme} variant={variant} />
              <div className="space-y-2 text-center sm:text-left">
                <h3 className="text-lg font-medium text-foreground transition group-hover:text-primary">
                  {point.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{point.desc}</p>
              </div>
            </>
          ) : (
            <>
              <div className={cn("relative flex min-h-[140px] items-center justify-center px-2", !isStat && "mb-2")}>
                <ContextualVisual point={point} theme={theme} variant={variant} />
              </div>
              <div className={cn("relative z-10 space-y-2", "mt-4 text-center")}>
                <h3 className="text-lg font-medium text-foreground transition group-hover:text-primary">
                  {point.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{point.desc}</p>
              </div>
            </>
          )}
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

  const items = points.slice(0, 6).map((point, index) => ({
    point,
    index,
    theme: detectVisualTheme(point),
    ...(LAYOUTS[index] ?? LAYOUTS[LAYOUTS.length - 1]),
  }));

  return (
    <section className={cn("relative border-t border-border/40 bg-muted/20 py-16 md:py-24 dark:bg-transparent", className)}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute bottom-0 right-0 h-[400px] w-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(ellipse, oklch(0.60 0.22 235 / 0.35), transparent)" }}
        />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          {badge && (
            <span className="mb-3 inline-block text-xs font-mono font-bold uppercase tracking-widest text-primary">
              {badge}
            </span>
          )}
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{headline}</h2>
          {subtext && (
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{subtext}</p>
          )}
        </motion.div>

        <div className="relative">
          <div className="relative z-10 grid grid-cols-6 gap-3">
            {items.map(({ point, index, variant, className: layoutClassName, theme }) => (
              <BentoCard
                key={point.title}
                point={point}
                index={index}
                variant={variant}
                layoutClassName={layoutClassName}
                theme={theme}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export { BuiltDifferentBento };
