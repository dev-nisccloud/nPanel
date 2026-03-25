"use client";

import * as React from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Globe, ExternalLink } from "lucide-react";
import { subdomainSchema } from "./subdomains-schema";

interface SubdomainCardProps {
  data: z.infer<typeof subdomainSchema>;
  onView?: (data: z.infer<typeof subdomainSchema>) => void;
  onDelete?: (id: number | undefined) => void;
  className?: string;
}

export function SubdomainCard({
  data,
  onView,
  onDelete,
  className
}: SubdomainCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(data.id);
    }
  };

  const handleOpenInNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://${data.name}`, '_blank');
  };

  const handleCardClick = () => {
    if (onView) {
      onView(data);
    }
  };

  const getStatusBadgeVariant = () => {
    if (data.status === "ok") return "default";
    return "destructive";
  };

  const getStatusText = () => {
    if (data.status === "ok") return "Active";
    return "Inactive";
  };

  return (
    <Card
      className={cn("group cursor-pointer transition-all hover:shadow-md hover:border-primary/50", className)}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <CardTitle className="text-base font-semibold truncate">
              {data.name || "Unknown Subdomain"}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={getStatusBadgeVariant()}>
              {getStatusText()}
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleOpenInNewTab}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open in new tab</p>
              </TooltipContent>
            </Tooltip>
            {onDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete subdomain (this action cannot be reversed)</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Parent Domain
            </p>
            <p className="text-sm font-semibold truncate" title={data.parent || "N/A"}>
              {data.parent || "N/A"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              SSL Security
            </p>
            <Badge
              variant={data.properties?.ssl ? "default" : "secondary"}
              className={cn("text-xs w-fit", data.properties?.ssl && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800")}
            >
              {data.properties?.ssl ? "Enabled" : "Disabled"}
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Document Root
            </p>
            <p className="text-sm font-semibold truncate" title={data.properties?.www_root || "N/A"}>
              {data.properties?.www_root ? data.properties.www_root.split('/').pop() : "N/A"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Subdomain Cards List Component
interface SubdomainCardsListProps {
  data: z.infer<typeof subdomainSchema>[];
  onView?: (data: z.infer<typeof subdomainSchema>) => void;
  onDelete?: (id: number | undefined) => void;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

export function SubdomainCardsList({
  data,
  onView,
  onDelete,
  cols = 3,
  className
}: SubdomainCardsListProps) {
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
      {data.map((subdomain, index) => (
        <SubdomainCard
          key={subdomain.id || `subdomain-${index}`}
          data={subdomain}
          onView={onView}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
