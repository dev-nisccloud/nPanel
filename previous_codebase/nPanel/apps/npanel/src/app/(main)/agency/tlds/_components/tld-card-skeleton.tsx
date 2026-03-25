"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function TldCardSkeleton() {
  return (
    <div className="flex flex-col p-3 bg-card border border-border rounded-lg">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-6 w-24 mb-2" />
      <Skeleton className="h-3 w-20 mb-1" />
      <Skeleton className="h-3 w-32 mb-1" />
      <Skeleton className="h-3 w-28 mt-2" />
    </div>
  );
}
