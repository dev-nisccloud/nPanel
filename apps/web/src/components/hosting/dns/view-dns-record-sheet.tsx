"use client";

import * as React from "react";
import { z } from "zod";
import { Globe, XIcon } from "lucide-react";

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
import { dnsRecordSchema } from "./dns-schema";

interface ViewDnsRecordSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: z.infer<typeof dnsRecordSchema> | null;
}

const getTypeBadgeVariant = (type: string | undefined) => {
  switch (type?.toUpperCase()) {
    case "A":
      return "default";
    case "AAAA":
      return "secondary";
    case "CNAME":
      return "outline";
    case "MX":
      return "destructive";
    case "TXT":
      return "secondary";
    case "NS":
      return "outline";
    default:
      return "outline";
  }
};

const getRecordTypeDescription = (type: string | undefined) => {
  switch (type?.toUpperCase()) {
    case "A":
      return "Points a domain to an IPv4 address";
    case "AAAA":
      return "Points a domain to an IPv6 address";
    case "CNAME":
      return "Creates an alias from one domain name to another";
    case "MX":
      return "Specifies mail servers for the domain";
    case "TXT":
      return "Stores text information for the domain";
    case "NS":
      return "Specifies name servers for the domain";
    case "SRV":
      return "Specifies services available in the domain";
    case "PTR":
      return "Maps an IP address to a domain name";
    default:
      return "";
  }
};

export function ViewDnsRecordSheet({ open, onOpenChange, data }: ViewDnsRecordSheetProps) {
  if (!data) return null;

  const ttl = data.ttl || 3600;
  const priority = (data.type?.toUpperCase() === "MX" || data.type?.toUpperCase() === "SRV")
    ? (typeof data.opt === 'number' ? data.opt : (typeof data.opt === 'string' && !isNaN(parseInt(data.opt)) ? parseInt(data.opt) : undefined))
    : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader className="mb-6 flex-shrink-0 flex justify-between items-center flex-row">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle>DNS Record Details</SheetTitle>
              <SheetDescription>
                View complete DNS record information
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
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
                <CardDescription>DNS record configuration details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Host</p>
                  <p className="text-base font-bold text-primary">
                    {data.host === "@" ? "@" : data.host || "Unknown Host"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Record Type</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={getTypeBadgeVariant(data.type)}>
                      {data.type || "Unknown"}
                    </Badge>
                    {data.type && getRecordTypeDescription(data.type) && (
                      <p className="text-sm text-muted-foreground">
                        {getRecordTypeDescription(data.type)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Value</p>
                  <p className="text-base font-bold text-primary break-all">
                    {data.value || "No value"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">TTL (Time To Live)</p>
                  <p className="text-base">{ttl}s</p>
                </div>

                {priority !== undefined && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Priority</p>
                    <p className="text-base">{priority}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Information */}
            {(data.status || (data.opt && typeof data.opt === 'string' && !priority)) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Information</CardTitle>
                  <CardDescription>Record metadata and status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.status && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge variant={data.status === "ok" ? "default" : "destructive"}>
                        {data.status}
                      </Badge>
                    </div>
                  )}

                  {data.opt && typeof data.opt === 'string' && !priority && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Options</p>
                      <p className="text-base font-bold text-primary">{data.opt}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
