"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { wpDetailLayout } from "@/components/wordpress/wp-detail-layout";

export function WpCardGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(wpDetailLayout.cardGrid, className)}>{children}</div>;
}

export function WpCardGridItem({
  children,
  fullWidth,
  className,
}: {
  children: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", fullWidth && wpDetailLayout.cardFullWidth, className)}>
      {children}
    </div>
  );
}

export function WpInnerGrid({
  children,
  className,
  columns = 2,
}: {
  children: React.ReactNode;
  className?: string;
  columns?: 2 | 3;
}) {
  return (
    <div
      className={cn(
        columns === 3 ? wpDetailLayout.innerGridThree : wpDetailLayout.innerGrid,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function WpPanel({
  title,
  description,
  badge,
  children,
  className,
}: {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-md border border-border/60 bg-muted/10", className)}>
      <div className="flex items-start justify-between gap-2 border-b border-border/60 px-3 py-2">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-none">{title}</p>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground leading-snug">{description}</p>
          ) : null}
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

export function WpSection({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border/60 bg-card text-card-foreground shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/60 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          {Icon ? (
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          ) : null}
          <div className="min-w-0">
            <h3 className="text-sm font-medium leading-none">{title}</h3>
            {description ? (
              <p className="mt-1 text-xs text-muted-foreground leading-snug">{description}</p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function WpInfoGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(wpDetailLayout.infoGrid, className)}>{children}</div>;
}

export function WpInfoItem({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 space-y-0.5", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium truncate">{children}</div>
    </div>
  );
}

export function WpStatTile({
  label,
  value,
  hint,
  icon: Icon,
  action,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border/60 bg-card px-3 py-2.5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
          {label}
        </span>
        {action}
      </div>
      <div className="text-lg font-semibold leading-tight tabular-nums">{value}</div>
      {hint ? <p className="text-xs text-muted-foreground leading-snug">{hint}</p> : null}
    </div>
  );
}

export function WpKeyValueRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-2 text-sm", className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">{children}</span>
    </div>
  );
}
