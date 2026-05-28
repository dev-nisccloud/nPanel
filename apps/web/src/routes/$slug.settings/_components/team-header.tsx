"use client";

import { Building2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

interface TeamHeaderProps {
  name: string;
  slug: string;
}

export function TeamHeader({ name, slug }: TeamHeaderProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <Building2 className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{slug}</p>
      </div>
    </div>
  );
}

export function TeamHeaderSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <Skeleton className="h-11 w-11 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}
