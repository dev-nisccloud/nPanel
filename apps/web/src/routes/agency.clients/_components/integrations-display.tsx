"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckCircle2, XCircle, Clock, AlertCircle, Plug, MoreVertical, Mail } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";

interface IntegrationsDisplayProps {
  userId: string;
}

export function IntegrationsDisplay({ userId }: IntegrationsDisplayProps) {
  const { data: integrations, isLoading, error } = trpc.clients.getIntegrations.useQuery(
    { userId },
    { enabled: !!userId }
  );
  const utils = trpc.useUtils();

  const getPlatformBadge = (platform: "PLESK" | "OPENPROVIDER" | "KENIC") => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      PLESK: "default",
      OPENPROVIDER: "secondary",
      KENIC: "outline",
    };
    return <Badge variant={variants[platform] ?? "outline"}>{platform === "OPENPROVIDER" ? "OP" : platform === "KENIC" ? "KC" : platform}</Badge>;
  };

  const getStatusIcon = (isActive: boolean, isCreated: boolean) => {
    if (isCreated && isActive) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    } else if (isCreated && !isActive) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    } else {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getVerificationBadge = (status: string | null | undefined, isVerified: boolean) => {
    if (status === "verified" || isVerified) {
      return <Badge variant="default" className="bg-green-500">Verified</Badge>;
    } else if (status === "failed") {
      return <Badge variant="destructive">Failed</Badge>;
    } else if (status === "in progress" || status === "pending") {
      return <Badge variant="secondary">Pending</Badge>;
    } else if (status === "not verified") {
      return <Badge variant="outline">Not Verified</Badge>;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mb-4" />
        <p className="text-destructive mb-2">{error.message || "Failed to load integrations"}</p>
      </div>
    );
  }

  if (!integrations || integrations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Plug className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No integrations</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          No platform integrations have been set up for this client yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {integrations.map((integration) => (
        <IntegrationCard key={integration.id} integration={integration} />
      ))}
    </div>
  );

  function IntegrationCard({ integration }: { integration: NonNullable<typeof integrations>[number] }) {
    const [isActionMenuOpen, setIsActionMenuOpen] = React.useState(false);
    
    const { data: verificationStatus, isLoading: isLoadingVerification, refetch: refetchVerification } = 
      trpc.clients.checkEmailVerification.useQuery(
        { userId: integration.userId, integrationId: integration.id },
        { 
          enabled: integration.platform === "OPENPROVIDER" && !!integration.platformCustomerId,
          refetchOnWindowFocus: false,
        }
      );

    const sendVerificationMutation = trpc.clients.sendEmailVerification.useMutation({
      onSuccess: (data) => {
        toast.success(data.message); // Use message from API response
        setIsActionMenuOpen(false);
        // Refetch verification status after a short delay
        setTimeout(() => {
          refetchVerification();
        }, 1000);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to send email verification");
      },
      onSettled: () => {
        utils.clients.getIntegrations.invalidate({ userId });
      },
    });

    const handleSendVerification = () => {
      sendVerificationMutation.mutate({
        userId: integration.userId,
        integrationId: integration.id,
        language: "en",
      });
    };

    return (
      <Card key={integration.id}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getPlatformBadge(integration.platform)}
              <CardTitle className="text-base">
                {integration.platform === "PLESK" ? "Plesk" : integration.platform === "OPENPROVIDER" ? "OP" : "KC"} Integration
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(integration.isActive, integration.isCreated)}
              {integration.platform === "OPENPROVIDER" && (
                <DropdownMenu open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        handleSendVerification();
                      }}
                      disabled={sendVerificationMutation.isPending}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {sendVerificationMutation.isPending ? "Sending..." : "Send Verification Email"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          {integration.platformCustomerId && (
            <CardDescription>
              Platform ID: {integration.platformCustomerId}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Status</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={integration.isActive ? "default" : "secondary"}>
                  {integration.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant={integration.isCreated ? "default" : "outline"}>
                  {integration.isCreated ? "Created" : "Pending"}
                </Badge>
                {integration.platform === "OPENPROVIDER" && (
                  <>
                    {isLoadingVerification ? (
                      <Spinner size={12} />
                    ) : (
                      verificationStatus && getVerificationBadge(verificationStatus.status, verificationStatus.isVerified)
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Created At</p>
              <p className="font-medium">
                {new Date(integration.createdAt).toLocaleString()}
              </p>
            </div>
            {integration.lastSyncedAt && (
              <div className="space-y-1">
                <p className="text-muted-foreground">Last Synced</p>
                <p className="font-medium">
                  {new Date(integration.lastSyncedAt).toLocaleString()}
                </p>
              </div>
            )}
            {integration.platform === "OPENPROVIDER" && verificationStatus && (
              <div className="space-y-1">
                <p className="text-muted-foreground">Email Verification</p>
                <div className="space-y-1">
                  {verificationStatus.email && (
                    <p className="text-xs text-muted-foreground">{verificationStatus.email}</p>
                  )}
                  {verificationStatus.domains && verificationStatus.domains.length > 0 && (
                    <div className="text-xs">
                      <p className="text-muted-foreground mb-1">Domains: {verificationStatus.domains.length}</p>
                      {verificationStatus.domains.slice(0, 2).map((domain, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <span className="truncate">{domain.domain}</span>
                          {getVerificationBadge(domain.status, domain.status === "verified")}
                        </div>
                      ))}
                      {verificationStatus.domains.length > 2 && (
                        <p className="text-muted-foreground mt-1">
                          +{verificationStatus.domains.length - 2} more
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {integration.platformData && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">Platform Data</p>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(integration.platformData, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
}

