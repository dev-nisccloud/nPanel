"use client";

import * as React from "react";
import { Globe, XIcon, Copy, RefreshCw, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

type SesDnsRecord = {
  record?: string;
  type: string;
  name: string;
  value: string;
  status?: string;
  priority?: number;
};

export type SesDomainLive = {
  domainName: string;
  status: string;
  verificationStatus?: string;
  dnsRecords?: SesDnsRecord[];
  connected?: boolean;
  connectedDomainId?: string | null;
  connectedTeamId?: string | null;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "VERIFIED":
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Verified
        </Badge>
      );
    case "PENDING":
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      );
    case "FAILED":
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800">
          <XCircle className="mr-1 h-3 w-3" />
          Failed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function SesViewDomainSheet(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: SesDomainLive | null;
  onVerified?: () => void | Promise<unknown>;
}) {
  const { open, onOpenChange, domain, onVerified } = props;
  const [isVerifying, setIsVerifying] = React.useState(false);

  const verifyMutation = trpc.niscEmailMarketing.sesUsage.verifyDomainLive.useMutation({
    onSuccess: async () => {
      toast.success("Domain verification checked", { description: "Verification status has been updated." });
      setIsVerifying(false);
      await onVerified?.();
    },
    onError: (e) => {
      toast.error("Failed to verify domain", { description: e.message });
      setIsVerifying(false);
    },
  });

  const handleVerify = async () => {
    if (!domain?.domainName) return;
    setIsVerifying(true);
    try {
      await verifyMutation.mutateAsync({ domainName: domain.domainName });
    } catch {
      // handled
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <SheetTitle>Domain Details</SheetTitle>
                <SheetDescription>Live from AWS SES</SheetDescription>
              </div>
            </div>
            <SheetClose asChild>
              <Button size="icon" variant="ghost" className="p-0 m-0 size-auto hover:bg-transparent">
                <XIcon className="size-5" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0 px-6 pr-4">
          {!domain ? (
            <div className="py-8 text-center text-muted-foreground">Domain not found.</div>
          ) : (
            <div className="space-y-6 pb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Domain Information</h3>
                  <Button variant="outline" size="sm" onClick={handleVerify} disabled={isVerifying}>
                    {isVerifying ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Check Verification
                      </>
                    )}
                  </Button>
                </div>

                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Domain Name</span>
                    <span className="text-sm font-medium">{domain.domainName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    {getStatusBadge(domain.status)}
                  </div>
                  {domain.verificationStatus ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Verification Status</span>
                      <Badge variant="outline" className="text-xs">
                        {domain.verificationStatus}
                      </Badge>
                    </div>
                  ) : null}
                </div>
              </div>

              {domain.dnsRecords && Array.isArray(domain.dnsRecords) && domain.dnsRecords.length > 0 ? (
                <div className="space-y-4" key="dns-records">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">DNS Records</h3>
                      <p className="text-sm text-muted-foreground">Add these DNS records to verify your domain</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {domain.dnsRecords.map((record, index) => (
                      <div key={index} className="rounded-lg border bg-card p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{record.record || record.type}</span>
                          {record.status && (
                            <span
                              className={cn(
                                "text-xs px-2 py-1 rounded",
                                record.status === "verified"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : record.status === "not_started"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
                              )}
                            >
                              {record.status}
                            </span>
                          )}
                        </div>

                        <div className="space-y-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Name</span>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="flex-1 px-2 py-1 bg-muted rounded text-xs font-mono min-w-0 break-all">
                                {record.name}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 flex-shrink-0"
                                onClick={() => copyToClipboard(record.name)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div>
                            <span className="text-muted-foreground">Type</span>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="flex-1 px-2 py-1 bg-muted rounded text-xs font-mono min-w-0 break-all">
                                {record.type}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 flex-shrink-0"
                                onClick={() => copyToClipboard(record.type)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {record.priority !== undefined && (
                            <div>
                              <span className="text-muted-foreground">Priority</span>
                              <div className="flex items-center gap-2 mt-1">
                                <code className="flex-1 px-2 py-1 bg-muted rounded text-xs font-mono min-w-0 break-all">
                                  {record.priority}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 flex-shrink-0"
                                  onClick={() => copyToClipboard(String(record.priority))}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}

                          <div>
                            <span className="text-muted-foreground">Value</span>
                            <div className="flex items-start gap-2 mt-1">
                              <code className="flex-1 p-2 bg-muted rounded text-xs font-mono min-w-0 break-all">
                                {record.value}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 flex-shrink-0"
                                onClick={() => copyToClipboard(record.value)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

