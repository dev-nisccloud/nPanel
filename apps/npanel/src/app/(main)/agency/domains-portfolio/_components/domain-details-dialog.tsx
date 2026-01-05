"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Globe,
  Calendar,
  User,
  Mail,
  RefreshCw,
  Settings,
  Lock,
  Shield,
  Server,
  Key,
  Building,
  FileText,
  ExternalLink,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DomainPortfolio } from "./domain-portfolio-card";

interface DomainDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: DomainPortfolio | null;
  onManage?: (id: string) => void;
  onRenew?: (id: string) => void;
  onTransfer?: (id: string) => void;
}

export function DomainDetailsDialog({
  open,
  onOpenChange,
  domain,
  onManage,
  onRenew,
  onTransfer,
}: DomainDetailsDialogProps) {
  if (!domain) return null;

  const isExpiringSoon = () => {
    const expiryDate = new Date(domain.expiryDate);
    const daysUntilExpiry = Math.floor(
      (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = () => {
    const expiryDate = new Date(domain.expiryDate);
    return expiryDate.getTime() < new Date().getTime();
  };

  const getStatusBadge = () => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ACTIVE: "default",
      PENDING: "secondary",
      EXPIRED: "destructive",
      SUSPENDED: "outline",
      TRANSFERRING: "secondary",
    };

    const statusColors: Record<string, string> = {
      ACTIVE: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
      PENDING: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
      EXPIRED: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
      SUSPENDED: "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300",
      TRANSFERRING: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
    };

    return (
      <Badge
        variant={variants[domain.status] || "secondary"}
        className={cn("text-xs", statusColors[domain.status] || "")}
      >
        {domain.status}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[calc(100vw-2rem)] h-[85vh] p-0 gap-0 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
          <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <DialogTitle className="text-xl">{domain.domain}</DialogTitle>
                <DialogDescription className="mt-1">
                  Complete domain information and management
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {domain.autoRenewal && (
                <Badge variant="outline" className="text-xs">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Auto-renew
                </Badge>
              )}
            </div>
          </div>
          </DialogHeader>
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-6">
          <Tabs defaultValue="overview" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="dns">DNS Records</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex-1 min-h-0 mt-4">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-6 pb-4">
            {/* Domain Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Domain Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Domain Name</p>
                  <p className="text-sm font-medium">{domain.domain}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">TLD</p>
                  <Badge variant="outline" className="text-xs">
                    {domain.tld}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Domain ID</p>
                  <p className="text-sm font-medium font-mono">{domain.id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Type</p>
                  <p className="text-sm font-medium">{domain.type || "REGISTRATION"}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Dates */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Important Dates
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Registration Date</p>
                  <p className="text-sm font-medium">
                    {domain.registrationDate ? new Date(domain.registrationDate).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Expiration Date</p>
                  <p className={cn(
                    "text-sm font-medium",
                    isExpired() && "text-destructive",
                    isExpiringSoon() && !isExpired() && "text-yellow-600 dark:text-yellow-400"
                  )}>
                    {domain.expiryDate ? new Date(domain.expiryDate).toLocaleDateString() : "N/A"}
                  </p>
                  {isExpiringSoon() && !isExpired() && (
                    <Badge variant="outline" className="text-xs mt-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                      Expiring Soon
                    </Badge>
                  )}
                  {isExpired() && (
                    <Badge variant="destructive" className="text-xs mt-1">
                      Expired
                    </Badge>
                  )}
                </div>
                {domain.renewalDate && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Renewal Date</p>
                    <p className="text-sm font-medium">
                      {new Date(domain.renewalDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {domain.activeDate && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Active Date</p>
                    <p className="text-sm font-medium">
                      {new Date(domain.activeDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {domain.orderDate && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Order Date</p>
                    <p className="text-sm font-medium">
                      {new Date(domain.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {domain.lastChanged && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Last Changed</p>
                    <p className="text-sm font-medium">
                      {new Date(domain.lastChanged).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {domain.registryExpirationDate && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Registry Expiration Date</p>
                    <p className="text-sm font-medium">
                      {new Date(domain.registryExpirationDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Owner Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Owner Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Owner Name</p>
                  <p className="text-sm font-medium">{domain.clientName}</p>
                </div>
                {domain.ownerCompanyName && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Company Name</p>
                    <p className="text-sm font-medium">{domain.ownerCompanyName}</p>
                  </div>
                )}
                {domain.ownerFullName && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Full Name</p>
                    <p className="text-sm font-medium">{domain.ownerFullName}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Owner Handle</p>
                  <p className="text-sm font-medium font-mono">{domain.ownerHandle}</p>
                </div>
                {domain.clientEmail && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="text-sm font-medium">{domain.clientEmail}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Contact Handles */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Contact Handles
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {domain.adminHandle && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Admin Handle</p>
                    <p className="text-sm font-medium font-mono">{domain.adminHandle}</p>
                  </div>
                )}
                {domain.techHandle && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tech Handle</p>
                    <p className="text-sm font-medium font-mono">{domain.techHandle}</p>
                  </div>
                )}
                {domain.billingHandle && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Billing Handle</p>
                    <p className="text-sm font-medium font-mono">{domain.billingHandle}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Nameservers */}
            {domain.nameServersFull && domain.nameServersFull.length > 0 && (
              <>
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Nameservers ({domain.nameServersFull.length})
                  </h3>
                  <div className="space-y-2">
                    {domain.nameServersFull.map((ns, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{ns.name}</p>
                          {ns.ip && (
                            <p className="text-xs text-muted-foreground">IPv4: {ns.ip}</p>
                          )}
                          {ns.ip6 && (
                            <p className="text-xs text-muted-foreground">IPv6: {ns.ip6}</p>
                          )}
                        </div>
                        {ns.seqNr !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            #{ns.seqNr}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Security & Settings */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security & Settings
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Lock className={cn(
                    "h-4 w-4",
                    domain.isLocked ? "text-green-600" : "text-muted-foreground"
                  )} />
                  <div>
                    <p className="text-xs text-muted-foreground">Domain Lock</p>
                    <p className="text-sm font-medium">
                      {domain.isLocked ? "Locked" : "Unlocked"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className={cn(
                    "h-4 w-4",
                    domain.isPrivateWhois ? "text-green-600" : "text-muted-foreground"
                  )} />
                  <div>
                    <p className="text-xs text-muted-foreground">Private WHOIS</p>
                    <p className="text-sm font-medium">
                      {domain.isPrivateWhois ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className={cn(
                    "h-4 w-4",
                    domain.isDnssecEnabled ? "text-green-600" : "text-muted-foreground"
                  )} />
                  <div>
                    <p className="text-xs text-muted-foreground">DNSSEC</p>
                    <p className="text-sm font-medium">
                      {domain.isDnssecEnabled ? "Enabled" : "Disabled"}
                      {domain.dnssec && ` (${domain.dnssec})`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className={cn(
                    "h-4 w-4",
                    domain.autoRenewal ? "text-green-600" : "text-muted-foreground"
                  )} />
                  <div>
                    <p className="text-xs text-muted-foreground">Auto Renewal</p>
                    <p className="text-sm font-medium">
                      {domain.autoRenewal ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            {(domain.nsGroup || domain.canRenew !== undefined || domain.comments) && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {domain.nsGroup && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Nameserver Group</p>
                        <p className="text-sm font-medium">{domain.nsGroup}</p>
                      </div>
                    )}
                    {domain.canRenew !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Can Renew</p>
                        <Badge variant={domain.canRenew ? "default" : "secondary"} className="text-xs">
                          {domain.canRenew ? "Yes" : "No"}
                        </Badge>
                      </div>
                    )}
                    {domain.comments && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground mb-1">Comments</p>
                        <p className="text-sm font-medium">{domain.comments}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Auth Code */}
            {domain.authCode && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Authorization Code
                  </h3>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground mb-1">EPP Code / Auth Code</p>
                    <p className="text-sm font-mono font-medium">{domain.authCode}</p>
                  </div>
                </div>
              </>
            )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="dns" className="flex-1 min-h-0 mt-4">
              <DnsRecordsTab domain={domain} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onManage && (
            <Button onClick={() => {
              onManage(domain.id);
              onOpenChange(false);
            }}>
              <Settings className="mr-2 h-4 w-4" />
              Manage Domain
            </Button>
          )}
          {domain.status === "ACTIVE" && onRenew && (
            <Button variant="default" onClick={() => {
              onRenew(domain.id);
              onOpenChange(false);
            }}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Renew Domain
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Mock DNS Records Data
interface DnsRecord {
  id: string;
  host: string;
  type: "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SRV" | "CAA";
  value: string;
  ttl: number;
  priority?: number;
}

// Mock DNS records data
const getMockDnsRecords = (domain: string): DnsRecord[] => {
  return [
    {
      id: "dns-1",
      host: "@",
      type: "A",
      value: "23.92.70.234",
      ttl: 3600,
    },
    {
      id: "dns-2",
      host: "www",
      type: "CNAME",
      value: domain,
      ttl: 3600,
    },
    {
      id: "dns-3",
      host: "mail",
      type: "A",
      value: "23.92.70.235",
      ttl: 3600,
    },
    {
      id: "dns-4",
      host: "@",
      type: "MX",
      value: `mail.${domain}`,
      ttl: 3600,
      priority: 10,
    },
    {
      id: "dns-5",
      host: "@",
      type: "TXT",
      value: "v=spf1 include:_spf.google.com ~all",
      ttl: 3600,
    },
    {
      id: "dns-6",
      host: "@",
      type: "TXT",
      value: "google-site-verification=abc123xyz",
      ttl: 3600,
    },
    {
      id: "dns-7",
      host: "ns1",
      type: "A",
      value: "23.92.70.236",
      ttl: 3600,
    },
    {
      id: "dns-8",
      host: "ns2",
      type: "A",
      value: "23.92.70.237",
      ttl: 3600,
    },
    {
      id: "dns-9",
      host: "ftp",
      type: "A",
      value: "23.92.70.238",
      ttl: 3600,
    },
    {
      id: "dns-10",
      host: "blog",
      type: "CNAME",
      value: domain,
      ttl: 3600,
    },
    {
      id: "dns-11",
      host: "@",
      type: "AAAA",
      value: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
      ttl: 3600,
    },
    {
      id: "dns-12",
      host: "@",
      type: "NS",
      value: `ns1.${domain}`,
      ttl: 3600,
    },
    {
      id: "dns-13",
      host: "@",
      type: "NS",
      value: `ns2.${domain}`,
      ttl: 3600,
    },
  ];
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "A":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "AAAA":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    case "CNAME":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "MX":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case "TXT":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "NS":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "SRV":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
    case "CAA":
      return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }
};

function DnsRecordsTab({ domain }: { domain: DomainPortfolio }) {
  const dnsRecords = React.useMemo(() => getMockDnsRecords(domain.domain), [domain.domain]);

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">DNS Records</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {dnsRecords.length} records
        </Badge>
      </div>

      <div className="flex-1 min-h-0 border rounded-md overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="min-w-max">
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Host</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead className="w-[80px]">TTL</TableHead>
              <TableHead>Value</TableHead>
              {dnsRecords.some((r) => r.priority !== undefined) && (
                <TableHead className="w-[80px]">Priority</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dnsRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No DNS records found
                </TableCell>
              </TableRow>
            ) : (
              dnsRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-mono text-sm">
                    {record.host === "@" ? "@" : record.host}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs", getTypeColor(record.type))}>
                      {record.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{record.ttl}s</TableCell>
                  <TableCell className="font-mono text-sm whitespace-nowrap" title={record.value}>
                    {record.value}
                  </TableCell>
                  {dnsRecords.some((r) => r.priority !== undefined) && (
                    <TableCell className="text-sm">
                      {record.priority !== undefined ? record.priority : "-"}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </div>

      <div className="flex-shrink-0 text-xs text-muted-foreground bg-muted p-3 rounded-md">
        <p className="font-medium mb-1">Note:</p>
        <p>This is mock data. DNS records will be fetched from OpenProvider API in the future.</p>
      </div>
    </div>
  );
}

