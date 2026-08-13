"use client";

import * as React from "react";
import { Copy, Database as DatabaseIcon, Key, UserPlus } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { databaseSchema, relatedSiteLabel } from "./databases-schema";
import { z } from "zod";
import type { RelatedSitesStatus } from "./use-databases-by-site-id";

interface DatabaseConnectionInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: number;
  database: z.infer<typeof databaseSchema>;
  relatedSitesStatus?: RelatedSitesStatus;
  onCreateUser?: () => void;
  onChangePassword?: (userId: number) => void;
}

function CopyRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const copy = async () => {
    const ok = await copyTextToClipboard(value);
    if (ok) toast.success(`${label} copied`);
    else toast.error(`Could not copy ${label.toLowerCase()}`);
  };

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <p className={`flex-1 break-all ${mono ? "text-xs font-mono bg-muted p-2 rounded" : "text-base font-bold text-primary"}`}>
          {value}
        </p>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copy}>
          <Copy className="h-4 w-4" />
          <span className="sr-only">Copy {label}</span>
        </Button>
      </div>
    </div>
  );
}

export function DatabaseConnectionInfoDialog({
  open,
  onOpenChange,
  siteId,
  database,
  relatedSitesStatus = "ready",
  onCreateUser,
  onChangePassword,
}: DatabaseConnectionInfoDialogProps) {
  const databaseId = database.id ?? 0;
  const { data, isLoading, isError, error, refetch } = trpc.plesk.databases.getConnectionInfo.useQuery(
    { siteId, databaseId },
    { enabled: open && siteId > 0 && databaseId > 0 },
  );

  const username = data?.defaultUserLogin || data?.users[0]?.login;
  const userId = data?.defaultUserId || data?.users[0]?.id;
  const dbType = data?.type || database.type || "mysql";
  const dbName = data?.name || database.name || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5" />
            Database Connection Info
          </DialogTitle>
          <DialogDescription>
            Connection details for &quot;{database.name || "Unknown Database"}&quot;. Use localhost in site config files on this server.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 mt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-destructive">
              {error?.message || "Failed to load connection details."}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Database Type</p>
              <Badge variant="outline" className="text-sm">
                {dbType.toUpperCase()}
              </Badge>
            </div>

            <CopyRow label="Database Name" value={dbName || "Not available"} />
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Related site</p>
              <p className="text-base font-bold text-primary">
                {relatedSiteLabel(database, relatedSitesStatus)}
              </p>
            </div>
            <CopyRow label="Host (this server)" value={data?.localHost || "localhost"} />
            <CopyRow label="Remote host" value={data?.remoteHost || ""} />
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Port</p>
              <p className="text-base font-bold text-primary">{data?.port ?? 3306}</p>
            </div>

            {username ? (
              <CopyRow label="Username" value={username} />
            ) : (
              <div className="space-y-2 rounded-md border border-dashed p-3">
                <p className="text-sm text-muted-foreground">
                  No database user exists yet. Create one to connect from your site and to open phpMyAdmin.
                </p>
                {onCreateUser ? (
                  <Button type="button" size="sm" variant="outline" onClick={onCreateUser}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create database user
                  </Button>
                ) : null}
              </div>
            )}

            <p className="text-xs text-muted-foreground pt-2 border-t">
              Passwords cannot be retrieved after creation. Reset the password if you no longer have it.
            </p>

            {userId && onChangePassword ? (
              <Button type="button" variant="outline" size="sm" onClick={() => onChangePassword(userId)}>
                <Key className="mr-2 h-4 w-4" />
                Change password
              </Button>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
