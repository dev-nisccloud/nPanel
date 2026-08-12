"use client";

import * as React from "react";
import { z } from "zod";
import { Mail, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MailboxUsageDisplay } from "./mailbox-usage";
import { emailAccountSchema } from "./emails-schema";

interface ViewMailAddressSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: z.infer<typeof emailAccountSchema> | null;
  domainName?: string;
}

export function ViewMailAddressSheet({
  open,
  onOpenChange,
  data,
  domainName,
}: ViewMailAddressSheetProps) {
  if (!data) return null;

  const fullAddress = `${data.name || "Unknown"}@${domainName || "domain"}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader className="mb-6 flex-shrink-0 flex justify-between items-center flex-row">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-bold">Email Account</SheetTitle>
              <SheetDescription className="text-base">
                View mailbox settings and usage
              </SheetDescription>
            </div>
          </div>
          <SheetClose asChild>
            <Button
              size="icon"
              variant="ghost"
              className="p-0 m-0 size-auto hover:bg-transparent"
            >
              <XIcon className="size-5" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div className="px-1 pb-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
                <CardDescription>Account identity and mailbox status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                  <p className="text-base font-bold text-primary break-all">{fullAddress}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Mailbox</p>
                  <Badge
                    variant={data.mailbox?.enabled ? "default" : "secondary"}
                    className={
                      data.mailbox?.enabled
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800"
                        : ""
                    }
                  >
                    {data.mailbox?.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Usage</p>
                  <MailboxUsageDisplay
                    usage={data.mailbox?.usage}
                    quota={data.mailbox?.quota}
                    size="md"
                    barClassName="max-w-xs"
                  />
                </div>

                {data.description ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-base">{data.description}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Features</CardTitle>
                <CardDescription>Forwarding, aliases, and protection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Forwarding</p>
                  <p className="text-base">
                    {data.forwarding?.enabled
                      ? (data.forwarding.addresses || []).join(", ") || "Enabled"
                      : "Disabled"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Aliases</p>
                  <p className="text-base">
                    {(data.aliases || []).length > 0 ? data.aliases!.join(", ") : "None"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Auto Reply</p>
                  <p className="text-base">
                    {data.autoresponder?.enabled
                      ? data.autoresponder.subject || "Enabled"
                      : "Disabled"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Antivirus</p>
                  <p className="text-base capitalize">{data.antivir || "off"}</p>
                </div>

                {data.outgoingMessagesLimit !== undefined ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Outgoing message limit</p>
                    <p className="text-base">{data.outgoingMessagesLimit}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
