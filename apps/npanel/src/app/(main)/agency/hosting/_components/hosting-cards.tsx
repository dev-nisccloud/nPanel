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
import { hostingSubscriptionSchema } from "./schema";

interface HostingCardProps {
  data: z.infer<typeof hostingSubscriptionSchema>;
  onViewDetails?: (id: number) => void;
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
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(data.id);
    }
  };

  return (
    <Card 
      className={cn("group cursor-pointer transition-all hover:shadow-md", className)}
      onClick={handleViewDetails}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-bold truncate">
            {data.subscriptionName}
          </CardTitle>
          <Badge variant={getStatusBadgeVariant(data.status)}>
            {getStatusDisplayText(data.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              SSL Security
            </p>
            <Badge 
              variant={data.sslEnabled ? "default" : "destructive"}
              className="text-xs"
            >
              {data.sslEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Previous Day Traffic
            </p>
            <p className="text-sm font-medium">{formatFileSize(data.trafficPrevDay)}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Disk Usage
            </p>
            <p className="text-sm font-medium">{formatFileSize(data.realSize)}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Setup Date
            </p>
            <p className="text-sm font-medium">{new Date(data.setupDate).toLocaleDateString()}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Traffic
            </p>
            <p className="text-sm font-medium">{formatFileSize(data.traffic)}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              DNS IP
            </p>
            <p className="text-sm font-medium">{data.dnsIpAddress}</p>
          </div>
        </div>

        {data.description && (
          <div className="mt-4 pt-4 border-t">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Description
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {data.description}
              </p>
            </div>
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
