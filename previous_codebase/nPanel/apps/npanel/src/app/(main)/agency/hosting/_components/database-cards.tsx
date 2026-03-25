"use client";

import * as React from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Database as DatabaseIcon, ExternalLink, Key, Trash2, Settings, Info, Wrench, Download, Upload, Link2, Globe } from "lucide-react";
import { databaseSchema } from "./databases-schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DatabaseCardProps {
  data: z.infer<typeof databaseSchema>;
  currentSiteId?: number;
  domainName?: string;
  onOpenPhpMyAdmin?: (data: z.infer<typeof databaseSchema>) => void;
  onDelete?: (data: z.infer<typeof databaseSchema>) => void;
  onChangePassword?: (data: z.infer<typeof databaseSchema>) => void;
  onChangePermissions?: (data: z.infer<typeof databaseSchema>) => void;
  onConnectionInfo?: (data: z.infer<typeof databaseSchema>) => void;
  onRepair?: (data: z.infer<typeof databaseSchema>) => void;
  onImport?: (data: z.infer<typeof databaseSchema>) => void;
  onExport?: (data: z.infer<typeof databaseSchema>) => void;
  onAssignToWebsite?: (data: z.infer<typeof databaseSchema>) => void;
  className?: string;
}

export function DatabaseCard({ 
  data, 
  currentSiteId,
  domainName,
  onOpenPhpMyAdmin,
  onDelete,
  onChangePassword,
  onChangePermissions,
  onConnectionInfo,
  onRepair,
  onImport,
  onExport,
  onAssignToWebsite,
  className 
}: DatabaseCardProps) {
  const isAssigned = currentSiteId !== undefined && data["webspace-id"] === currentSiteId;
  const getStatusBadge = (status: string | undefined) => {
    if (status === "ok") {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        Inactive
      </Badge>
    );
  };

  const getTypeBadge = (type: string | undefined) => {
    const typeUpper = (type || "mysql").toUpperCase();
    return (
      <Badge variant="outline">
        {typeUpper}
      </Badge>
    );
  };

  return (
    <Card className={cn("group transition-all hover:shadow-md hover:border-primary/50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="p-2 bg-primary/10 rounded-full flex-shrink-0">
              <DatabaseIcon className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold line-clamp-1 flex-1">
              {data.name || "Unknown Database"}
            </CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onOpenPhpMyAdmin?.(data)}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open phpMyAdmin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onConnectionInfo?.(data)}>
                <Info className="mr-2 h-4 w-4" />
                Connection Info
              </DropdownMenuItem>
              {!isAssigned && onAssignToWebsite && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onAssignToWebsite?.(data)}>
                    <Link2 className="mr-2 h-4 w-4" />
                    Assign to {domainName || "Website"}
                  </DropdownMenuItem>
                </>
              )}
              {/* TODO: Implement these features later
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onChangePassword?.(data)}>
                <Key className="mr-2 h-4 w-4" />
                Change Password
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChangePermissions?.(data)}>
                <Settings className="mr-2 h-4 w-4" />
                Change Permissions
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onRepair?.(data)}>
                <Wrench className="mr-2 h-4 w-4" />
                Repair (via phpMyAdmin)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onImport?.(data)}>
                <Upload className="mr-2 h-4 w-4" />
                Import Dump (via phpMyAdmin)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.(data)}>
                <Download className="mr-2 h-4 w-4" />
                Export Dump (via phpMyAdmin)
              </DropdownMenuItem>
              */}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                variant="destructive"
                onClick={() => onDelete?.(data)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        <div className="flex items-center gap-2">
          {getTypeBadge(data.type)}
          {getStatusBadge(data.status)}
        </div>
        <div className="flex items-center gap-2 text-sm">
          {isAssigned ? (
            <>
              <Globe className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">{domainName || "Current Website"}</span>
            </>
          ) : (
            <Badge variant="outline" className="text-xs">
              Not assigned
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Database Cards List Component
interface DatabaseCardsListProps {
  data: z.infer<typeof databaseSchema>[];
  currentSiteId?: number;
  domainName?: string;
  onOpenPhpMyAdmin?: (data: z.infer<typeof databaseSchema>) => void;
  onDelete?: (data: z.infer<typeof databaseSchema>) => void;
  onChangePassword?: (data: z.infer<typeof databaseSchema>) => void;
  onChangePermissions?: (data: z.infer<typeof databaseSchema>) => void;
  onConnectionInfo?: (data: z.infer<typeof databaseSchema>) => void;
  onRepair?: (data: z.infer<typeof databaseSchema>) => void;
  onImport?: (data: z.infer<typeof databaseSchema>) => void;
  onExport?: (data: z.infer<typeof databaseSchema>) => void;
  onAssignToWebsite?: (data: z.infer<typeof databaseSchema>) => void;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

export function DatabaseCardsList({ 
  data, 
  currentSiteId,
  domainName,
  onOpenPhpMyAdmin,
  onDelete,
  onChangePassword,
  onChangePermissions,
  onConnectionInfo,
  onRepair,
  onImport,
  onExport,
  onAssignToWebsite,
  cols = 3,
  className 
}: DatabaseCardsListProps) {
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
      {data.map((db, index) => (
        <DatabaseCard
          key={db.id || `db-${index}`}
          data={db}
          currentSiteId={currentSiteId}
          domainName={domainName}
          onOpenPhpMyAdmin={onOpenPhpMyAdmin}
          onDelete={onDelete}
          onChangePassword={onChangePassword}
          onChangePermissions={onChangePermissions}
          onConnectionInfo={onConnectionInfo}
          onRepair={onRepair}
          onImport={onImport}
          onExport={onExport}
          onAssignToWebsite={onAssignToWebsite}
        />
      ))}
    </div>
  );
}
