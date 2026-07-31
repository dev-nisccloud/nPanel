"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Box,
  ChartColumnIncreasing,
  Handbag,
  Shield,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { cn } from "@/lib/utils.ts";

export type ServiceStatisticsItem = {
  /** Metric label (shown as title). */
  title: string;
  /** Metric value (shown prominently). */
  subtitle: string;
  cardIcon?: LucideIcon;
  badgeColor?: string;
  statusValue?: string;
  caption?: string;
};

export type ServiceStatisticsProps = {
  items: ServiceStatisticsItem[];
  className?: string;
  /** Reduced vertical padding  used under service/hosting heroes. */
  compact?: boolean;
  /** Drop outer section spacing  for use inside another column/section. */
  embedded?: boolean;
};

const DEFAULT_ICONS: LucideIcon[] = [
  TrendingUp,
  Users,
  Shield,
  Zap,
  Handbag,
  Box,
  ChartColumnIncreasing,
  Star,
];

const DEFAULT_BADGE_COLORS = [
  "bg-teal-400/10",
  "bg-orange-400/10",
  "bg-primary/10",
  "bg-blue-400/10",
];

type ParsedStatValue = {
  prefix: string;
  number: number;
  suffix: string;
  decimals: number;
  animatable: boolean;
};

/** Parses values like "300+", "98%", "4.9★", "<2s", "KES 85M+" for count-up animation. */
function parseStatValue(value: string): ParsedStatValue {
  const match = value.match(/^([^\d]*?)([\d,.]+)([^\d]*)$/);
  if (!match) {
    return { prefix: "", number: 0, suffix: value, decimals: 0, animatable: false };
  }

  const [, prefix, numStr, suffix] = match;
  const cleaned = numStr.replace(/,/g, "");
  const decimals = cleaned.includes(".") ? cleaned.split(".")[1]!.length : 0;
  const number = parseFloat(cleaned);

  if (!Number.isFinite(number)) {
    return { prefix: "", number: 0, suffix: value, decimals: 0, animatable: false };
  }

  return {
    prefix,
    number,
    suffix,
    decimals,
    animatable: true,
  };
}

function useAnimatedCounter(target: number, decimals: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLParagraphElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || started.current) return;

        started.current = true;
        const startTime = performance.now();

        const animate = (now: number) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - (1 - progress) ** 3;
          setCount(parseFloat((eased * target).toFixed(decimals)));

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        requestAnimationFrame(animate);
      },
      { threshold: 0.35 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, decimals]);

  return { count, ref };
}

function AnimatedMetricValue({ value }: { value: string }) {
  const parsed = parseStatValue(value);

  if (!parsed.animatable) {
    return <>{value}</>;
  }

  const { count, ref } = useAnimatedCounter(parsed.number, parsed.decimals);
  const displayNum =
    parsed.decimals > 0 ? count.toFixed(parsed.decimals) : Math.floor(count).toLocaleString();

  return (
    <span ref={ref}>
      {parsed.prefix}
      {displayNum}
      {parsed.suffix}
    </span>
  );
}

function segmentClassName(index: number, total: number) {
  const isLast = index === total - 1;
  const isFirstColumnOnMd = index % 2 === 0;
  const isInFirstRowOnMd = index < 2;

  return cn(
    "w-full border-border",
    total === 4 && "md:w-6/12 lg:w-3/12",
    total === 3 && "md:w-6/12 lg:w-4/12",
    total === 2 && "md:w-6/12 lg:w-6/12",
    total === 1 && "w-full",
    // Mobile stack
    !isLast && "border-b lg:border-b-0",
    // Tablet 2-column: vertical divider after first column in each row only
    total > 1 && isFirstColumnOnMd && index + 1 < total && "md:border-e",
    total > 2 && isInFirstRowOnMd && "md:border-b lg:border-b-0",
    total > 2 && !isInFirstRowOnMd && "md:border-b-0",
    // Desktop single row: vertical divider between every column except the last
    !isLast && "lg:border-e",
  );
}

export default function ServiceStatistics({
  items,
  className,
  compact = false,
  embedded = false,
}: ServiceStatisticsProps) {
  if (items.length === 0) return null;

  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper
      className={cn(
        embedded ? "py-0" : compact ? "py-6 sm:py-8" : "py-8 sm:py-16 lg:py-20",
        className,
      )}
    >
      <div className={cn("mx-auto w-full", embedded ? "max-w-none px-0" : "max-w-7xl px-4 md:px-8")}>
        <Card className="p-0 shadow-xs">
          <CardContent className="flex w-full flex-wrap items-stretch px-0 lg:flex-nowrap">
            {items.map((item, index) => {
              const Icon = item.cardIcon ?? DEFAULT_ICONS[index % DEFAULT_ICONS.length]!;
              const badgeColor =
                item.badgeColor ?? DEFAULT_BADGE_COLORS[index % DEFAULT_BADGE_COLORS.length]!;

              return (
                <div className={segmentClassName(index, items.length)} key={`${item.title}-${index}`}>
                  <div className="flex items-start justify-between p-6">
                    <div className="flex flex-col gap-4">
                      <p className="text-base font-medium text-muted-foreground">{item.title}</p>
                      <div>
                        <p className="text-2xl font-semibold tabular-nums text-primary">
                          <AnimatedMetricValue value={item.subtitle} />
                        </p>
                        {item.statusValue ? (
                          <div className="mt-1 flex items-center gap-2">
                            {item.caption ? (
                              <p className="text-xs text-muted-foreground">{item.caption}</p>
                            ) : null}
                            <Badge
                              className={cn(
                                "font-normal text-muted-foreground",
                                badgeColor,
                              )}
                            >
                              {item.statusValue}
                            </Badge>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="rounded-full p-3 outline outline-border/60">
                      <Icon size={16} aria-hidden />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </Wrapper>
  );
}

/** Map legacy `{ label, value }` trust stats to statistics block items. */
export function trustStatsToStatisticsItems(
  stats: { label: string; value: string }[],
): ServiceStatisticsItem[] {
  return stats.map((stat) => ({
    title: stat.label,
    subtitle: stat.value,
  }));
}
