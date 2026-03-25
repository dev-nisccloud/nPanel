"use client";

import * as React from "react";
import { Server, Plus, X, Trash2, Check, RefreshCw, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import type { DomainPortfolio } from "./domain-portfolio-card";

interface NameserversTabProps {
  domain: DomainPortfolio;
}

type NameserverEntry = { name: string; ip?: string; ip6?: string; seqNr?: number };

export function NameserversTab({ domain }: NameserversTabProps) {
  const initial = (domain.nameServersFull ?? domain.nameservers.map((ns) => ({ name: ns }))) as NameserverEntry[];
  const [isEditingNameservers, setIsEditingNameservers] = React.useState(false);
  const [nameservers, setNameservers] = React.useState<NameserverEntry[]>(initial);

  const updateNameserversMutation = trpc.openProvider.domains.update.useMutation({
    onSuccess: () => {
      toast.success("Nameservers updated successfully");
      setIsEditingNameservers(false);
      window.location.reload();
    },
    onError: (error) => {
      toast.error("Failed to update nameservers", { description: error.message });
    },
  });

  const handleAddNameserver = () => setNameservers((prev) => [...prev, { name: "" }]);
  const handleRemoveNameserver = (index: number) => {
    if (nameservers.length <= 2) {
      toast.error("At least 2 nameservers are required");
      return;
    }
    setNameservers((prev) => prev.filter((_, i) => i !== index));
  };
  const handleUpdateNameserver = (index: number, field: "name" | "ip" | "ip6", value: string) => {
    setNameservers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSaveNameservers = () => {
    if (nameservers.length < 2) {
      toast.error("At least 2 nameservers are required");
      return;
    }
    const invalid = nameservers.filter((ns) => !ns.name?.trim());
    if (invalid.length > 0) {
      toast.error("All nameservers must have a hostname");
      return;
    }
    const domainId = parseInt(domain.id, 10);
    if (Number.isNaN(domainId)) {
      toast.error("Invalid domain ID");
      return;
    }
    updateNameserversMutation.mutate({
      domainId,
      name_servers: nameservers.map((ns) => ({
        name: ns.name.trim(),
        ip: ns.ip?.trim() || undefined,
      })),
    });
  };

  const handleCancelNameservers = () => {
    setNameservers(initial);
    setIsEditingNameservers(false);
  };

  const isPending = updateNameserversMutation.isPending;
  const canSave = nameservers.length >= 2 && nameservers.every((ns) => ns.name?.trim());

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Nameservers</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hostnames that tell the internet where to find this domain&apos;s DNS.
          </p>
        </div>
        {!isEditingNameservers && (
          <Button variant="outline" size="sm" onClick={() => setIsEditingNameservers(true)} className="h-8 shrink-0">
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {isEditingNameservers ? (
          <>
            <ScrollArea className="flex-1 pr-3">
              <div className="space-y-3 pb-4">
                {nameservers.map((ns, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="py-2 px-4 flex flex-row items-center justify-between space-y-0">
                      <span className="text-xs font-medium text-muted-foreground">
                        Nameserver {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveNameserver(index)}
                        disabled={nameservers.length <= 2}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        title={nameservers.length <= 2 ? "Minimum 2 required" : "Remove"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-0 px-4 pb-4 space-y-3">
                      <div>
                        <Label htmlFor={`ns-name-${index}`} className="text-xs font-medium">
                          Hostname
                        </Label>
                        <Input
                          id={`ns-name-${index}`}
                          value={ns.name}
                          onChange={(e) => handleUpdateNameserver(index, "name", e.target.value)}
                          placeholder="ns1.example.com"
                          className="h-9 text-sm mt-1 font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`ns-ip-${index}`} className="text-xs font-medium text-muted-foreground">
                            IPv4 (optional)
                          </Label>
                          <Input
                            id={`ns-ip-${index}`}
                            value={ns.ip ?? ""}
                            onChange={(e) => handleUpdateNameserver(index, "ip", e.target.value)}
                            placeholder="192.0.2.1"
                            className="h-9 text-sm mt-1 font-mono"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`ns-ip6-${index}`} className="text-xs font-medium text-muted-foreground">
                            IPv6 (optional)
                          </Label>
                          <Input
                            id={`ns-ip6-${index}`}
                            value={ns.ip6 ?? ""}
                            onChange={(e) => handleUpdateNameserver(index, "ip6", e.target.value)}
                            placeholder="2001:db8::1"
                            className="h-9 text-sm mt-1 font-mono"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
            {nameservers.length < 2 && (
              <p className="text-xs text-destructive mt-2">At least 2 nameservers are required.</p>
            )}
            <div className="flex items-center gap-2 pt-4 mt-auto border-t flex-shrink-0">
              <Button variant="outline" size="sm" onClick={handleAddNameserver} className="h-9">
                <Plus className="h-4 w-4 mr-1.5" />
                Add nameserver
              </Button>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelNameservers}
                disabled={isPending}
                className="h-9"
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveNameservers} disabled={isPending || !canSave} className="h-9">
                {isPending ? (
                  <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-1.5" />
                )}
                Save changes
              </Button>
            </div>
          </>
        ) : (
          <Card className="flex-1 min-h-0 flex flex-col">
            <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
              {nameservers.length > 0 ? (
                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-1">
                    {nameservers.map((ns, index) => {
                      const entry = ns as NameserverEntry;
                      return (
                        <div
                          key={index}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                            "bg-muted/50 hover:bg-muted/70 transition-colors"
                          )}
                        >
                          <span
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted-foreground/20 text-xs font-medium text-muted-foreground"
                            aria-hidden
                          >
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-mono font-medium truncate">{entry.name || "—"}</p>
                            {(entry.ip || entry.ip6) && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {[entry.ip, entry.ip6].filter(Boolean).join(" · ")}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center px-4">
                  <Server className="h-10 w-10 text-muted-foreground/60 mb-3" />
                  <p className="text-sm font-medium">No nameservers</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add nameservers to point this domain to your DNS.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingNameservers(true)}
                    className="mt-3"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Edit nameservers
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
