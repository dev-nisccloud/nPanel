"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
}: WpFeatureCardProps) {
  return (
    <Card className={cn("overflow-hidden py-0 gap-0", unavailable && "opacity-75", className)}>
      <CardHeader className="border-b bg-muted/30 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              {Icon ? <Icon className="h-4 w-4 text-muted-foreground" aria-hidden /> : null}
              {title}
            </CardTitle>
            {description ? (
              <CardDescription className="text-xs">{description}</CardDescription>
            ) : null}
            {unavailable && unavailableReason ? (
              <p className="mt-1 text-xs text-muted-foreground">{unavailableReason}</p>
            ) : null}
          </div>
          {badge ? (
            <Badge variant={badge.variant ?? "secondary"} className="shrink-0 text-xs">
              {badge.label}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className={cn("p-4", unavailable && "pointer-events-none")}>{children}</CardContent>
      {footer ? <div className="border-t px-4 py-3">{footer}</div> : null}
    </Card>
  );
}
