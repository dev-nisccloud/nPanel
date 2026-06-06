"use client";

import * as React from "react";
import { Key, Plus, Shield, Trash2, RefreshCw, AlertTriangle, Copy, Terminal } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";
import { useHivelocityTeamTrpcInput } from "./team-hivelocity-access-context";
import { resolveClientErrorMessage } from "@/lib/public-error-message";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { buildAuthorizedKeysInstallScript } from "@/lib/vps-ssh-authorized-keys-script";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type SshKey = {
  sshKeyId: number;
  name: string;
  publicKey: string;
};

function fingerprintPublicKey(publicKey: string): string {
  const parts = publicKey.trim().split(/\s+/);
  if (parts.length < 2) return publicKey.slice(0, 20);
  const blob = parts[1] ?? "";
  if (blob.length <= 16) return blob;
  return `${blob.slice(0, 8)}…${blob.slice(-8)}`;
}

function resolvePowerStatus(raw: unknown): string {
  if (raw == null) return "UNKNOWN";
  if (typeof raw === "object" && raw !== null && "status" in raw) {
    return String((raw as { status: unknown }).status).toUpperCase();
  }
  return String(raw).toUpperCase();
}

interface VpsSshKeysSectionProps {
  deviceId: number;
}

export function VpsSshKeysSection({ deviceId }: VpsSshKeysSectionProps) {
  const utils = trpc.useUtils();
  const teamTrpc = useHivelocityTeamTrpcInput();

  const [manageOpen, setManageOpen] = React.useState(false);
  const [draftKeyIds, setDraftKeyIds] = React.useState<number[]>([]);
  const [newKeyName, setNewKeyName] = React.useState("");
  const [newPublicKey, setNewPublicKey] = React.useState("");

  const sshKeysQuery = trpc.hivelocity.listSshKeys.useQuery(undefined, {
    staleTime: 30_000,
  });
  const vpsQuery = trpc.hivelocity.getVpsDetails.useQuery({ deviceId, ...teamTrpc });
  const powerQuery = trpc.hivelocity.getDevicePowerStatus.useQuery({ deviceId, ...teamTrpc });

  const accountKeys = (sshKeysQuery.data?.data as SshKey[] | undefined) ?? [];
  const deployedKeyIds = React.useMemo(() => {
    const raw = (vpsQuery.data?.data as { sshKeyIds?: unknown } | null | undefined)?.sshKeyIds;
    if (!Array.isArray(raw)) return [];
    return raw.map((id) => Number(id)).filter((id) => Number.isFinite(id));
  }, [vpsQuery.data?.data]);

  const deployedKeys = React.useMemo(() => {
    const byId = new Map(accountKeys.map((k) => [k.sshKeyId, k]));
    return deployedKeyIds.map((id) => {
      const match = byId.get(id);
      if (match) return match;
      return { sshKeyId: id, name: `Key #${id}`, publicKey: "" };
    });
  }, [accountKeys, deployedKeyIds]);

  const powerStatus = resolvePowerStatus((powerQuery.data?.data as { powerStatus?: unknown })?.powerStatus);
  const isPoweredOff = powerStatus === "OFF";
  const isPowerTransitioning = Boolean((powerQuery.data?.data as { pendingAction?: unknown })?.pendingAction);

  React.useEffect(() => {
    if (manageOpen) {
      setDraftKeyIds(deployedKeyIds);
    }
  }, [manageOpen, deployedKeyIds]);

  const createKeyMutation = trpc.hivelocity.createSshKey.useMutation({
    onSuccess: (res) => {
      const created = res.data as SshKey | undefined;
      toast.success("SSH key added to your account.");
      setNewKeyName("");
      setNewPublicKey("");
      void utils.hivelocity.listSshKeys.invalidate();
      if (created?.sshKeyId) {
        setDraftKeyIds((prev) => (prev.includes(created.sshKeyId) ? prev : [...prev, created.sshKeyId]));
      }
    },
    onError: (err) => toast.error(resolveClientErrorMessage(err, "Failed to add SSH key")),
  });

  const deleteKeyMutation = trpc.hivelocity.deleteSshKey.useMutation({
    onSuccess: (_, variables) => {
      toast.success("SSH key removed from account.");
      setDraftKeyIds((prev) => prev.filter((id) => id !== variables.sshKeyId));
      void utils.hivelocity.listSshKeys.invalidate();
    },
    onError: (err) => toast.error(resolveClientErrorMessage(err, "Failed to remove SSH key")),
  });

  const applyKeysMutation = trpc.hivelocity.updateVpsSshKeys.useMutation({
    onSuccess: () => {
      toast.success("SSH keys update submitted. Power on the instance when the task completes.");
      setManageOpen(false);
      void utils.hivelocity.getVpsDetails.invalidate({ deviceId, ...teamTrpc });
    },
    onError: (err) => toast.error(resolveClientErrorMessage(err, "Failed to update SSH keys on VPS")),
  });

  const toggleDraftKey = (sshKeyId: number, checked: boolean) => {
    setDraftKeyIds((prev) =>
      checked ? (prev.includes(sshKeyId) ? prev : [...prev, sshKeyId]) : prev.filter((id) => id !== sshKeyId),
    );
  };

  const handleAddKey = () => {
    if (!newKeyName.trim() || !newPublicKey.trim()) {
      toast.error("Enter a key name and public key content.");
      return;
    }
    createKeyMutation.mutate({ name: newKeyName.trim(), publicKey: newPublicKey.trim() });
  };

  const handleApplyKeys = () => {
    if (!draftKeyIds.length) {
      toast.error("Select at least one SSH key to deploy.");
      return;
    }
    if (!isPoweredOff || isPowerTransitioning) {
      toast.error("Power off this VPS from Overview before updating SSH keys.");
      return;
    }
    applyKeysMutation.mutate({ deviceId, sshKeyIds: draftKeyIds, ...teamTrpc });
  };

  const selectedPublicKeys = React.useMemo(
    () =>
      accountKeys
        .filter((key) => draftKeyIds.includes(key.sshKeyId))
        .map((key) => key.publicKey)
        .filter(Boolean),
    [accountKeys, draftKeyIds],
  );

  const installScriptRef = React.useRef<HTMLTextAreaElement>(null);

  const manualInstallScript = React.useMemo(
    () => buildAuthorizedKeysInstallScript(selectedPublicKeys),
    [selectedPublicKeys],
  );

  const copyManualScript = async () => {
    if (!manualInstallScript) {
      toast.error("Select at least one key to generate install commands.");
      return;
    }
    const ok = await copyTextToClipboard(manualInstallScript, {
      sourceElement: installScriptRef.current,
    });
    if (ok) {
      toast.success("Install script copied to clipboard");
    } else {
      installScriptRef.current?.focus();
      installScriptRef.current?.select();
      toast.error("Could not copy automatically. The script is selected — press Ctrl+C to copy.");
    }
  };

  const isLoading = sshKeysQuery.isLoading || vpsQuery.isLoading;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Authorized SSH Keys</p>
          <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed">
            Account keys deployed to this instance. Update while the VPS is powered off.
          </p>
        </div>
        <Dialog open={manageOpen} onOpenChange={setManageOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-[9px] font-bold uppercase shrink-0">
              <Plus className="h-3 w-3 mr-1" />
              Manage keys
            </Button>
          </DialogTrigger>
          <DialogContent className="flex max-h-[min(90vh,40rem)] w-[calc(100%-2rem)] max-w-md flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
            <DialogHeader className="shrink-0 space-y-2 border-b px-5 pt-5 pb-4 pr-12 text-left">
              <DialogTitle className="flex items-center gap-2 text-base">
                <Key className="h-4 w-4 shrink-0 text-primary" />
                SSH key management
              </DialogTitle>
              <DialogDescription className="text-xs leading-relaxed">
                Keys live on your account and can be deployed to this VPS. Applying changes replaces the full key list
                on the server and requires the instance to be powered off.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto px-5 py-4">
              <Alert className="min-w-0 border-amber-300/80 bg-amber-50 dark:border-amber-800/80 dark:bg-amber-950/40">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <AlertTitle className="text-xs font-bold text-amber-900 dark:text-amber-300">Power off required</AlertTitle>
                <AlertDescription className="text-[11px] leading-snug break-words text-amber-900/90 dark:text-amber-200/90">
                  {isPowerTransitioning
                    ? "A power action is in progress. Wait until the instance is fully off before applying keys."
                    : isPoweredOff
                      ? "Instance is off — you can apply SSH key changes."
                      : "Shut down this VPS from Overview, then apply your key selection."}
                </AlertDescription>
              </Alert>

              <div className="min-w-0 space-y-2">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Deploy to this VPS</p>
                {accountKeys.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No account keys yet. Add one below.</p>
                ) : (
                  <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-border/60 p-2">
                    {accountKeys.map((key) => (
                      <label
                        key={key.sshKeyId}
                        className="flex min-w-0 cursor-pointer items-start gap-2.5 rounded-md border border-border/40 bg-muted/20 p-2.5 hover:bg-muted/40"
                      >
                        <Checkbox
                          checked={draftKeyIds.includes(key.sshKeyId)}
                          onCheckedChange={(checked) => toggleDraftKey(key.sshKeyId, checked === true)}
                          className="mt-0.5 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold">{key.name}</p>
                          <p className="truncate font-mono text-[10px] text-muted-foreground">
                            {fingerprintPublicKey(key.publicKey)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                          disabled={deleteKeyMutation.isPending}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteKeyMutation.mutate({ sshKeyId: key.sshKeyId });
                          }}
                          title="Remove from account"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="min-w-0 space-y-3 rounded-lg border border-dashed border-border/60 p-3">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Add to account</p>
                <div className="space-y-2">
                  <Label htmlFor="ssh-key-name" className="text-xs">
                    Key name
                  </Label>
                  <Input
                    id="ssh-key-name"
                    placeholder="e.g. MacBook Pro"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full min-w-0"
                  />
                </div>
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="ssh-public-key" className="text-xs">
                    Public key
                  </Label>
                  <Textarea
                    id="ssh-public-key"
                    placeholder="ssh-ed25519 AAAA... comment"
                    value={newPublicKey}
                    onChange={(e) => setNewPublicKey(e.target.value)}
                    rows={4}
                    wrap="soft"
                    className="field-sizing-fixed max-w-full min-h-[5.5rem] w-full min-w-0 resize-y overflow-x-hidden font-mono text-[11px] leading-relaxed break-all [overflow-wrap:anywhere]"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full text-[10px] font-bold uppercase"
                  disabled={createKeyMutation.isPending}
                  onClick={handleAddKey}
                >
                  {createKeyMutation.isPending ? (
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Add to account
                </Button>
              </div>

              <div className="min-w-0 space-y-2 rounded-lg border border-primary/15 bg-primary/[0.03] p-3">
                <div className="flex items-start gap-2">
                  <Terminal className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0 space-y-1">
                    <p className="text-[10px] font-bold uppercase text-foreground">Install via terminal (recommended)</p>
                    <p className="text-[10px] leading-snug text-muted-foreground">
                      Provider API deploy often fails on existing VPS instances. Log in on the Terminal tab, paste this
                      script, and run it as root.
                    </p>
                  </div>
                </div>
                <Textarea
                  ref={installScriptRef}
                  readOnly
                  rows={6}
                  value={manualInstallScript || "# Select keys above to generate install commands"}
                  aria-label="SSH install script"
                  className="field-sizing-fixed max-h-28 min-h-0 w-full min-w-0 resize-none overflow-auto border-border/60 bg-zinc-950 font-mono text-[10px] leading-relaxed text-zinc-100 break-all [overflow-wrap:anywhere] focus-visible:ring-zinc-600"
                  onFocus={(e) => e.target.select()}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-[10px] font-bold uppercase"
                  disabled={!manualInstallScript}
                  onClick={() => void copyManualScript()}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Copy install script
                </Button>
              </div>
            </div>

            <DialogFooter className="shrink-0 flex-col gap-2 border-t bg-muted/20 px-5 py-4 sm:flex-col">
              <Button
                type="button"
                className="w-full text-[10px] font-bold uppercase"
                disabled={applyKeysMutation.isPending || !isPoweredOff || isPowerTransitioning}
                onClick={handleApplyKeys}
              >
                {applyKeysMutation.isPending ? (
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Shield className="mr-1.5 h-3.5 w-3.5" />
                )}
                Try API deploy ({draftKeyIds.length} key{draftKeyIds.length === 1 ? "" : "s"})
              </Button>
              <p className="text-center text-[9px] leading-relaxed text-muted-foreground">
                API deploy requires the VPS to be off. If it fails, use the terminal install script above.
              </p>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : deployedKeys.length > 0 ? (
        <div className="space-y-2">
          {deployedKeys.map((key) => (
            <div
              key={key.sshKeyId}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/20"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Key className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">{key.name}</p>
                <p className="text-[10px] font-mono text-muted-foreground truncate">
                  {key.publicKey ? fingerprintPublicKey(key.publicKey) : "Account key details unavailable"}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
          <Shield className="h-6 w-6 mb-2 text-muted-foreground/50" />
          <p className="text-[10px] font-bold uppercase text-muted-foreground">No keys on this instance</p>
          <p className="text-[9px] text-muted-foreground mt-1 max-w-xs leading-relaxed">
            Add a public key to your account, then deploy it while the VPS is powered off.
          </p>
        </div>
      )}
    </div>
  );
}
