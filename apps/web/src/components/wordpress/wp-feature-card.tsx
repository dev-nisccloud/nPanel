"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { wpDetailLayout } from "@/components/wordpress/wp-detail-layout";
import { Badge } from "@/components/ui/badge";

interface WpFeatureCardProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: { label: string; variant?: "default" | "secondary" | "destructive" | "outline" };
  unavailable?: boolean;
  unavailableReason?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
  /** Span full width in parent grids */
  span?: "full";
}

export function WpFeatureCard({
  title,
  description,
  icon: Icon,
  badge,
  unavailable,
  unavailableReason,
  children,
  className,
  footer,
  span,
}: WpFeatureCardProps) {
  return (
    <article
      className={cn(
        "flex h-full min-h-0 flex-col rounded-lg border border-border/60 bg-card text-card-foreground shadow-sm",
        unavailable && "opacity-75",
        span === "full" && wpDetailLayout.cardFullWidth,
        className,
      )}
    >
      <header className="flex items-start justify-between gap-2 border-b border-border/60 px-3 py-2.5">
        <div className="flex min-w-0 gap-2">
          {Icon ? (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/30">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            </div>
          ) : null}
          <div className="min-w-0 space-y-0.5">
            <h3 className="text-sm font-medium leading-none">{title}</h3>
            {description ? (
              <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{description}</p>
            ) : null}
            {unavailable && unavailableReason ? (
              <p className="text-xs text-muted-foreground">{unavailableReason}</p>
            ) : null}
          </div>
        </div>
        {badge ? (
          <Badge variant={badge.variant ?? "secondary"} className="shrink-0 text-xs">
            {badge.label}
          </Badge>
        ) : null}
      </header>
      <div className={cn("p-3", unavailable && "pointer-events-none")}>{children}</div>
      {footer ? <div className="border-t border-border/60 px-3 py-2.5">{footer}</div> : null}
    </article>
  );
}
