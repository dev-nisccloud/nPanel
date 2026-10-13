import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function formatCrmDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatCrmMoney(
  amount: string | number | null | undefined,
  currency = "KES",
) {
  if (amount == null || amount === "") return "—";
  const value = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-KE", {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-KE")}`;
  }
}

export function displayText(value: string | number | null | undefined) {
  if (value == null || value === "") return "—";
  return String(value);
}

export function CrmDetailFrame({ children }: { children: ReactNode }) {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">{children}</div>
    </div>
  );
}

export function CrmDetailSkeleton() {
  return (
    <CrmDetailFrame>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-20" />
          <div>
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      <div className="mt-6 space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-24 w-36" />
          <Skeleton className="h-24 w-36" />
          <Skeleton className="h-24 w-36" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </CrmDetailFrame>
  );
}

export function CrmDetailMissing({
  title,
  description,
  backTo,
  backLabel,
}: {
  title: string;
  description: string;
  backTo: string;
  backLabel: string;
}) {
  return (
    <CrmDetailFrame>
      <div className="flex items-center gap-4">
        <Link to={backTo}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-base font-semibold tracking-tight">{title}</h1>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-6">
        <Link to={backTo}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backLabel}
          </Button>
        </Link>
      </div>
    </CrmDetailFrame>
  );
}

export function CrmDetailHeader({
  backTo,
  title,
  description,
  actions,
}: {
  backTo: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        <Link to={backTo}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
          <p className="truncate text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function CrmInfoCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="flex h-full flex-col overflow-hidden py-0 gap-0">
      <CardHeader className="border-b bg-muted/30 px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-0">{children}</CardContent>
    </Card>
  );
}

export function CrmFieldGrid({ children }: { children: ReactNode }) {
  return <div className="flex h-full flex-1 flex-col divide-y divide-border">{children}</div>;
}

export function CrmFieldRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
      {children}
    </div>
  );
}

export function CrmField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="truncate text-sm font-semibold text-foreground">{children}</div>
    </div>
  );
}

export function CrmActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant={active ? "default" : "secondary"}
      className={
        active
          ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800"
          : undefined
      }
    >
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

export function CrmEmptyLine({ children }: { children: ReactNode }) {
  return <p className="px-4 py-6 text-sm text-muted-foreground">{children}</p>;
}
