"use client";

import * as React from "react";
import { Copy, KeyRound } from "lucide-react";
import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { buildDbConnectionString } from "./connection-string";

export interface RevealedDatabaseCredentials {
  name: string;
  username: string;
  password: string;
  type?: string;
  localHost: string;
  remoteHost: string;
  port: number;
}

interface DatabaseCredentialsRevealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credentials: RevealedDatabaseCredentials | null;
  title?: string;
}

export function DatabaseCredentialsRevealDialog({
  open,
  onOpenChange,
  credentials,
  title = "Save these credentials",
}: DatabaseCredentialsRevealDialogProps) {
  const copy = React.useCallback(async (text: string, label: string) => {
    const ok = await copyTextToClipboard(text);
    if (ok) toast.success(`${label} copied`);
    else toast.error(`Could not copy ${label.toLowerCase()}`);
  }, []);

  if (!credentials) return null;

  const localString = buildDbConnectionString({
    type: credentials.type,
    username: credentials.username,
    password: credentials.password,
    host: credentials.localHost,
    port: credentials.port,
    database: credentials.name,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            The password is shown once and cannot be retrieved later. Copy it now, or reset it from the connection dialog if you lose it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {(
            [
              ["Database", credentials.name],
              ["Username", credentials.username],
              ["Password", credentials.password],
              ["Host (this server)", credentials.localHost],
              ["Port", String(credentials.port)],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono break-all flex-1">{value}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copy(value, label)}
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy {label}</span>
                </Button>
              </div>
            </div>
          ))}

          <div className="space-y-1 pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground">Connection string</p>
            <div className="flex items-center gap-2">
              <p className="text-xs font-mono bg-muted p-2 rounded flex-1 break-all">{localString}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => copy(localString, "Connection string")}
              >
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copy connection string</span>
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            I have saved these details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
