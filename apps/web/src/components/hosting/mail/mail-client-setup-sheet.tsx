"use client";

import * as React from "react";
import { BookOpen, Copy, Inbox, Mail, SlidersHorizontal, XIcon } from "lucide-react";

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
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { DetailCardTabsTrigger, DETAIL_TABS_LIST_CLASS } from "@/components/ui/detail-card-tabs";
import { toast } from "@/components/ui/sonner";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";

import { buildMailClientSettings, type MailClientSettings } from "./mail-client-settings";

interface MailClientSetupSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  localPart?: string;
  domainName?: string;
}

function CopyIconButton({ value, label }: { value: string; label: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0"
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
      onClick={() => {
        void (async () => {
          const ok = await copyTextToClipboard(value);
          if (ok) toast.success(`${label} copied`);
          else toast.error("Could not copy. Select the value and copy it manually.");
        })();
      }}
    >
      <Copy className="h-3.5 w-3.5" />
    </Button>
  );
}

function ValueRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1">
        <p className="min-w-0 break-all text-sm font-medium">{value}</p>
        <CopyIconButton value={value} label={label} />
      </div>
    </div>
  );
}

function PortCard({ label, port }: { label: string; port: number }) {
  const value = String(port);
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-3">
      <p className="text-sm font-semibold">{label}</p>
      <div className="mt-1 flex items-center gap-1">
        <p className="text-sm text-muted-foreground">{value}</p>
        <CopyIconButton value={value} label={`${label} port`} />
      </div>
    </div>
  );
}

function ConnectionValues({ settings }: { settings: MailClientSettings }) {
  return (
    <div className="space-y-4">
      <ValueRow label="Mail server username" value={settings.username} />
      <ValueRow
        label="Outgoing mail server (requires authentication)"
        value={settings.outgoingServer}
      />
      <ValueRow label="Incoming mail server" value={settings.incomingServer} />
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Supported outgoing mail protocols</p>
        <p className="text-sm font-medium">{settings.outgoingProtocols.join(", ")}</p>
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Supported incoming mail protocols</p>
        <p className="text-sm font-medium">{settings.incomingProtocols.join(", ")}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <PortCard label="POP3" port={settings.ports.pop3} />
        <PortCard label="IMAP" port={settings.ports.imap} />
        <PortCard label="SMTP" port={settings.ports.smtp} />
      </div>
      <p className="text-xs text-muted-foreground">
        Use {settings.security} on these ports. Outgoing mail requires authentication with the mailbox username and password.
      </p>
    </div>
  );
}

function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, index) => (
        <li key={step} className="flex min-w-0 gap-3 text-sm">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {index + 1}
          </span>
          <p className="min-w-0 flex-1 break-words pt-0.5 leading-relaxed">{step}</p>
        </li>
      ))}
    </ol>
  );
}

function thunderbirdSteps(settings: MailClientSettings): string[] {
  return [
    "In Thunderbird, open the menu and choose New, then Existing Email Account.",
    `Enter your name, ${settings.username}, and the mailbox password, then choose Configure manually.`,
    `For incoming mail, choose IMAP. Server ${settings.incomingServer}, port ${settings.ports.imap}, connection security ${settings.security}, authentication Normal password, username ${settings.username}.`,
    `To use POP3 instead, choose POP3 with the same server and username, port ${settings.ports.pop3}, and ${settings.security}.`,
    `For outgoing mail, server ${settings.outgoingServer}, port ${settings.ports.smtp}, connection security ${settings.security}, authentication Normal password, username ${settings.username}. Outgoing mail requires authentication.`,
    "Choose Done. Thunderbird tests the connection and adds the account.",
  ];
}

function outlookSteps(settings: MailClientSettings): string[] {
  return [
    "In classic Outlook, open File, then Add Account. In the new Outlook, open Settings, then Accounts, then Add account.",
    `Enter ${settings.username}. If Outlook asks you to pick a provider, choose IMAP. Choose POP only when you want mail downloaded to this device.`,
    `Incoming server ${settings.incomingServer}. IMAP uses port ${settings.ports.imap} with ${settings.security}. POP3 uses port ${settings.ports.pop3} with ${settings.security}. Username is ${settings.username}.`,
    `Outgoing SMTP server ${settings.outgoingServer}, port ${settings.ports.smtp}, ${settings.security}. Turn on outgoing authentication and use ${settings.username} with the mailbox password.`,
    "Save and finish. Outlook syncs the mailbox after the connection succeeds.",
  ];
}

export function MailClientSetupSheet({
  open,
  onOpenChange,
  localPart,
  domainName,
}: MailClientSetupSheetProps) {
  const settings = React.useMemo(
    () => buildMailClientSettings({ localPart, domainName }),
    [localPart, domainName],
  );
  const [tab, setTab] = React.useState("thunderbird");

  React.useEffect(() => {
    if (open) setTab("thunderbird");
  }, [open, settings?.username]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="wide" className="flex flex-col">
        <SheetHeader className="mb-6 flex min-w-0 flex-shrink-0 flex-row items-center justify-between gap-3">
          <div className="mb-2 flex min-w-0 items-center gap-3">
            <div className="shrink-0 rounded-full bg-primary/10 p-2">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <SheetTitle>Mail client setup guide</SheetTitle>
              <SheetDescription className="break-words">
                {settings
                  ? `Connect ${settings.username} in a desktop or mobile mail app`
                  : "Connect this mailbox in a desktop or mobile mail app"}
              </SheetDescription>
            </div>
          </div>
          <SheetClose asChild>
            <Button
              size="icon"
              variant="ghost"
              className="m-0 size-auto p-0 hover:bg-transparent"
            >
              <XIcon className="size-5" />
            </Button>
          </SheetClose>
        </SheetHeader>

        {settings ? (
          <ScrollArea className="min-h-0 min-w-0 flex-1 pr-4">
            <div className="min-w-0 space-y-6 px-1 pb-6">
              <Tabs value={tab} onValueChange={setTab} className="min-w-0 gap-4">
                <div className="w-full min-w-0 overflow-x-auto">
                  <TabsList className={DETAIL_TABS_LIST_CLASS}>
                    <DetailCardTabsTrigger
                      value="thunderbird"
                      icon={Mail}
                      title="Thunderbird"
                      subtitle="IMAP or POP"
                    />
                    <DetailCardTabsTrigger
                      value="outlook"
                      icon={Inbox}
                      title="Outlook"
                      subtitle="IMAP or POP"
                    />
                    <DetailCardTabsTrigger
                      value="manual"
                      icon={SlidersHorizontal}
                      title="Manual setup"
                      subtitle="Server values"
                    />
                  </TabsList>
                </div>

                <TabsContent value="thunderbird" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Thunderbird</CardTitle>
                      <CardDescription>
                        Add the mailbox with IMAP, or POP3 if this device should download mail
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Steps steps={thunderbirdSteps(settings)} />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Server values</CardTitle>
                      <CardDescription>Copy these into Thunderbird’s manual config</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ConnectionValues settings={settings} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="outlook" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Outlook</CardTitle>
                      <CardDescription>
                        Works in classic Outlook and the new Outlook
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Steps steps={outlookSteps(settings)} />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Server values</CardTitle>
                      <CardDescription>Copy these into Outlook’s IMAP or POP settings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ConnectionValues settings={settings} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="manual">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Manual setup</CardTitle>
                      <CardDescription>
                        Server values for any mail app that accepts IMAP, POP3, and SMTP
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ConnectionValues settings={settings} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground">
            This mailbox does not have a domain yet, so client settings cannot be built.
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}
