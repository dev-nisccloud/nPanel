"use client";

import * as React from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal, Edit, Trash2, Copy, Globe, Shield, ExternalLink, Settings, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

import { wordpressInstallationSchema } from "./schema";

interface WordPressCardProps {
  data: z.infer<typeof wordpressInstallationSchema>;
  onEdit?: (id: number | undefined) => void;
  onDelete?: (id: number | undefined) => void;
  onCopy?: (data: z.infer<typeof wordpressInstallationSchema>) => void;
  onSettings?: (id: number | undefined) => void;
  className?: string;
}

export function WordPressCard({
  data,
  onEdit,
  onDelete,
  onCopy,
  onSettings,
  className,
}: WordPressCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    if (data.id) {
      router.push(`/agency/wordpress/${data.id}`);
    }
  };

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

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCopy) {
      onCopy(data);
    }
  };

  const handleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSettings) {
      onSettings(data.id);
    }
  };

  const getStatusBadge = () => {
    if (data.status?.infected) {
      return <Badge variant="destructive">Infected</Badge>;
    }
    if (data.status?.unsupported) {
      return <Badge variant="secondary">Unsupported</Badge>;
    }
    if (data.status?.alive) {
      return <Badge variant="default">Online</Badge>;
    }
    return <Badge variant="secondary">Offline</Badge>;
  };

  const getWordPressVersion = () => {
    return data.version || "Unknown";
  };

  const getDomainName = () => {
    return data.domain?.name || "Unknown Domain";
  };

  const getOwnerName = () => {
    return data.owner?.name || data.owner?.login || "Unknown Owner";
  };

  const getSslStatus = () => {
    return data.domain?.ssl?.enabled || false;
  };

  const getUpdatesCount = () => {
    const pluginUpdates = data.features?.updates?.amountOfPluginsWithUpdates || 0;
    const themeUpdates = data.features?.updates?.amountOfThemesWithUpdates || 0;
    return pluginUpdates + themeUpdates;
  };

  return (
    <Card
      className={cn("group cursor-pointer transition-all hover:shadow-md", className)}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <CardTitle className="text-lg font-bold truncate">
              {data.displayTitle || data.title || "Unknown Installation"}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {/* Action menu - to be implemented later */}
            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => window.open(data.url, '_blank')}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Website
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Installation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSettings}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopy}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> */}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Domain
              </p>
              <p className="text-sm font-medium">{getDomainName()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                WordPress Version
              </p>
              <Badge 
                variant={data.version ? "default" : "secondary"}
                className="text-xs"
              >
                {getWordPressVersion()}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                SSL Security
              </p>
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-muted-foreground" />
                <Badge 
                  variant={getSslStatus() ? "default" : "secondary"}
                  className="text-xs"
                >
                  {getSslStatus() ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Owner
              </p>
              <p className="text-sm font-medium">{getOwnerName()}</p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        {(data.owner || getUpdatesCount() > 0 || data.features?.maintenance?.status) && (
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Owner
              </p>
              <p className="text-sm font-medium">{getOwnerName()}</p>
            </div>
            {getUpdatesCount() > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Available Updates
                </p>
                <div className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="outline" className="text-xs">
                    {getUpdatesCount()} Updates
                  </Badge>
                </div>
              </div>
            )}
            {data.features?.maintenance?.status && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Maintenance Mode
                </p>
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface WordPressCardsListProps {
  data: z.infer<typeof wordpressInstallationSchema>[];
  onEdit?: (id: number | undefined) => void;
  onDelete?: (id: number | undefined) => void;
  onCopy?: (data: z.infer<typeof wordpressInstallationSchema>) => void;
  onSettings?: (id: number | undefined) => void;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
}

export function WordPressCardsList({
  data,
  onEdit,
  onDelete,
  onCopy,
  onSettings,
  cols = 1,
  className,
  ...props
}: WordPressCardsListProps) {
  return (
    <div
      className={cn(
        "space-y-4",
        className
      )}
      {...props}
    >
      {data.map((item) => (
        <WordPressCard
          key={item.id || `${item.displayTitle}-${item.url}`}
          data={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onCopy={onCopy}
          onSettings={onSettings}
        />
      ))}
    </div>
  );
}
