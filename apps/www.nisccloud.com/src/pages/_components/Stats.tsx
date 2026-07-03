import { useEffect, useRef } from "react";
import { motion, useSpring, useTransform, useInView } from "motion/react";
import { ShieldCheck, Globe, Headphones, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const conceptBadges = [
  { icon: ShieldCheck, label: "Reliability", color: "bg-primary/10 text-primary" },
  { icon: Zap, label: "Speed", color: "bg-teal-400/10 text-teal-400" },
  { icon: Globe, label: "Growth", color: "bg-orange-400/10 text-orange-400" },
];

const stats = [
  {
    icon: Globe,
    count: 500,
    suffix: "+",
    label: "Businesses Powered",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: ShieldCheck,
    count: 99,
    suffix: ".9%",
    label: "Uptime Guaranteed",
    color: "bg-emerald-500/10 text-emerald-500",
  },
  {
    icon: Headphones,
    count: 24,
    suffix: "/7",
    label: "Expert Support",
    color: "bg-violet-500/10 text-violet-500",
  },
  {
    icon: Zap,
    count: 5,
    suffix: "min",
    label: "Avg. Deploy Time",
    color: "bg-orange-400/10 text-orange-400",
  },
];

const AnimatedCounter = ({
  value,
  isInView,
}: {
  value: number;
  isInView: boolean;
}) => {
  const springValue = useSpring(0, { bounce: 0, duration: 2000 });
  const displayValue = useTransform(springValue, (current) =>
    Math.round(current)
  );

  useEffect(() => {
    if (isInView) {
      springValue.set(value);
    }
  }, [isInView, value, springValue]);

  return <motion.span>{displayValue}</motion.span>;
};

export default function Stats() {
  const statsRef = useRef(null);
  const isInView = useInView(statsRef, { once: true, margin: "-100px" });

  return (
    <section
      id="stats"
      className="py-16 sm:py-20 border-y border-border/40"
      style={{
        background:
          "radial-gradient(ellipse 100% 80% at 50% 50%, oklch(0.60 0.22 235 / 0.05), transparent)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col items-center justify-center gap-10 md:gap-16">

          {/* Heading + concept badges */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="flex flex-col items-center justify-center gap-5 text-center"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight max-w-3xl">
              Trusted by Kenyan businesses to deliver{" "}
              <span className="text-primary italic font-serif">
                exceptional
              </span>{" "}
              results
            </h2>
            <p className="text-muted-foreground text-base max-w-xl">
              From hosting to marketing, we combine technology and expertise to
              power your business online  reliably, fast, and at scale.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3">
              {conceptBadges.map((badge, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-2.5 px-5 py-2 rounded-full",
                    badge.color
                  )}
                >
                  <badge.icon className="w-5 h-5" />
                  <span className="text-2xl font-serif italic font-normal">
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Animated stat counters */}
          <div
            ref={statsRef}
            className="w-full grid grid-cols-2 lg:grid-cols-4 gap-1"
          >
            {stats.map((stat, index) => (
              <div
                key={index}
                className="relative px-5 py-6 sm:py-8 gap-2.5 flex flex-col items-center justify-center"
              >
                {/* Vertical divider between items (desktop) */}
                {index !== 0 && (
                  <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-20 bg-border" />
                )}

                {/* Icon badge */}
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center mb-0.5",
                    stat.color
                  )}
                >
                  <stat.icon className="w-4 h-4" />
                </div>

                {/* Animated number */}
                <div className="flex items-start gap-0 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                  <AnimatedCounter value={stat.count} isInView={isInView} />
                  <span className="mt-0.5 text-base font-extrabold text-primary md:text-lg">
                    {stat.suffix}
                  </span>
                </div>

                {/* Label */}
                <p className="text-xs sm:text-sm font-medium text-muted-foreground text-center uppercase tracking-wide">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
