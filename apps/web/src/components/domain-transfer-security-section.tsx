"use client";

import * as React from "react";
import { Copy, Check, Eye, EyeOff, Key, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";

export type DomainTransferSecuritySectionProps = {
  source: "openprovider" | "kenic";
  domainName: string;
  openProviderId?: number | null;
  isLocked?: boolean;
  isLockable?: boolean;
  isPrivateWhois?: boolean;
  /** Registry-level lock  registrar cannot change client lock */
  kenicServerTransferLocked?: boolean;
  onKenicAuthCodeUpdated?: () => void;
  onKenicLockUpdated?: () => void;
};

export function DomainTransferSecuritySection({
  source,
  domainName,
  openProviderId,
  isLocked: initialLocked = false,
  isLockable = true,
  isPrivateWhois = false,
  kenicServerTransferLocked = false,
  onKenicAuthCodeUpdated,
  onKenicLockUpdated,
}: DomainTransferSecuritySectionProps) {
  const utils = trpc.useUtils();
  const [isLocked, setIsLocked] = React.useState(initialLocked);
  const [eppVisible, setEppVisible] = React.useState(false);
  const [eppCode, setEppCode] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [isEditingEpp, setIsEditingEpp] = React.useState(false);
  const [editedEpp, setEditedEpp] = React.useState("");

  React.useEffect(() => {
    setIsLocked(initialLocked);
  }, [initialLocked]);

  React.useEffect(() => {
    setEppCode(null);
    setEppVisible(false);
    setIsEditingEpp(false);
  }, [domainName, source]);

  const updateOpLockMutation = trpc.openProvider.domains.update.useMutation({
    onSuccess: async (_data, variables) => {
      toast.success(
        variables.is_locked
          ? "Domain locked for transfer"
          : "Domain unlocked for transfer"
      );
      await utils.openProvider.domains.list.invalidate();
    },
  });

  const updateKenicLockMutation = trpc.kenic.domainList.setTransferLock.useMutation({
    onSuccess: (_data, variables) => {
      toast.success(
        variables.locked
          ? "Domain locked for transfer"
          : "Domain unlocked for transfer"
      );
      onKenicLockUpdated?.();
    },
  });

  const {
    refetch: fetchOpAuthCode,
    isFetching: isFetchingOpAuthCode,
  } = trpc.openProvider.domains.getAuthCode.useQuery(
    { domainId: openProviderId! },
    { enabled: false, retry: false }
  );

  const {
    refetch: fetchKenicAuthCode,
    isFetching: isFetchingKenicAuthCode,
  } = trpc.kenic.domainList.getAuthCode.useQuery(
    { domain: domainName },
    { enabled: false, retry: false }
  );

  const resetAuthCodeMutation = trpc.openProvider.domains.resetAuthCode.useMutation({
    onSuccess: (result) => {
      const code = result.data?.auth_code;
      if (code) {
        setEppCode(code);
        setEppVisible(true);
      }
      toast.success("Authorization code regenerated");
    },
    onError: (error) => {
      toast.error("Failed to regenerate authorization code", { description: error.message });
    },
  });

  const regenerateKenicAuthCodeMutation = trpc.kenic.domainList.regenerateAuthCode.useMutation({
    onSuccess: (result) => {
      const code = result.data?.auth_code;
      if (code) {
        setEppCode(code);
        setEppVisible(true);
      }
      toast.success("Authorization code regenerated");
      onKenicAuthCodeUpdated?.();
    },
    onError: (error) => {
      toast.error("Failed to regenerate authorization code", { description: error.message });
    },
  });

  const updateKenicAuthCodeMutation = trpc.kenic.domainList.updateAuthCode.useMutation({
    onSuccess: (result, variables) => {
      setEppCode(result.data?.auth_code ?? variables.authCode);
      toast.success("Authorization code updated");
      setIsEditingEpp(false);
      onKenicAuthCodeUpdated?.();
    },
    onError: (error) => {
      toast.error("Failed to update authorization code", { description: error.message });
    },
  });

  const lockDisabled = (() => {
    if (source === "openprovider") {
      return !openProviderId || isLockable === false || isPrivateWhois;
    }
    if (source === "kenic") {
      return !domainName || kenicServerTransferLocked;
    }
    return true;
  })();

  const lockDisabledReason = (() => {
    if (source === "openprovider") {
      if (!openProviderId) return "Domain ID is unavailable.";
      if (isLockable === false) return "Transfer lock is not supported for this TLD.";
      if (isPrivateWhois) return "Disable WHOIS privacy before changing the transfer lock.";
      return null;
    }
    if (source === "kenic" && kenicServerTransferLocked) {
      return "This domain has a registry-level transfer lock. Contact support to remove it.";
    }
    return null;
  })();

  const lockSwitchId =
    source === "kenic" ? "domain-transfer-lock-kenic" : "domain-transfer-lock";

  const handleLockToggle = (checked: boolean) => {
    if (lockDisabled) return;
    const previous = isLocked;
    setIsLocked(checked);

    if (source === "kenic") {
      updateKenicLockMutation.mutate(
        { domain: domainName, locked: checked },
        {
          onError: (error) => {
            setIsLocked(previous);
            toast.error("Failed to update transfer lock", { description: error.message });
          },
        }
      );
      return;
    }

    if (!openProviderId) return;
    updateOpLockMutation.mutate(
      { domainId: openProviderId, is_locked: checked },
      {
        onError: (error) => {
          setIsLocked(previous);
          toast.error("Failed to update transfer lock", { description: error.message });
        },
      }
    );
  };

  const isLockPending =
    source === "kenic"
      ? updateKenicLockMutation.isPending
      : updateOpLockMutation.isPending;

  const isFetchingAuthCode =
    source === "kenic" ? isFetchingKenicAuthCode : isFetchingOpAuthCode;

  const handleRevealEpp = async () => {
    if (eppVisible) {
      setEppVisible(false);
      return;
    }

    if (eppCode) {
      setEppVisible(true);
      return;
    }

    if (source === "kenic") {
      if (!domainName) {
        toast.error("Domain name is unavailable");
        return;
      }
      const result = await fetchKenicAuthCode();
      const code = result.data?.data?.auth_code;
      if (code) {
        setEppCode(code);
        setEppVisible(true);
        return;
      }
      if (result.data?.data?.needsRegenerate) {
        toast.message("No stored authorization code", {
          description: "Regenerate to create a new transfer code for this domain.",
        });
        return;
      }
      if (result.error) {
        toast.error("Failed to retrieve authorization code", {
          description: result.error.message,
        });
      }
      return;
    }

    if (!openProviderId) {
      toast.error("Domain ID is unavailable");
      return;
    }

    const result = await fetchOpAuthCode();
    const code = result.data?.data?.auth_code;
    if (code) {
      setEppCode(code);
      setEppVisible(true);
    } else if (result.error) {
      toast.error("Failed to retrieve authorization code", {
        description: result.error.message,
      });
    }
  };

  const handleRegenerateEpp = () => {
    if (source === "kenic") {
      if (!domainName) {
        toast.error("Domain name is unavailable");
        return;
      }
      regenerateKenicAuthCodeMutation.mutate({ domain: domainName });
      return;
    }

    if (!openProviderId) {
      toast.error("Domain ID is unavailable");
      return;
    }
    if (isLocked) {
      toast.error("Unlock the domain before regenerating the authorization code");
      return;
    }
    resetAuthCodeMutation.mutate({ domainId: openProviderId });
  };

  const eppInputRef = React.useRef<HTMLInputElement>(null);

  const handleCopyEpp = async () => {
    if (!eppCode) return;
    const ok = await copyTextToClipboard(eppCode, { sourceElement: eppInputRef.current });
    if (ok) {
      setCopied(true);
      toast.success("Authorization code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Could not copy. Select the code and copy manually.");
    }
  };

  const handleSaveKenicEpp = () => {
    const trimmed = editedEpp.trim();
    if (!trimmed) {
      toast.error("Authorization code cannot be empty");
      return;
    }
    updateKenicAuthCodeMutation.mutate({
      domain: domainName,
      authCode: trimmed,
    });
  };

  const eppBlockedByLock = source === "openprovider" && isLocked;
  const isRegenerating =
    source === "kenic"
      ? regenerateKenicAuthCodeMutation.isPending
      : resetAuthCodeMutation.isPending;

  return (
    <>
      <Separator />

      <div className="space-y-5">
        {/* Transfer lock */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Lock
              className={cn(
                "h-4 w-4 shrink-0",
                isLocked ? "text-green-600" : "text-muted-foreground"
              )}
            />
            <div className="min-w-0">
              <Label htmlFor={lockSwitchId} className="text-sm font-medium leading-none">
                Transfer lock
              </Label>
              {lockDisabledReason ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{lockDisabledReason}</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  Prevents unauthorized outbound transfers
                </p>
              )}
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="shrink-0">
                  <Switch
                    id={lockSwitchId}
                    checked={isLocked}
                    disabled={lockDisabled || isLockPending}
                    onCheckedChange={handleLockToggle}
                  />
                </span>
              </TooltipTrigger>
              {lockDisabledReason && (
                <TooltipContent side="left">
                  <p>{lockDisabledReason}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* EPP / Authorization code */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <Key className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium leading-none">Authorization code</p>
              <p className="text-xs text-muted-foreground mt-1">
                {eppBlockedByLock
                  ? "Unlock the domain to access the authorization code."
                  : "Required when transferring to another registrar."}
              </p>
            </div>
          </div>

          {isEditingEpp && source === "kenic" ? (
            <div className="space-y-2 pt-0.5">
              <Input
                value={editedEpp}
                onChange={(e) => setEditedEpp(e.target.value)}
                placeholder="New authorization code"
                className="font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveKenicEpp}
                  disabled={updateKenicAuthCodeMutation.isPending}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditingEpp(false);
                    setEditedEpp(eppCode ?? "");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 pt-0.5">
              <div className="flex items-center gap-2">
                <input
                  ref={eppInputRef}
                  readOnly
                  aria-hidden="true"
                  tabIndex={-1}
                  value={eppCode ?? ""}
                  className="sr-only"
                />
                <div className="flex-1 min-w-0 rounded-md border bg-muted/40 px-3 py-1.5 font-mono text-sm">
                  {eppVisible && eppCode ? (
                    <span className="break-all">{eppCode}</span>
                  ) : (
                    <span className="text-muted-foreground tracking-widest select-none">••••••••••••</span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  title="Copy authorization code"
                  disabled={!eppVisible || !eppCode}
                  onClick={handleCopyEpp}
                >
                  {copied
                    ? <Check className="h-3.5 w-3.5 text-green-600" />
                    : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRevealEpp}
                  disabled={
                    (source === "openprovider" && (!openProviderId || eppBlockedByLock)) ||
                    (source === "kenic" && !domainName) ||
                    isFetchingAuthCode
                  }
                >
                  {isFetchingAuthCode ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : eppVisible ? (
                    <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {eppVisible ? "Hide" : "Show"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateEpp}
                  disabled={
                    (source === "openprovider" && (!openProviderId || eppBlockedByLock)) ||
                    (source === "kenic" && !domainName) ||
                    isRegenerating
                  }
                >
                  <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isRegenerating && "animate-spin")} />
                  Regenerate
                </Button>

                {source === "kenic" && eppVisible && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditedEpp(eppCode ?? "");
                      setIsEditingEpp(true);
                    }}
                  >
                    Change
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
