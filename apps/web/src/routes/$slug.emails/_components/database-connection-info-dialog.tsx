"use client";

import * as React from "react";
import { Copy, ExternalLink, Database as DatabaseIcon } from "lucide-react";
import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { databaseSchema } from "./databases-schema";
import { z } from "zod";

interface DatabaseConnectionInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  database: z.infer<typeof databaseSchema>;
  // Connection info - these would come from database user data
  host?: string;
  port?: number;
  username?: string;
  databaseName?: string;
}

export function DatabaseConnectionInfoDialog({ 
  open, 
  onOpenChange, 
  database,
  host,
  port,
  username,
  databaseName,
}: DatabaseConnectionInfoDialogProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard`);
    }).catch(() => {
      toast.error(`Failed to copy ${label}`);
    });
  };

  // Default values if not provided
  const dbHost = host || "localhost";
  const dbPort = port || (database.type === "postgresql" ? 5432 : 3306);
  const dbUsername = username || "Not available";
  const dbName = databaseName || database.name || "Not available";
  const dbType = database.type || "mysql";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5" />
            Database Connection Info
          </DialogTitle>
          <DialogDescription>
            Connection details for "{database.name || "Unknown Database"}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Database Type */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Database Type</p>
            <Badge variant="outline" className="text-sm">
              {(dbType || "mysql").toUpperCase()}
            </Badge>
          </div>

          {/* Database Name */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Database Name</p>
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-primary flex-1">{dbName}</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(dbName, "Database name")}
                    >
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copy database name</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy database name</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Host */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Host</p>
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-primary flex-1">{dbHost}</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(dbHost, "Host")}
                    >
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copy host</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy host</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Port */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Port</p>
            <p className="text-base font-bold text-primary">{dbPort}</p>
          </div>

          {/* Username */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Username</p>
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-primary flex-1">{dbUsername}</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(dbUsername, "Username")}
                    >
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copy username</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy username</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Connection String Example */}
          <div className="space-y-1 pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground">Connection String</p>
            <div className="flex items-center gap-2">
              <p className="text-xs font-mono bg-muted p-2 rounded flex-1 break-all">
                {dbType}://{dbUsername}@{dbHost}:{dbPort}/{dbName}
              </p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(
                        `${dbType}://${dbUsername}@${dbHost}:${dbPort}/${dbName}`,
                        "Connection string"
                      )}
                    >
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copy connection string</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy connection string</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {!username && (
            <div className="text-xs text-muted-foreground pt-2 border-t">
              <p>Note: User information is not available. Database users need to be fetched separately.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
