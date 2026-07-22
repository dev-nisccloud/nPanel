"use client";

import * as React from "react";
import { Loader2, Copy, CheckCircle2, Shield, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/utils/trpc";
import { format } from "date-fns";

interface ViewApiKeySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKeyId: string;
}

export function ViewApiKeySheet({
  open,
  onOpenChange,
  apiKeyId,
}: ViewApiKeySheetProps) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  // In a real implementation, you'd have a query to get API key details
  // For now, we'll use the list query and filter
  const { data: apiKeysData, isLoading } = trpc.niscPaymentGateway.apiKeys.list.useQuery(
    { merchantId: "" }, // This will need the merchant ID passed down
    { enabled: false } // Disable for now, we'll need to restructure
  );

  const handleCopy = (field: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Mock data for now - in production, you'd fetch the specific API key details
  const apiKey = {
    id: apiKeyId,
    name: "Production API Key",
    keyPrefix: "npg_live_",
    environment: "PRODUCTION",
    permissions: ["PAYMENT_CREATE", "PAYMENT_READ", "REFUND_CREATE"],
    rateLimit: 100,
    ipRestrictions: ["192.168.1.1", "10.0.0.1"],
    isActive: true,
    createdAt: new Date(),
    lastUsedAt: new Date(),
    expiresAt: null,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="lg">
        <SheetHeader>
          <SheetTitle>API Key Details</SheetTitle>
          <SheetDescription>
            View API key configuration and usage
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] pr-4">
          <div className="space-y-6 mt-6">
            {/* Status and Environment */}
            <div className="flex items-center gap-2">
              <Badge variant={apiKey.environment === "PRODUCTION" ? "default" : "secondary"}>
                {apiKey.environment === "PRODUCTION" ? "Production" : "Sandbox"}
              </Badge>
              {apiKey.isActive ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                  Revoked
                </Badge>
              )}
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Basic Information</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Key Name</label>
                <div className="text-sm text-muted-foreground">{apiKey.name}</div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Key Prefix</label>
                <div className="flex gap-2">
                  <code className="flex-1 px-3 py-2 border rounded-md bg-muted text-sm font-mono">
                    {apiKey.keyPrefix}***
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy("Key prefix", apiKey.keyPrefix)}
                  >
                    {copiedField === "Key prefix" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  The full key was only shown once during creation
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <div className="font-medium">{format(apiKey.createdAt, "MMM d, yyyy")}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Used:</span>
                  <div className="font-medium">
                    {apiKey.lastUsedAt ? format(apiKey.lastUsedAt, "MMM d, yyyy HH:mm") : "Never"}
                  </div>
                </div>
              </div>

              {apiKey.expiresAt && (
                <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <AlertDescription className="text-xs text-orange-800 dark:text-orange-200">
                    This key expires on {format(apiKey.expiresAt, "MMM d, yyyy")}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Permissions */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Permissions
              </h3>
              <div className="flex flex-wrap gap-2">
                {apiKey.permissions.map((permission) => (
                  <Badge key={permission} variant="outline" className="text-xs">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Security Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Security Settings</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Rate Limit</label>
                <div className="text-sm text-muted-foreground">
                  {apiKey.rateLimit} requests per minute
                </div>
              </div>

              {apiKey.ipRestrictions && apiKey.ipRestrictions.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">IP Restrictions</label>
                  <div className="space-y-1">
                    {apiKey.ipRestrictions.map((ip, index) => (
                      <code key={index} className="block px-3 py-2 border rounded-md bg-muted text-xs font-mono">
                        {ip}
                      </code>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Only these IP addresses can use this key
                  </p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="mt-6">
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
