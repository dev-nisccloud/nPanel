"use client";

import * as React from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getStatusDisplayText,
  getStatusBadgeVariant,
  formatFileSize
} from "./hosting-utils";
import { hostingSubscriptionSchema } from "./schema";

interface HostingCardProps {
  data: z.infer<typeof hostingSubscriptionSchema>;
  onViewDetails?: (id: number) => void;
  onEdit?: (id: number) => void;
  onSuspend?: (id: number) => void;
  onCancel?: (id: number) => void;
  onCreateSubscription?: (data: z.infer<typeof hostingSubscriptionSchema>) => void;
  /** When true, Create subscription button is disabled and tooltip shows tooltipLinked */
  hasLinkedSubscription?: boolean;
  tooltipLinked?: string;
  className?: string;
}

export function HostingCard({
  data,
  onViewDetails,
  onEdit,
  onSuspend,
  onCancel,
  onCreateSubscription,
  hasLinkedSubscription,
  tooltipLinked,
  className
}: HostingCardProps) {
  const handleViewDetails = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onViewDetails) {
      onViewDetails(data.id);
    }
  };

  const handleCreateSubscription = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateSubscription?.(data);
  };

  return (
    <Card
      className={cn("group cursor-pointer transition-all hover:shadow-md hover:border-primary/50", className)}
      onClick={handleViewDetails}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold line-clamp-2 flex-1">
            {data.subscriptionName}
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
        <div className="grid grid-cols-3 gap-3">
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

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Disk Usage
            </p>
            <p className="text-sm font-semibold">{formatFileSize(data.realSize)}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Traffic
            </p>
            <p className="text-sm font-semibold">{formatFileSize(data.traffic)}</p>
          </div>
        </div>
        {onCreateSubscription && (
          <div className="mt-4 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="block w-full">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={hasLinkedSubscription}
                      onClick={handleCreateSubscription}
                    >
                      Create subscription
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  {hasLinkedSubscription && tooltipLinked
                    ? tooltipLinked
                    : "Create a NISC subscription and link it to a team or user."}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hosting Cards List Component
interface HostingCardsListProps {
  data: z.infer<typeof hostingSubscriptionSchema>[];
  onViewDetails?: (id: number) => void;
  onEdit?: (id: number) => void;
  onSuspend?: (id: number) => void;
  onCancel?: (id: number) => void;
  onCreateSubscription?: (data: z.infer<typeof hostingSubscriptionSchema>) => void;
  pleskIdsWithLinkedSubscription?: Set<string>;
  createSubscriptionTooltipLinked?: string;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

export function HostingCardsList({
  data,
  onViewDetails,
  onEdit,
  onSuspend,
  onCancel,
  onCreateSubscription,
  pleskIdsWithLinkedSubscription,
  createSubscriptionTooltipLinked,
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
          onCreateSubscription={onCreateSubscription}
          hasLinkedSubscription={pleskIdsWithLinkedSubscription?.has(String(subscription.id))}
          tooltipLinked={createSubscriptionTooltipLinked}
        />
      ))}
    </div>
  );
}

// Hosting Cards Grid Component
interface HostingCardsGridProps {
  data: z.infer<typeof hostingSubscriptionSchema>[];
  onViewDetails?: (id: number) => void;
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
