"use client";

import * as React from "react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { getPleskPreviewData, getOpenProviderPreviewData, type PleskPreviewData, type OpenProviderPreviewData } from "./integration-preview-utils";
import { AlertCircle, CheckCircle2, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface AddIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess?: () => void;
}

type Step = "platform" | "preview" | "connecting";

export function AddIntegrationDialog({
  open,
  onOpenChange,
  userId,
  onSuccess,
}: AddIntegrationDialogProps) {
  const [step, setStep] = React.useState<Step>("platform");
  const [selectedPlatform, setSelectedPlatform] = React.useState<"PLESK" | "OPENPROVIDER" | null>(null);

  // Fetch user and profile data
  const { data: userInfo, isLoading: isLoadingUser } = trpc.userProfile.getUserById.useQuery(
    { userId, fields: ["id", "name", "email"] },
    { enabled: open && !!userId }
  );

  const { data: profileInfo, isLoading: isLoadingProfile } = trpc.clients.getProfile.useQuery(
    { userId },
    { enabled: open && !!userId }
  );

  // Fetch existing integrations to check which platforms are already integrated
  const { data: existingIntegrations, isLoading: isLoadingIntegrations } = trpc.clients.getIntegrations.useQuery(
    { userId },
    { enabled: open && !!userId }
  );

  const utils = trpc.useUtils();

  const createIntegrationMutation = trpc.clients.createIntegration.useMutation({
    onSuccess: async () => {
      toast.success("Integration created successfully");
      // Invalidate only the necessary queries
      await Promise.all([
        utils.clients.getIntegrations.invalidate({ userId }),
        utils.clients.getAll.invalidate(),
      ]);
      setStep("platform");
      setSelectedPlatform(null);
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create integration");
      setStep("preview");
    },
  });

  const isLoading = isLoadingUser || isLoadingProfile || isLoadingIntegrations;

  // Check which platforms are already integrated
  const isPleskIntegrated = React.useMemo(() => {
    return existingIntegrations?.some(integration => integration.platform === "PLESK") ?? false;
  }, [existingIntegrations]);

  const isOpenProviderIntegrated = React.useMemo(() => {
    return existingIntegrations?.some(integration => integration.platform === "OPENPROVIDER") ?? false;
  }, [existingIntegrations]);

  // Get preview data
  const pleskPreview = React.useMemo(() => {
    if (!userInfo) return null;
    return getPleskPreviewData(userInfo, profileInfo || null);
  }, [userInfo, profileInfo]);

  const openProviderPreview = React.useMemo(() => {
    if (!userInfo) return null;
    return getOpenProviderPreviewData(userInfo, profileInfo || null);
  }, [userInfo, profileInfo]);

  // Check if required data is available
  const canConnectPlesk = pleskPreview !== null && userInfo?.name && userInfo?.email && !isPleskIntegrated;
  const canConnectOpenProvider = openProviderPreview !== null && !isOpenProviderIntegrated;

  const handlePlatformSelect = (platform: "PLESK" | "OPENPROVIDER") => {
    // Prevent selection if platform is already integrated
    if (platform === "PLESK" && isPleskIntegrated) {
      toast.info("Plesk is already integrated for this client");
      return;
    }
    
    if (platform === "OPENPROVIDER" && isOpenProviderIntegrated) {
      toast.info("OpenProvider is already integrated for this client");
      return;
    }
    
    setSelectedPlatform(platform);
    
    // Validate data availability
    if (platform === "PLESK" && !canConnectPlesk) {
      toast.error("User name and email are required for Plesk integration");
      return;
    }
    
    if (platform === "OPENPROVIDER" && !canConnectOpenProvider) {
      toast.error("Complete profile information is required for OpenProvider integration. Please complete the profile first.");
      return;
    }
    
    setStep("preview");
  };

  const handleConnect = () => {
    if (!selectedPlatform) return;
    
    setStep("connecting");
    createIntegrationMutation.mutate({
      userId,
      platform: selectedPlatform,
    });
  };

  const handleBack = () => {
    if (step === "preview") {
      setStep("platform");
    } else if (step === "connecting") {
      setStep("preview");
    }
  };

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setStep("platform");
      setSelectedPlatform(null);
    }
  }, [open]);

  const handleClose = () => {
    if (step === "connecting") {
      toast.warning("Integration creation in progress. Please wait...");
      return;
    }
    onOpenChange(false);
  };

  const renderPlatformStep = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base font-semibold">Select Platform</Label>
        <RadioGroup
          value={selectedPlatform || ""}
          onValueChange={(value) => {
            if (value === "PLESK" || value === "OPENPROVIDER") {
              handlePlatformSelect(value);
            }
          }}
        >
          <div className={`flex items-center space-x-2 p-4 border rounded-lg ${
            isPleskIntegrated 
              ? "bg-muted/30 opacity-60 cursor-not-allowed" 
              : "hover:bg-muted/50 cursor-pointer"
          }`}>
            <RadioGroupItem 
              value="PLESK" 
              id="plesk" 
              disabled={isPleskIntegrated}
            />
            <Label 
              htmlFor="plesk" 
              className={`flex-1 ${isPleskIntegrated ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Plesk</p>
                  <p className="text-sm text-muted-foreground">Hosting platform integration</p>
                </div>
                <div className="flex items-center gap-2">
                  {isPleskIntegrated ? (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Already synced
                    </Badge>
                  ) : !canConnectPlesk && (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </div>
            </Label>
          </div>
          <div className={`flex items-center space-x-2 p-4 border rounded-lg ${
            isOpenProviderIntegrated 
              ? "bg-muted/30 opacity-60 cursor-not-allowed" 
              : "hover:bg-muted/50 cursor-pointer"
          }`}>
            <RadioGroupItem 
              value="OPENPROVIDER" 
              id="openprovider" 
              disabled={isOpenProviderIntegrated}
            />
            <Label 
              htmlFor="openprovider" 
              className={`flex-1 ${isOpenProviderIntegrated ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">OpenProvider</p>
                  <p className="text-sm text-muted-foreground">Domain registration platform integration</p>
                </div>
                <div className="flex items-center gap-2">
                  {isOpenProviderIntegrated ? (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Already synced
                    </Badge>
                  ) : !canConnectOpenProvider && (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {((!canConnectPlesk && !isPleskIntegrated) || (!canConnectOpenProvider && !isOpenProviderIntegrated)) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {(!canConnectPlesk && !isPleskIntegrated) && (!canConnectOpenProvider && !isOpenProviderIntegrated) && (
              <>Complete user and profile information is required before connecting integrations.</>
            )}
            {(canConnectPlesk || isPleskIntegrated) && (!canConnectOpenProvider && !isOpenProviderIntegrated) && (
              <>Complete profile information (first name, last name, address, city, country, postal code, phone) is required for OpenProvider integration.</>
            )}
            {(!canConnectPlesk && !isPleskIntegrated) && (canConnectOpenProvider || isOpenProviderIntegrated) && (
              <>User name and email are required for Plesk integration.</>
            )}
          </AlertDescription>
        </Alert>
      )}
      {(isPleskIntegrated || isOpenProviderIntegrated) && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {isPleskIntegrated && isOpenProviderIntegrated && (
              <>Both platforms are already integrated. You cannot add duplicate integrations.</>
            )}
            {isPleskIntegrated && !isOpenProviderIntegrated && (
              <>Plesk is already integrated. Only OpenProvider can be added.</>
            )}
            {!isPleskIntegrated && isOpenProviderIntegrated && (
              <>OpenProvider is already integrated. Only Plesk can be added.</>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderPreviewStep = () => {
    const previewData = selectedPlatform === "PLESK" ? pleskPreview : openProviderPreview;

    if (!previewData) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to generate preview data. Please ensure all required information is available.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <Label className="text-base font-semibold mb-4 block">
            Preview Data (Read-only)
          </Label>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {selectedPlatform === "PLESK" ? "Plesk" : "OpenProvider"} Customer Data
              </CardTitle>
              <CardDescription>
                This data will be sent to {selectedPlatform === "PLESK" ? "Plesk" : "OpenProvider"} when you click Connect
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(previewData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderConnectingStep = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Spinner size={32} />
      <p className="text-sm font-medium">Connecting to {selectedPlatform === "PLESK" ? "Plesk" : "OpenProvider"}...</p>
      <p className="text-xs text-muted-foreground">Please wait while we create the integration</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-8">
        <DialogHeader className="pb-6 space-y-2">
          <DialogTitle className="text-xl">Add Integration</DialogTitle>
          <DialogDescription className="pt-1 text-sm">
            {step === "platform" && "Select a platform to integrate with"}
            {step === "preview" && "Review the data that will be sent to the platform"}
            {step === "connecting" && "Creating integration..."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size={24} />
          </div>
        ) : (
          <div className="pt-4">
            {step === "platform" && renderPlatformStep()}
            {step === "preview" && renderPreviewStep()}
            {step === "connecting" && renderConnectingStep()}
          </div>
        )}

        <DialogFooter className="gap-3 pt-6">
          {step === "platform" && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
          )}
          {step === "preview" && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={createIntegrationMutation.isPending}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleConnect}
                disabled={createIntegrationMutation.isPending || !selectedPlatform}
              >
                {createIntegrationMutation.isPending ? (
                  <>
                    <Spinner size={16} className="mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Connect
                  </>
                )}
              </Button>
            </>
          )}
          {step === "connecting" && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled
            >
              Please wait...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


