"use client";

import * as React from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2 } from "lucide-react";
import { dnsRecordSchema } from "./dns-schema";

interface DnsCardProps {
  data: z.infer<typeof dnsRecordSchema>;
  onView?: (data: z.infer<typeof dnsRecordSchema>) => void;
  onDelete?: (id: number | undefined) => void;
  className?: string;
}

export function DnsCard({ 
  data, 
  onView,
  onDelete, 
  className 
}: DnsCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(data.id);
    }
  };

  const getTypeBadgeVariant = (type: string | undefined) => {
    switch (type?.toUpperCase()) {
      case "A":
        return "default";
      case "AAAA":
        return "secondary";
      case "CNAME":
        return "outline";
      case "MX":
        return "destructive";
      case "TXT":
        return "secondary";
      case "NS":
        return "outline";
      default:
        return "outline";
    }
  };

  const handleCardClick = () => {
    if (onView) {
      onView(data);
    }
  };

  const ttl = typeof data.opt === 'number' ? data.opt : (typeof data.opt === 'string' ? parseInt(data.opt) || 3600 : 3600);

  return (
    <Card 
      className={cn("group cursor-pointer transition-all hover:shadow-md hover:border-primary/50", className)}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold line-clamp-1 flex-1">
            {data.host === "@" ? "@" : data.host || "Unknown Host"}
          </CardTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={getTypeBadgeVariant(data.type)}>
              {data.type || "Unknown"}
            </Badge>
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
                  <p>Delete record (this action cannot be reversed)</p>
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
              TTL
            </p>
            <p className="text-sm font-semibold">
              {ttl}s
            </p>
          </div>
          
          <div className="space-y-1 col-span-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Value
            </p>
            <p className="text-sm font-bold text-primary truncate" title={data.value || "No value"}>
              {data.value || "No value"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// DNS Cards List Component
interface DnsCardsListProps {
  data: z.infer<typeof dnsRecordSchema>[];
  onView?: (data: z.infer<typeof dnsRecordSchema>) => void;
  onDelete?: (id: number | undefined) => void;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

export function DnsCardsList({ 
  data, 
  onView, 
  onDelete, 
  cols = 3,
  className 
}: DnsCardsListProps) {
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
      {data.map((record, index) => (
        <DnsCard
          key={record.id || `dns-${index}`}
          data={record}
          onView={onView}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
