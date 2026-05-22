"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card
      className={cn(
        "border-border/60 shadow-sm",
        unavailable && "opacity-75",
        className,
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            {Icon ? (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/30">
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
              </div>
            ) : null}
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
              {description ? (
                <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
              ) : null}
            </div>
          </div>
          {badge ? (
            <Badge variant={badge.variant ?? "secondary"} className="shrink-0">
              {badge.label}
            </Badge>
          ) : null}
        </div>
        {unavailable && unavailableReason ? (
          <p className="text-xs text-muted-foreground pt-1">{unavailableReason}</p>
        ) : null}
      </CardHeader>
      <CardContent className={cn(unavailable && "pointer-events-none")}>{children}</CardContent>
      {footer ? <div className="border-t border-border/60 px-6 py-4">{footer}</div> : null}
    </Card>
  );
}
