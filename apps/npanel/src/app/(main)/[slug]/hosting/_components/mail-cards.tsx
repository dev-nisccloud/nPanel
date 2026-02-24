"use client";

import * as React from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Mail, Forward, Reply } from "lucide-react";
import { emailAccountSchema } from "./emails-schema";

interface MailCardProps {
  data: z.infer<typeof emailAccountSchema>;
  domainName?: string;
  onEdit?: (id: number | undefined) => void;
  onDelete?: (id: number | undefined) => void;
  className?: string;
}

export function MailCard({
  data,
  domainName,
  onEdit,
  onDelete,
  className
}: MailCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(data.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(data.id);
    }
  };

  const formatQuota = (quota: number | undefined) => {
    if (!quota || quota === 0) return "No usage";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(quota) / Math.log(1024));
    return Math.round(quota / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  };

  const getStatusBadgeVariant = () => {
    if (data.mailbox?.enabled) return "default";
    if (data.forwarding?.enabled) return "secondary";
    if (data.autoresponder?.enabled) return "outline";
    return "destructive";
  };

  const getStatusText = () => {
    if (data.mailbox?.enabled) return "Active";
    if (data.forwarding?.enabled) return "Forwarding";
    if (data.autoresponder?.enabled) return "Auto-reply";
    return "Disabled";
  };

  const emailAddress = `${data.name || "unknown"}@${domainName || "example.com"}`;

  const handleCardClick = () => {
    // Open edit dialog when card is clicked
    if (onEdit) {
      onEdit(data.id);
    }
  };

  return (
    <Card
      className={cn("group cursor-pointer transition-all hover:shadow-md hover:border-primary/50", className)}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <CardTitle className="text-base font-semibold truncate">
              {emailAddress}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={getStatusBadgeVariant()}>
              {getStatusText()}
            </Badge>
            {onEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handleEdit}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit email account</p>
                </TooltipContent>
              </Tooltip>
            )}
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
                  <p>Delete email account (this action cannot be reversed)</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Mailbox
            </p>
            <Badge
              variant={data.mailbox?.enabled ? "default" : "secondary"}
              className={cn("text-xs", data.mailbox?.enabled && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800")}
            >
              {data.mailbox?.enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Quota Usage
            </p>
            <p className="text-sm font-medium">
              {data.mailbox?.usage && data.mailbox.usage > 0 ? formatQuota(data.mailbox.usage) : "Not used"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Forwarding
            </p>
            <div className="flex items-center gap-1">
              <Forward className="h-3 w-3 text-muted-foreground" />
              <Badge
                variant={data.forwarding?.enabled ? "default" : "secondary"}
                className={cn("text-xs", data.forwarding?.enabled && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800")}
              >
                {data.forwarding?.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Auto-reply
            </p>
            <div className="flex items-center gap-1">
              <Reply className="h-3 w-3 text-muted-foreground" />
              <Badge
                variant={data.autoresponder?.enabled ? "default" : "secondary"}
                className={cn("text-xs", data.autoresponder?.enabled && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800")}
              >
                {data.autoresponder?.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        {(data.description || (data.aliases && data.aliases.length > 0) || (data.forwarding?.addresses && data.forwarding.addresses.length > 0)) && (
          <div className="mt-4 pt-4 border-t space-y-2">
            {data.description && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Description
                </p>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {data.description}
                </p>
              </div>
            )}

            {data.aliases && data.aliases.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Aliases ({data.aliases.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {data.aliases.slice(0, 3).map((alias, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {alias}
                    </Badge>
                  ))}
                  {data.aliases.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{data.aliases.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {data.forwarding?.addresses && data.forwarding.addresses.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Forward To ({data.forwarding.addresses.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {data.forwarding.addresses.slice(0, 2).map((address, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {address}
                    </Badge>
                  ))}
                  {data.forwarding.addresses.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{data.forwarding.addresses.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Mail Cards List Component
interface MailCardsListProps {
  data: z.infer<typeof emailAccountSchema>[];
  domainName?: string;
  onEdit?: (id: number | undefined) => void;
  onDelete?: (id: number | undefined) => void;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

export function MailCardsList({
  data,
  domainName,
  onEdit,
  onDelete,
  cols = 3,
  className
}: MailCardsListProps) {
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
      {data.map((account, index) => (
        <MailCard
          key={account.id || `email-${index}`}
          data={account}
          domainName={domainName}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
