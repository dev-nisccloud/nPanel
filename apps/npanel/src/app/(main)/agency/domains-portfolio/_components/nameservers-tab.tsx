"use client";

import * as React from "react";
import { Server, Plus, X, Trash2, Check, RefreshCw, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";
import type { DomainPortfolio } from "./domain-portfolio-card";

interface NameserversTabProps {
  domain: DomainPortfolio;
}

export function NameserversTab({ domain }: NameserversTabProps) {
  const [isEditingNameservers, setIsEditingNameservers] = React.useState(false);
  const [nameservers, setNameservers] = React.useState<Array<{ name: string; ip?: string; ip6?: string; seqNr?: number }>>(
    domain.nameServersFull || domain.nameservers.map(ns => ({ name: ns })) || []
  );

  const updateNameserversMutation = trpc.openProvider.domains.update.useMutation({
    onSuccess: () => {
      toast.success("Nameservers updated successfully");
      setIsEditingNameservers(false);
      // Refetch domain data to get updated nameservers
      window.location.reload();
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
    setNameservers(domain.nameServersFull || domain.nameservers.map(ns => ({ name: ns })) || []);
    setIsEditingNameservers(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Nameservers ({nameservers.length})</h3>
        </div>
        {!isEditingNameservers && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditingNameservers(true)}
            className="h-8"
          >
            <Edit className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        )}
      </div>

      {isEditingNameservers ? (
        <div className="space-y-3">
          <div className="border rounded-md overflow-hidden">
            <ScrollArea className="h-[300px]">
              <div className="p-2 space-y-3">
                {nameservers.map((ns, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 border rounded-md bg-card">
                    <div className="flex-1 space-y-2 min-w-0">
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
                      className="h-8 w-8 p-0 flex-shrink-0 mt-6"
                      title={nameservers.length <= 2 ? "Minimum 2 nameservers required" : "Remove"}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
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
        <div className="border rounded-md overflow-hidden">
          <ScrollArea className="h-[300px]">
            <div className="p-2 space-y-2">
              {nameservers.length > 0 ? (
                nameservers.map((ns, index) => {
                  const nameserver = ns as { name: string; ip?: string; ip6?: string; seqNr?: number };
                  return (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-card">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{nameserver.name}</p>
                        {nameserver.ip && (
                          <p className="text-xs text-muted-foreground">IPv4: {nameserver.ip}</p>
                        )}
                        {nameserver.ip6 && (
                          <p className="text-xs text-muted-foreground">IPv6: {nameserver.ip6}</p>
                        )}
                      </div>
                      {nameserver.seqNr !== undefined && (
                        <Badge variant="outline" className="text-xs flex-shrink-0 ml-2">
                          #{nameserver.seqNr}
                        </Badge>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No nameservers configured</p>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
