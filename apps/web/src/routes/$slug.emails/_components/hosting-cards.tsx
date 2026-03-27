"use client";

import * as React from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getStatusDisplayText,
  getStatusBadgeVariant,
  formatFileSize
} from "./hosting-utils";
import { hostingSubscriptionSchema, type CustomerHostingListItem } from "./schema";

type HostingCardData = z.infer<typeof hostingSubscriptionSchema> | (CustomerHostingListItem & { sslEnabled?: boolean; realSize?: number; traffic?: number });

interface HostingCardProps {
  data: HostingCardData;
  onViewDetails?: (idOrData: number | string | HostingCardData) => void;
  onEdit?: (id: number) => void;
  onSuspend?: (id: number) => void;
  onCancel?: (id: number) => void;
  className?: string;
}

export function HostingCard({
  data,
  onViewDetails,
  onEdit,
  onSuspend,
  onCancel,
  className
}: HostingCardProps) {
  const handleViewDetails = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onViewDetails) {
      onViewDetails(data);
    }
  };

  return (
    <Card
      className={cn("group cursor-pointer transition-all hover:shadow-md hover:border-primary/50", className)}
      onClick={handleViewDetails}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold line-clamp-2 flex-1">
            {data.subscriptionName ?? "—"}
          </CardTitle>
          <Badge
            variant={getStatusBadgeVariant(data.status)}
            className={cn(
              "flex-shrink-0",
              data.status === 0 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800" : ""
            )}
          >
            {getStatusDisplayText(data.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {(data.sslEnabled !== undefined || data.realSize !== undefined || data.traffic !== undefined) && (
          <div className="grid grid-cols-3 gap-3">
            {data.sslEnabled !== undefined && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  SSL Security
                </p>
                <Badge
                  variant={data.sslEnabled ? "default" : "destructive"}
                  className={cn("text-xs w-fit", data.sslEnabled && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800")}
                >
                  {data.sslEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            )}
            {data.realSize !== undefined && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Disk Usage
                </p>
                <p className="text-sm font-semibold">{formatFileSize(data.realSize)}</p>
              </div>
            )}
            {data.traffic !== undefined && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Traffic
                </p>
                <p className="text-sm font-semibold">{formatFileSize(data.traffic)}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hosting Cards List Component
interface HostingCardsListProps {
  data: HostingCardData[];
  onViewDetails?: (idOrData: number | string | HostingCardData) => void;
  onEdit?: (id: number) => void;
  onSuspend?: (id: number) => void;
  onCancel?: (id: number) => void;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

export function HostingCardsList({
  data,
  onViewDetails,
  onEdit,
  onSuspend,
  onCancel,
  cols = 1,
  className
}: HostingCardsListProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        cols === 1 && "grid-cols-1",
        cols === 2 && "grid-cols-1 md:grid-cols-2",
        cols === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {data.map((subscription) => (
        <HostingCard
          key={subscription.id}
          data={subscription}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onSuspend={onSuspend}
          onCancel={onCancel}
        />
      ))}
    </div>
  );
}

// Hosting Cards Grid Component
interface HostingCardsGridProps {
  data: HostingCardData[];
  onViewDetails?: (idOrData: number | string | HostingCardData) => void;
  onEdit?: (id: number) => void;
  onSuspend?: (id: number) => void;
  onCancel?: (id: number) => void;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export function HostingCardsGrid({
  data,
  onViewDetails,
  onEdit,
  onSuspend,
  onCancel,
  cols = 3,
  className
}: HostingCardsGridProps) {
  return (
    <div className={cn("grid gap-4", className)}>
      {data.map((subscription) => (
        <HostingCard
          key={subscription.id}
          data={subscription}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onSuspend={onSuspend}
          onCancel={onCancel}
        />
      ))}
    </div>
  );
}
