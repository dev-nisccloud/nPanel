"use client";

import * as React from "react";
import { Database as DatabaseIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { apiUrl } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type PhpMyAdminDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: number;
  databaseId: number;
  databaseName?: string;
};

function phpMyAdminUrl(siteId: number, databaseId: number): string {
  const params = new URLSearchParams({
    siteId: String(siteId),
    databaseId: String(databaseId),
    embed: "1",
  });
  return apiUrl(`/api/hosting/phpmyadmin?${params.toString()}`);
}

export function PhpMyAdminDialog({
  open,
  onOpenChange,
  siteId,
  databaseId,
  databaseName,
}: PhpMyAdminDialogProps) {
  const [loaded, setLoaded] = React.useState(false);
  const src = open ? phpMyAdminUrl(siteId, databaseId) : "";

  React.useEffect(() => {
    if (!open) setLoaded(false);
  }, [open, src]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex h-[92vh] w-[96vw] max-w-[96vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[96vw]",
        )}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="shrink-0 space-y-0 border-b px-5 py-3 pr-12 text-left">
          <DialogTitle className="flex items-center gap-2 text-base">
            <DatabaseIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">
              phpMyAdmin{databaseName ? ` — ${databaseName}` : ""}
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            phpMyAdmin for {databaseName || "this database"}
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-h-0 flex-1 bg-muted/30">
          {!loaded ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/80">
              <Spinner size={28} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading phpMyAdmin…</p>
            </div>
          ) : null}
          {src ? (
            <iframe
              key={src}
              title={databaseName ? `phpMyAdmin — ${databaseName}` : "phpMyAdmin"}
              src={src}
              className="h-full w-full border-0 bg-background"
              sandbox="allow-scripts allow-forms allow-downloads allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin"
              onLoad={() => setLoaded(true)}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
