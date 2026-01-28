"use client";

import * as React from "react";
import { Database, RefreshCw, Plus, X, Edit, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import type { DomainPortfolio } from "./domain-portfolio-card";

interface DnsRecord {
  name: string;
  type: "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SRV" | "CAA" | "TLSA" | "SSHFP";
  value: string;
  ttl: number;
  prio?: number;
}

const VALID_TTL_VALUES = [900, 3600, 10800, 21600, 43200, 86400];

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

interface DnsTabProps {
  domain: DomainPortfolio;
}

export function DnsTab({ domain }: DnsTabProps) {
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
      retry: false,
    }
  );

  // Check if zone doesn't exist
  const zoneNotFound = zoneData?.zoneNotFound === true;

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
      setEditingRecord(null);
      setEditFormData(null);
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
    if (zoneNotFound || !zoneData?.data) return [];
    const zone = zoneData.data as any;
    const records = zone?.records || [];
    return records.map((record: any) => ({
      name: record.name || "@",
      type: record.type as DnsRecord["type"],
      value: record.value,
      ttl: record.ttl || 3600,
      prio: record.prio,
    }));
  }, [zoneData, zoneNotFound]);

  const handleEditRecord = (record: DnsRecord) => {
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

    const originalRecord = dnsRecords.find(
      (r) => `${r.name}-${r.type}-${r.value}-${r.prio || ""}` === editingRecord
    );

    if (!originalRecord) return;

    if (!VALID_TTL_VALUES.includes(editFormData.ttl || 3600)) {
      toast.error("Invalid TTL value. Must be one of: 900, 3600, 10800, 21600, 43200, 86400");
      return;
    }

    if (editFormData.type === "MX" && !editFormData.prio) {
      toast.error("MX records require a priority value");
      return;
    }

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

    if (!editFormData.name || !editFormData.name.trim()) {
      toast.error("Host/Name is required");
      return;
    }

    if (!editFormData.type) {
      toast.error("Record type is required");
      return;
    }

    if (!editFormData.value || !editFormData.value.trim()) {
      toast.error("Record value is required");
      return;
    }

    if (!VALID_TTL_VALUES.includes(editFormData.ttl || 3600)) {
      toast.error("Invalid TTL value. Must be one of: 900, 3600, 10800, 21600, 43200, 86400");
      return;
    }

    if (editFormData.type === "MX" && (editFormData.prio === undefined || editFormData.prio === null)) {
      toast.error("MX records require a priority value (0-65535)");
      return;
    }

    if (editFormData.type === "SRV" && (editFormData.prio === undefined || editFormData.prio === null)) {
      toast.error("SRV records require a priority value (0-65535)");
      return;
    }

    if (editFormData.prio !== undefined && (editFormData.prio < 0 || editFormData.prio > 65535)) {
      toast.error("Priority must be between 0 and 65535");
      return;
    }

    const name = editFormData.name.trim();
    if (name !== "@" && !/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/.test(name)) {
      toast.error("Invalid hostname format. Use @ for root domain or a valid subdomain");
      return;
    }

    const value = editFormData.value.trim();
    
    if (editFormData.type === "A") {
      const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipv4Regex.test(value)) {
        toast.error("Invalid IPv4 address format");
        return;
      }
      const parts = value.split(".").map(Number);
      if (parts.some(p => p < 0 || p > 255)) {
        toast.error("Invalid IPv4 address. Each octet must be 0-255");
        return;
      }
    } else if (editFormData.type === "AAAA") {
      const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
      if (!ipv6Regex.test(value) && value !== "::") {
        toast.error("Invalid IPv6 address format");
        return;
      }
    } else if (editFormData.type === "CNAME" || editFormData.type === "MX" || editFormData.type === "NS") {
      if (!/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*\.?$/.test(value)) {
        toast.error("Invalid hostname format for " + editFormData.type + " record");
        return;
      }
    }

    addRecordMutation.mutate({
      zoneName: domain.domain,
      records: [{
        name: name,
        type: editFormData.type,
        value: value,
        ttl: editFormData.ttl || 3600,
        prio: editFormData.prio,
      }],
    });
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
        ) : zoneNotFound ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-1">DNS Zone Not Found</p>
            <p className="text-xs text-muted-foreground mb-4">
              This domain does not have a DNS zone configured yet.
            </p>
            <Button size="sm" onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Retry
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-full pr-4">
            <div className="space-y-3">
              {editingRecord && editingRecord.startsWith("new-") ? (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold">Add DNS Record</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingRecord(null);
                            setEditFormData(null);
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="new-name" className="text-xs">Host/Name</Label>
                          <Input
                            id="new-name"
                            value={editFormData?.name || ""}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            placeholder="@ or subdomain"
                            className="h-8 text-sm"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Use @ for root domain or enter subdomain
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="new-type" className="text-xs">Type</Label>
                          <select
                            id="new-type"
                            value={editFormData?.type || "A"}
                            onChange={(e) => {
                              const newType = e.target.value as DnsRecord["type"];
                              setEditFormData({ 
                                ...editFormData, 
                                type: newType,
                                prio: (newType === "MX" || newType === "SRV") ? editFormData?.prio : undefined
                              });
                            }}
                            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <option value="A">A (IPv4 Address)</option>
                            <option value="AAAA">AAAA (IPv6 Address)</option>
                            <option value="CNAME">CNAME (Canonical Name)</option>
                            <option value="MX">MX (Mail Exchange)</option>
                            <option value="TXT">TXT (Text)</option>
                            <option value="NS">NS (Name Server)</option>
                            <option value="SRV">SRV (Service)</option>
                            <option value="CAA">CAA (Certificate Authority)</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="new-value" className="text-xs">Value</Label>
                        <Input
                          id="new-value"
                          value={editFormData?.value || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, value: e.target.value })}
                          placeholder={
                            editFormData?.type === "A" ? "192.0.2.1" :
                            editFormData?.type === "AAAA" ? "2001:db8::1" :
                            editFormData?.type === "CNAME" ? "example.com" :
                            editFormData?.type === "MX" ? "mail.example.com" :
                            editFormData?.type === "TXT" ? "your text here" :
                            editFormData?.type === "NS" ? "ns1.example.com" :
                            "record value"
                          }
                          className="h-8 text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {editFormData?.type === "A" && "Enter IPv4 address (e.g., 192.0.2.1)"}
                          {editFormData?.type === "AAAA" && "Enter IPv6 address (e.g., 2001:db8::1)"}
                          {editFormData?.type === "CNAME" && "Enter canonical name (e.g., example.com)"}
                          {editFormData?.type === "MX" && "Enter mail server hostname (e.g., mail.example.com)"}
                          {editFormData?.type === "TXT" && "Enter text value"}
                          {editFormData?.type === "NS" && "Enter nameserver hostname (e.g., ns1.example.com)"}
                          {editFormData?.type === "SRV" && "Enter service record (e.g., 0 5 5060 sip.example.com)"}
                          {editFormData?.type === "CAA" && "Enter CAA record (e.g., 0 issue \"letsencrypt.org\")"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="new-ttl" className="text-xs">TTL (seconds)</Label>
                          <select
                            id="new-ttl"
                            value={editFormData?.ttl || 3600}
                            onChange={(e) => setEditFormData({ ...editFormData, ttl: parseInt(e.target.value) })}
                            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {VALID_TTL_VALUES.map(ttl => (
                              <option key={ttl} value={ttl}>{ttl} ({ttl === 900 ? '15 min' : ttl === 3600 ? '1 hour' : ttl === 10800 ? '3 hours' : ttl === 21600 ? '6 hours' : ttl === 43200 ? '12 hours' : '24 hours'})</option>
                            ))}
                          </select>
                        </div>
                        {(editFormData?.type === "MX" || editFormData?.type === "SRV") && (
                          <div>
                            <Label htmlFor="new-prio" className="text-xs">Priority {editFormData?.type === "MX" ? "(MX)" : "(SRV)"}</Label>
                            <Input
                              id="new-prio"
                              type="number"
                              value={editFormData?.prio || ""}
                              onChange={(e) => setEditFormData({ ...editFormData, prio: parseInt(e.target.value) || undefined })}
                              placeholder={editFormData?.type === "MX" ? "10" : "0"}
                              className="h-8 text-sm"
                              min={0}
                              max={65535}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Lower number = higher priority
                            </p>
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
                <>
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

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddRecord}
                    className="w-full h-9"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Record
                  </Button>
                </>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
