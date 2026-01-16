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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Globe,
  Calendar,
  User,
  Mail,
  RefreshCw,
  Lock,
  Shield,
  Server,
  Key,
  Building,
  FileText,
  Database,
  Edit,
  X,
  Plus,
  Trash2,
  Check,
  MoreVertical,
  Link2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
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

  const shouldShowRenew = () => {
    return domain.status === "EXPIRED" || isExpired() || isExpiringSoon();
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
              <DomainActionsMenu domain={domain} />
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
              <OverviewTab domain={domain} />
            </TabsContent>

            <TabsContent value="dns" className="flex-1 min-h-0 mt-4">
              <DnsRecordsTab domain={domain} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t">
          {shouldShowRenew() && onRenew && (
            <Button variant="default" onClick={() => {
              onRenew(domain.id);
              onOpenChange(false);
            }}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Renew Domain
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Overview Tab Component
function OverviewTab({ domain }: { domain: DomainPortfolio }) {
  const [isEditingNameservers, setIsEditingNameservers] = React.useState(false);
  const [nameservers, setNameservers] = React.useState<Array<{ name: string; ip?: string; ip6?: string; seqNr?: number }>>(
    domain.nameServersFull || []
  );

  const updateNameserversMutation = trpc.openProvider.domains.update.useMutation({
    onSuccess: () => {
      toast.success("Nameservers updated successfully");
      setIsEditingNameservers(false);
      // Refetch domain data to get updated nameservers
      window.location.reload(); // Simple refresh for now
    },
    onError: (error) => {
      toast.error("Failed to update nameservers", {
        description: error.message,
      });
    },
  });

  const handleAddNameserver = () => {
    setNameservers([...nameservers, { name: "" }]);
  };

  const handleRemoveNameserver = (index: number) => {
    if (nameservers.length <= 2) {
      toast.error("At least 2 nameservers are required");
      return;
    }
    setNameservers(nameservers.filter((_, i) => i !== index));
  };

  const handleUpdateNameserver = (index: number, field: "name" | "ip" | "ip6", value: string) => {
    const updated = [...nameservers];
    updated[index] = { ...updated[index], [field]: value };
    setNameservers(updated);
  };

  const handleSaveNameservers = () => {
    if (nameservers.length < 2) {
      toast.error("At least 2 nameservers are required");
      return;
    }

    const invalidNameservers = nameservers.filter(ns => !ns.name || ns.name.trim() === "");
    if (invalidNameservers.length > 0) {
      toast.error("All nameservers must have a name");
      return;
    }

    // Convert domain ID to number (OpenProvider expects number)
    const domainId = parseInt(domain.id);
    if (isNaN(domainId)) {
      toast.error("Invalid domain ID");
      return;
    }

    updateNameserversMutation.mutate({
      domainId: domainId,
      name_servers: nameservers.map(ns => ({
        name: ns.name.trim(),
        ip: ns.ip?.trim() || undefined,
      })),
    });
  };

  const handleCancelNameservers = () => {
    setNameservers(domain.nameServersFull || []);
    setIsEditingNameservers(false);
  };

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

  return (
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
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Server className="h-4 w-4" />
              Nameservers ({nameservers.length})
            </h3>
            {!isEditingNameservers && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingNameservers(true)}
                className="h-7 w-7 p-0"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {isEditingNameservers ? (
            <div className="space-y-3">
              <ScrollArea className="max-h-[300px] pr-4">
                <div className="space-y-3">
                  {nameservers.map((ns, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 border rounded-md">
                      <div className="flex-1 space-y-2">
                        <div>
                          <Label htmlFor={`ns-name-${index}`} className="text-xs">Nameserver</Label>
                          <Input
                            id={`ns-name-${index}`}
                            value={ns.name}
                            onChange={(e) => handleUpdateNameserver(index, "name", e.target.value)}
                            placeholder="ns1.example.com"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`ns-ip-${index}`} className="text-xs">IPv4 (Optional)</Label>
                          <Input
                            id={`ns-ip-${index}`}
                            value={ns.ip || ""}
                            onChange={(e) => handleUpdateNameserver(index, "ip", e.target.value)}
                            placeholder="192.0.2.1"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`ns-ip6-${index}`} className="text-xs">IPv6 (Optional)</Label>
                          <Input
                            id={`ns-ip6-${index}`}
                            value={ns.ip6 || ""}
                            onChange={(e) => handleUpdateNameserver(index, "ip6", e.target.value)}
                            placeholder="2001:db8::1"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveNameserver(index)}
                        disabled={nameservers.length <= 2}
                        className="h-8 w-8 p-0 mt-6"
                        title={nameservers.length <= 2 ? "Minimum 2 nameservers required" : "Remove"}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddNameserver}
                  className="h-8"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Nameserver
                </Button>
                <div className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelNameservers}
                  disabled={updateNameserversMutation.isPending}
                  className="h-8"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveNameservers}
                  disabled={updateNameserversMutation.isPending || nameservers.length < 2}
                  className="h-8"
                >
                  {updateNameserversMutation.isPending ? (
                    <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5 mr-1" />
                  )}
                  Update
                </Button>
              </div>
              {nameservers.length < 2 && (
                <p className="text-xs text-destructive">At least 2 nameservers are required</p>
              )}
            </div>
          ) : (
            <ScrollArea className="max-h-[300px] pr-4">
              <div className="space-y-2">
                {nameservers.map((ns, index) => {
                  const nameserver = ns as { name: string; ip?: string; ip6?: string; seqNr?: number };
                  return (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{nameserver.name}</p>
                        {nameserver.ip && (
                          <p className="text-xs text-muted-foreground">IPv4: {nameserver.ip}</p>
                        )}
                        {nameserver.ip6 && (
                          <p className="text-xs text-muted-foreground">IPv6: {nameserver.ip6}</p>
                        )}
                      </div>
                      {nameserver.seqNr !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          #{nameserver.seqNr}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <Separator />

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
  );
}

// DNS Record Type
interface DnsRecord {
  name: string;
  type: "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SRV" | "CAA" | "TLSA" | "SSHFP";
  value: string;
  ttl: number;
  prio?: number;
}

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

// Valid TTL values
const VALID_TTL_VALUES = [900, 3600, 10800, 21600, 43200, 86400];

// DNS Records Tab Component
function DnsRecordsTab({ domain }: { domain: DomainPortfolio }) {
  const [editingRecord, setEditingRecord] = React.useState<string | null>(null);
  const [editFormData, setEditFormData] = React.useState<Partial<DnsRecord> | null>(null);

  // Fetch DNS zone with records
  const { data: zoneData, isLoading, refetch } = trpc.openProvider.dns.getZone.useQuery(
    {
      zoneName: domain.domain,
      withRecords: true,
    },
    {
      enabled: !!domain.domain,
      refetchOnWindowFocus: false,
    }
  );

  const updateZoneMutation = trpc.openProvider.dns.updateZone.useMutation({
    onSuccess: () => {
      toast.success("DNS record updated successfully");
      setEditingRecord(null);
      setEditFormData(null);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to update DNS record", {
        description: error.message,
      });
    },
  });

  const removeRecordMutation = trpc.openProvider.dns.removeRecords.useMutation({
    onSuccess: () => {
      toast.success("DNS record deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to delete DNS record", {
        description: error.message,
      });
    },
  });

  const addRecordMutation = trpc.openProvider.dns.addRecords.useMutation({
    onSuccess: () => {
      toast.success("DNS record added successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to add DNS record", {
        description: error.message,
      });
    },
  });

  // Transform OpenProvider records to our format
  const dnsRecords: DnsRecord[] = React.useMemo(() => {
    if (!zoneData?.data) return [];
    // OpenProvider returns zone data with records array when with_records=true
    // The structure is: response.data = { name, type, records: [...], ... }
    const zone = zoneData.data as any;
    const records = zone?.records || [];
    return records.map((record: any) => ({
      name: record.name || "@",
      type: record.type as DnsRecord["type"],
      value: record.value,
      ttl: record.ttl || 3600,
      prio: record.prio,
    }));
  }, [zoneData]);

  const handleEditRecord = (record: DnsRecord) => {
    // Create unique key from record properties
    const recordKey = `${record.name}-${record.type}-${record.value}-${record.prio || ""}`;
    setEditingRecord(recordKey);
    setEditFormData({ ...record });
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setEditFormData(null);
  };

  const handleUpdateRecord = () => {
    if (!editFormData || !editingRecord) return;

    // Find original record
    const originalRecord = dnsRecords.find(
      (r) => `${r.name}-${r.type}-${r.value}-${r.prio || ""}` === editingRecord
    );

    if (!originalRecord) return;

    // Validate TTL
    if (!VALID_TTL_VALUES.includes(editFormData.ttl || 3600)) {
      toast.error("Invalid TTL value. Must be one of: 900, 3600, 10800, 21600, 43200, 86400");
      return;
    }

    // Validate MX requires priority
    if (editFormData.type === "MX" && !editFormData.prio) {
      toast.error("MX records require a priority value");
      return;
    }

    // Validate required fields
    if (!editFormData.name || !editFormData.type || !editFormData.value) {
      toast.error("Name, type, and value are required");
      return;
    }

    updateZoneMutation.mutate({
      zoneName: domain.domain,
      records: {
        remove: [{
          name: originalRecord.name,
          type: originalRecord.type,
          value: originalRecord.value,
          ttl: originalRecord.ttl,
          prio: originalRecord.prio,
        }],
        add: [{
          name: editFormData.name,
          type: editFormData.type,
          value: editFormData.value,
          ttl: editFormData.ttl || 3600,
          prio: editFormData.prio,
        }],
      },
    });
  };

  const handleDeleteRecord = (record: DnsRecord) => {
    removeRecordMutation.mutate({
      zoneName: domain.domain,
      records: [{
        name: record.name,
        type: record.type,
        value: record.value,
        ttl: record.ttl,
        prio: record.prio,
      }],
    });
  };

  const handleAddRecord = () => {
    // Create a new empty record for editing
    const newRecordKey = `new-${Date.now()}`;
    setEditingRecord(newRecordKey);
    setEditFormData({
      name: "@",
      type: "A",
      value: "",
      ttl: 3600,
    });
  };

  const handleSaveNewRecord = () => {
    if (!editFormData) return;

    // Validate TTL
    if (!VALID_TTL_VALUES.includes(editFormData.ttl || 3600)) {
      toast.error("Invalid TTL value. Must be one of: 900, 3600, 10800, 21600, 43200, 86400");
      return;
    }

    // Validate MX requires priority
    if (editFormData.type === "MX" && !editFormData.prio) {
      toast.error("MX records require a priority value");
      return;
    }

    // Validate required fields
    if (!editFormData.name || !editFormData.type || !editFormData.value) {
      toast.error("Name, type, and value are required");
      return;
    }

    addRecordMutation.mutate({
      zoneName: domain.domain,
      records: [{
        name: editFormData.name,
        type: editFormData.type,
        value: editFormData.value,
        ttl: editFormData.ttl || 3600,
        prio: editFormData.prio,
      }],
    });

    setEditingRecord(null);
    setEditFormData(null);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">DNS Records</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-8"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Badge variant="outline" className="text-xs">
            {dnsRecords.length} records
          </Badge>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : dnsRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-1">No DNS Records</p>
            <p className="text-xs text-muted-foreground mb-4">
              No DNS records found for this domain.
            </p>
            <Button size="sm" onClick={handleAddRecord} variant="outline">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Record
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-full pr-4">
            <div className="space-y-3">
              {dnsRecords.map((record) => {
                const recordKey = `${record.name}-${record.type}-${record.value}-${record.prio || ""}`;
                const isEditing = editingRecord === recordKey;

                return (
                  <Card key={recordKey}>
                    <CardContent className="p-4">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`edit-name-${recordKey}`} className="text-xs">Host/Name</Label>
                              <Input
                                id={`edit-name-${recordKey}`}
                                value={editFormData?.name || ""}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                placeholder="@ or subdomain"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edit-type-${recordKey}`} className="text-xs">Type</Label>
                              <select
                                id={`edit-type-${recordKey}`}
                                value={editFormData?.type || "A"}
                                onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as DnsRecord["type"] })}
                                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                <option value="A">A</option>
                                <option value="AAAA">AAAA</option>
                                <option value="CNAME">CNAME</option>
                                <option value="MX">MX</option>
                                <option value="TXT">TXT</option>
                                <option value="NS">NS</option>
                                <option value="SRV">SRV</option>
                                <option value="CAA">CAA</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor={`edit-value-${recordKey}`} className="text-xs">Value</Label>
                            <Input
                              id={`edit-value-${recordKey}`}
                              value={editFormData?.value || ""}
                              onChange={(e) => setEditFormData({ ...editFormData, value: e.target.value })}
                              placeholder="192.0.2.1 or example.com"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`edit-ttl-${recordKey}`} className="text-xs">TTL (seconds)</Label>
                              <select
                                id={`edit-ttl-${recordKey}`}
                                value={editFormData?.ttl || 3600}
                                onChange={(e) => setEditFormData({ ...editFormData, ttl: parseInt(e.target.value) })}
                                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                {VALID_TTL_VALUES.map(ttl => (
                                  <option key={ttl} value={ttl}>{ttl}</option>
                                ))}
                              </select>
                            </div>
                            {editFormData?.type === "MX" && (
                              <div>
                                <Label htmlFor={`edit-prio-${recordKey}`} className="text-xs">Priority</Label>
                                <Input
                                  id={`edit-prio-${recordKey}`}
                                  type="number"
                                  value={editFormData?.prio || ""}
                                  onChange={(e) => setEditFormData({ ...editFormData, prio: parseInt(e.target.value) || undefined })}
                                  placeholder="10"
                                  className="h-8 text-sm"
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={handleUpdateRecord}
                              disabled={updateZoneMutation.isPending}
                              className="h-8"
                            >
                              {updateZoneMutation.isPending ? (
                                <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5 mr-1" />
                              )}
                              Update
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                              disabled={updateZoneMutation.isPending}
                              className="h-8"
                            >
                              <X className="h-3.5 w-3.5 mr-1" />
                              Cancel
                            </Button>
                            <div className="flex-1" />
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteRecord(record)}
                              disabled={removeRecordMutation.isPending}
                              className="h-8"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className={cn("text-xs", getTypeColor(record.type))}>
                                  {record.type}
                                </Badge>
                                <span className="text-sm font-medium font-mono">
                                  {record.name === "@" ? "@" : record.name}
                                </span>
                              </div>
                              <p className="text-sm font-mono text-muted-foreground break-all">
                                {record.value}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span>TTL: {record.ttl}s</span>
                                {record.prio !== undefined && (
                                  <span>Priority: {record.prio}</span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditRecord(record)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {/* Add new record button */}
              {editingRecord?.startsWith("new-") && editFormData && (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="new-name" className="text-xs">Host/Name</Label>
                          <Input
                            id="new-name"
                            value={editFormData.name || ""}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            placeholder="@ or subdomain"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-type" className="text-xs">Type</Label>
                          <select
                            id="new-type"
                            value={editFormData.type || "A"}
                            onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as DnsRecord["type"], prio: e.target.value === "MX" ? 10 : undefined })}
                            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <option value="A">A</option>
                            <option value="AAAA">AAAA</option>
                            <option value="CNAME">CNAME</option>
                            <option value="MX">MX</option>
                            <option value="TXT">TXT</option>
                            <option value="NS">NS</option>
                            <option value="SRV">SRV</option>
                            <option value="CAA">CAA</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="new-value" className="text-xs">Value</Label>
                        <Input
                          id="new-value"
                          value={editFormData.value || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, value: e.target.value })}
                          placeholder="192.0.2.1 or example.com"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="new-ttl" className="text-xs">TTL (seconds)</Label>
                          <select
                            id="new-ttl"
                            value={editFormData.ttl || 3600}
                            onChange={(e) => setEditFormData({ ...editFormData, ttl: parseInt(e.target.value) })}
                            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {VALID_TTL_VALUES.map(ttl => (
                              <option key={ttl} value={ttl}>{ttl}</option>
                            ))}
                          </select>
                        </div>
                        {editFormData.type === "MX" && (
                          <div>
                            <Label htmlFor="new-prio" className="text-xs">Priority</Label>
                            <Input
                              id="new-prio"
                              type="number"
                              value={editFormData.prio || ""}
                              onChange={(e) => setEditFormData({ ...editFormData, prio: parseInt(e.target.value) || undefined })}
                              placeholder="10"
                              className="h-8 text-sm"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={handleSaveNewRecord}
                          disabled={addRecordMutation.isPending}
                          className="h-8"
                        >
                          {addRecordMutation.isPending ? (
                            <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5 mr-1" />
                          )}
                          Add Record
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingRecord(null);
                            setEditFormData(null);
                          }}
                          disabled={addRecordMutation.isPending}
                          className="h-8"
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!editingRecord?.startsWith("new-") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddRecord}
                  className="w-full h-9"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add DNS Record
                </Button>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

// Domain Actions Menu Component
function DomainActionsMenu({ domain }: { domain: DomainPortfolio }) {
  const [isLinkToTeamOpen, setIsLinkToTeamOpen] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsLinkToTeamOpen(true)}>
            <Link2 className="mr-2 h-4 w-4" />
            Link to Team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <LinkToTeamDialog
        open={isLinkToTeamOpen}
        onOpenChange={setIsLinkToTeamOpen}
        domain={domain}
      />
    </>
  );
}

// Link to Team Dialog Component
interface LinkToTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: DomainPortfolio;
}

function LinkToTeamDialog({ open, onOpenChange, domain }: LinkToTeamDialogProps) {
  const [selectedTeamId, setSelectedTeamId] = React.useState<string>("");
  const [openProviderPrice, setOpenProviderPrice] = React.useState<string>("");
  const [niscPrice, setNiscPrice] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");

  // Fetch teams
  const { data: teams, isLoading: isLoadingTeams } = trpc.teams.getUserTeams.useQuery(undefined, {
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  // Link domain mutation
  const linkDomainMutation = trpc.domains.linkToTeam.useMutation({
    onSuccess: () => {
      toast.success("Domain linked to team successfully");
      onOpenChange(false);
      // Reset form
      setSelectedTeamId("");
      setOpenProviderPrice("");
      setNiscPrice("");
      setNotes("");
      // Refresh page to show updated data
      window.location.reload();
    },
    onError: (error) => {
      toast.error("Failed to link domain to team", {
        description: error.message,
      });
    },
  });

  // Extract OpenProvider ID - domain.id should be the OpenProvider domain ID
  // If it's a string, try to parse it; otherwise use it directly if it's already a number
  const openProviderId = typeof domain.id === "string" ? parseInt(domain.id) : domain.id;
  const isSubmitting = linkDomainMutation.isPending;

  // Get dates from domain
  const registrationDate = domain.registrationDate
    ? new Date(domain.registrationDate)
    : new Date();
  const activationDate = domain.activeDate ? new Date(domain.activeDate) : null;
  const expirationDate = domain.expiryDate ? new Date(domain.expiryDate) : null;
  const renewalDate = domain.renewalDate ? new Date(domain.renewalDate) : null;

  const handleSubmit = () => {
    if (!selectedTeamId) {
      toast.error("Please select a team");
      return;
    }

    if (isNaN(openProviderId)) {
      toast.error("Invalid OpenProvider domain ID");
      return;
    }

    linkDomainMutation.mutate({
      domainName: domain.domain,
      openProviderId,
      teamId: selectedTeamId,
      openProviderPrice: openProviderPrice || undefined,
      niscPrice: niscPrice || undefined,
      activationDate: activationDate || null,
      expirationDate: expirationDate || null,
      renewalDate: renewalDate || null,
      registrationDate,
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link Domain to Team</DialogTitle>
          <DialogDescription>
            Link {domain.domain} to a team. The team owner will be notified.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Team Selection */}
          <div className="space-y-2">
            <Label htmlFor="team-select">Team *</Label>
            {isLoadingTeams ? (
              <div className="flex items-center justify-center h-10 border rounded-md">
                <RefreshCw className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <select
                id="team-select"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a team</option>
                {teams?.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Prices (Optional) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="openprovider-price">OpenProvider Price (KES)</Label>
              <Input
                id="openprovider-price"
                type="number"
                step="0.01"
                value={openProviderPrice}
                onChange={(e) => setOpenProviderPrice(e.target.value)}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nisc-price">NISC Price (KES)</Label>
              <Input
                id="nisc-price"
                type="number"
                step="0.01"
                value={niscPrice}
                onChange={(e) => setNiscPrice(e.target.value)}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              disabled={isSubmitting}
              rows={3}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedTeamId}>
            {isSubmitting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Linking...
              </>
            ) : (
              <>
                <Link2 className="mr-2 h-4 w-4" />
                Link to Team
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
