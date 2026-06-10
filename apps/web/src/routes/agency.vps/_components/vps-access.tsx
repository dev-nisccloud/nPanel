"use client";

import * as React from "react";
import {
  Shield,
  Terminal,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  AlertTriangle,
  Info,
  Lock,
  Mail,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { useHivelocityTeamTrpcInput } from "./team-hivelocity-access-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { resolveClientErrorMessage } from "@/lib/public-error-message";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { VpsSshKeysSection } from "./vps-ssh-keys-section";

interface VpsAccessProps {
  deviceData: any;
  onTabChange?: (value: string) => void;
}

type ResetStep =
  | "idle"
  | "requesting"
  | "token-sent"
  | "finalizing"
  | "awaiting-password";

const PASSWORD_POLL_INTERVAL_MS = 10_000;
const PASSWORD_POLL_MAX_ATTEMPTS = 60;

/** Initial provisioning passwords are only returned by the upstream API for ~7 days. */
function formatPasswordPanelExpiry(passwordReturnsUntil: unknown): string | null {
  if (passwordReturnsUntil == null) return null;
  const n = Number(passwordReturnsUntil);
  if (!Number.isFinite(n) || n <= 0) return null;
  const ms = n > 1_000_000_000_000 ? n : n * 1000;
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return null;
  }
}

function CopyableShellCommand({
  command,
  copyLabel,
  onCopy,
}: {
  command: string;
  copyLabel: string;
  onCopy: (text: string, label: string) => void | Promise<void>;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 text-zinc-50 border border-white/10">
      <code className="text-[11px] opacity-80 overflow-x-auto whitespace-nowrap scrollbar-hide mr-4 font-mono">
        {command}
      </code>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-zinc-400 hover:text-zinc-50 hover:bg-white/10 shrink-0"
        onClick={() => void onCopy(command, copyLabel)}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function VpsAccess({ deviceData, onTabChange }: VpsAccessProps) {
  const utils = trpc.useUtils();
  const teamTrpc = useHivelocityTeamTrpcInput();
  const isCustomerPortal = Boolean(teamTrpc.teamSlug);

  const [showPassword, setShowPassword] = React.useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);
  const [resetStep, setResetStep] = React.useState<ResetStep>("idle");
  const [resetToken, setResetToken] = React.useState("");
  const [customerResetPhase, setCustomerResetPhase] = React.useState<
    "idle" | "submitted" | "timed_out"
  >("idle");

  const passwordBeforeResetRef = React.useRef<string | undefined>(undefined);
  const pollAbortRef = React.useRef(false);

  const credsQuery = trpc.hivelocity.getDeviceInitialCreds.useQuery({
    deviceId: deviceData.deviceId,
    ...teamTrpc,
  });
  const creds = (credsQuery.data?.data as any) || {};

  const sshUser = creds.user || "root";
  const sshPort = creds.port || 22;
  const sshHost = deviceData.primaryIp || "your-server-ip";
  const sshCommand = `ssh ${sshUser}@${sshHost} -p ${sshPort}`;
  const setPasswordCommand = "passwd";
  const passwordPanelExpiry = formatPasswordPanelExpiry(creds.passwordReturnsUntil);

  const pollForUpdatedPassword = React.useCallback(
    async (baselinePassword?: string) => {
      setResetStep("awaiting-password");
      pollAbortRef.current = false;

      for (let attempt = 0; attempt < PASSWORD_POLL_MAX_ATTEMPTS; attempt++) {
        if (pollAbortRef.current) return;

        await new Promise((resolve) => setTimeout(resolve, PASSWORD_POLL_INTERVAL_MS));

        try {
          const result = await utils.hivelocity.getDeviceInitialCreds.fetch({
            deviceId: deviceData.deviceId,
            ...teamTrpc,
          });
          const nextPassword = (result?.data as { password?: string } | undefined)?.password;
          if (nextPassword && nextPassword !== baselinePassword) {
            await credsQuery.refetch();
            setShowPassword(true);
            setResetStep("idle");
            setResetToken("");
            setCustomerResetPhase("idle");
            setIsResetDialogOpen(false);
            toast.success("Your new root password is ready below.");
            return;
          }
        } catch {
          // Provider may not expose the password until the reset task finishes.
        }
      }

      setResetStep("idle");
      if (isCustomerPortal) {
        setCustomerResetPhase("timed_out");
      }
    },
    [credsQuery, deviceData.deviceId, isCustomerPortal, teamTrpc, utils.hivelocity.getDeviceInitialCreds],
  );

  React.useEffect(() => {
    return () => {
      pollAbortRef.current = true;
    };
  }, []);

  const requestTokenMutation = trpc.hivelocity.vpsRequestResetPasswordToken.useMutation({
    onSuccess: (res) => {
      const data = res.data as { token?: string | null } | undefined;
      const apiToken = data?.token?.trim();

      if (isCustomerPortal) {
        setCustomerResetPhase("submitted");
        void pollForUpdatedPassword(passwordBeforeResetRef.current);
        return;
      }

      if (apiToken) {
        setResetToken(apiToken);
        toast.success("Verification token received. Review and finalize the reset.");
      } else {
        toast.success("Verification code sent to your provider account email.");
      }
      setResetStep("token-sent");
    },
    onError: (err) => {
      setResetStep("idle");
      toast.error(resolveClientErrorMessage(err, "Password reset request failed"));
    },
  });

  const finalizeResetMutation = trpc.hivelocity.vpsResetRootPassword.useMutation({
    onSuccess: () => {
      toast.success("Root password reset submitted. Fetching the new password…");
      setResetStep("finalizing");
      void pollForUpdatedPassword(passwordBeforeResetRef.current);
    },
    onError: (err) => {
      setResetStep("token-sent");
      toast.error(resolveClientErrorMessage(err, "Password reset failed"));
    },
  });

  const handleStartReset = () => {
    passwordBeforeResetRef.current = creds.password;
    setResetStep("requesting");
    requestTokenMutation.mutate({ deviceId: deviceData.deviceId, ...teamTrpc });
  };

  const handleFinalizeReset = () => {
    if (!resetToken.trim()) return;
    setResetStep("finalizing");
    finalizeResetMutation.mutate({
      deviceId: deviceData.deviceId,
      token: resetToken.trim(),
      ...teamTrpc,
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    if (!text.trim()) {
      toast.error(`Nothing to copy for ${label.toLowerCase()}.`);
      return;
    }

    const ok = await copyTextToClipboard(text);
    if (ok) {
      toast.success(`${label} copied to clipboard`);
    } else {
      toast.error(`Could not copy ${label.toLowerCase()}. Select the value and copy manually.`);
    }
  };

  const isPoweredOff = String((deviceData.powerStatus as any)?.status || deviceData.powerStatus).toLowerCase() === "off";

  const customerResetInProgress =
    isCustomerPortal &&
    (customerResetPhase === "submitted" || resetStep === "requesting" || resetStep === "awaiting-password");

  const resetInProgress =
    resetStep === "requesting" ||
    resetStep === "finalizing" ||
    resetStep === "awaiting-password" ||
    customerResetInProgress;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="gap-3 border-border/40 py-4 shadow-sm">
          <CardHeader className="bg-muted/30 px-6 pb-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" />
              Infrastructure Credentials
            </CardTitle>
            <CardDescription className="text-xs">
              Initial root password - set your own over SSH for long-term access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pt-0">
            <Alert className="border-amber-300/80 bg-amber-50 py-3 shadow-sm dark:border-amber-800/80 dark:bg-amber-950/40 [&>svg]:size-5 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-500">
              <AlertTriangle className="shrink-0" />
              <AlertTitle className="text-xs font-bold uppercase tracking-wide text-amber-900 dark:text-amber-300">
                Provisioning password expires from this panel
              </AlertTitle>
              <AlertDescription className="space-y-2 text-[11px] font-medium leading-snug text-amber-900/90 dark:text-amber-200/90">
                <p>
                  The root password below is only shown here for about 7 days after provisioning (or a reset). After
                  that it is hidden in this panel - not removed from your server.
                </p>
                <p>
                  SSH in and run <span className="rounded bg-amber-200/60 px-1 font-mono font-bold dark:bg-amber-900/50">passwd</span>{" "}
                  to set your own password. That credential stays on your VPS until you change it again.
                </p>
                {passwordPanelExpiry ? (
                  <p className="rounded-md border border-amber-300/60 bg-amber-100/80 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-950 dark:border-amber-700/60 dark:bg-amber-900/50 dark:text-amber-100">
                    Panel visibility ends: {passwordPanelExpiry}
                  </p>
                ) : null}
              </AlertDescription>
            </Alert>
            {!isCustomerPortal && resetInProgress ? (
              <Alert className="bg-primary/5 border-primary/20">
                <Clock className="h-4 w-4 text-primary" />
                <AlertTitle className="text-[10px] font-bold uppercase">Password reset in progress</AlertTitle>
                <AlertDescription className="text-[10px] font-medium leading-relaxed opacity-90">
                  Waiting for the new root password to be published. It will appear here automatically when ready.
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Username</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{creds.user || "root"}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => void copyToClipboard(creds.user || "root", "Username")}
                  >
                    <Copy className="h-3.5 w-3.5 opacity-60" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Password</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono tracking-tight">
                    {showPassword
                      ? creds.password || "Unavailable"
                      : creds.password
                        ? "•".repeat(creds.password.length)
                        : "••••••••••••"}
                    {!creds.password && !credsQuery.isLoading && (
                      <span className="text-[9px] font-sans font-bold text-muted-foreground ml-2 uppercase opacity-60 tracking-normal">
                        (Hidden from panel)
                      </span>
                    )}
                  </span>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => void copyToClipboard(creds.password || "", "Password")}
                      disabled={!creds.password}
                      title="Copy password"
                    >
                      <Copy className="h-3.5 w-3.5 opacity-60" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setShowPassword((prev) => !prev)}
                      disabled={!creds.password}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5 opacity-60" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 opacity-60" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">SSH Access Port</span>
                <span className="text-sm font-bold">{creds.port || 22}</span>
              </div>
            </div>

            {isCustomerPortal ? (
              <div className="space-y-3">
                {customerResetPhase === "submitted" ? (
                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-5 space-y-4">
                    <div className="flex flex-col items-center text-center">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                      <p className="text-sm font-bold text-foreground">Request received</p>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-sm">
                        We&apos;ll reset your root password for you. Your new password will be updated here in a few
                        minutes - usually within 10 minutes.
                      </p>
                    </div>
                    {customerResetInProgress ? (
                      <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase text-primary">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Checking for your new password…
                      </div>
                    ) : null}
                    <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                      You can keep this page open or come back shortly. The password field above will update
                      automatically when ready.
                    </p>
                  </div>
                ) : customerResetPhase === "timed_out" ? (
                  <Alert className="bg-amber-500/5 border-amber-500/20">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-[10px] font-bold uppercase">Still waiting on your new password?</AlertTitle>
                    <AlertDescription className="text-[10px] font-medium leading-relaxed opacity-90 space-y-2">
                      <p>
                        Your reset request was submitted, but the new password is not available yet. Refresh this page
                        in a few minutes - it may still be processing.
                      </p>
                      <p>
                        If it still hasn&apos;t updated, reach out to our support team or submit a ticket using the
                        help button at the bottom of the screen. We&apos;ll get back to you soon.
                      </p>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Alert variant="warning" className="bg-amber-500/5 border-amber-500/20">
                      <Info className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-[10px] font-bold uppercase">Before you request a reset</AlertTitle>
                      <AlertDescription className="text-[10px] font-medium leading-relaxed opacity-90">
                        Power off this VPS from the Overview tab first. Our team will complete the reset and your new
                        password will appear here when it is ready.
                      </AlertDescription>
                    </Alert>
                    <Button
                      variant="outline"
                      className="w-full h-11 gap-2 border-destructive/20 text-destructive font-bold text-[10px] uppercase hover:bg-destructive hover:text-white transition-all shadow-sm"
                      disabled={!isPoweredOff || requestTokenMutation.isPending}
                      onClick={handleStartReset}
                    >
                      {requestTokenMutation.isPending ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      Request root password reset
                    </Button>
                    {!isPoweredOff ? (
                      <p className="text-[9px] text-muted-foreground text-center font-medium">
                        Power off this VPS from the Overview tab before requesting a reset.
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            ) : (
              <Dialog
                open={isResetDialogOpen}
                onOpenChange={(open) => {
                  if (resetStep === "awaiting-password" || resetStep === "finalizing") return;
                  setIsResetDialogOpen(open);
                  if (!open) {
                    setResetStep("idle");
                    setResetToken("");
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-11 gap-2 border-destructive/20 text-destructive font-bold text-[10px] uppercase hover:bg-destructive hover:text-white transition-all shadow-sm"
                    disabled={resetInProgress}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reset root password
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-primary" />
                      Root credential recovery
                    </DialogTitle>
                    <DialogDescription>
                      Password reset is a two-step process. The verification code is emailed to your provider account -
                      it is not shown in this panel.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="py-6 space-y-6">
                    {resetStep === "idle" && (
                      <div className="space-y-4">
                        <Alert variant="warning" className="bg-amber-500/5 border-amber-500/20">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <AlertTitle className="text-[10px] font-bold uppercase">Before you start</AlertTitle>
                          <AlertDescription className="text-[10px] font-medium leading-relaxed opacity-90 space-y-1.5">
                            <p>1. Power off the VPS instance.</p>
                            <p>
                              2. Request a verification code - it is sent to the email on your infrastructure provider
                              account.
                            </p>
                            <p>
                              3. Paste that code here to finalize. The new password is then fetched automatically and
                              shown in Infrastructure Credentials (typically within 10 minutes).
                            </p>
                          </AlertDescription>
                        </Alert>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border">
                          <div
                            className={`h-2.5 w-2.5 rounded-full ${isPoweredOff ? "bg-emerald-500" : "bg-destructive animate-pulse"}`}
                          />
                          <span className="text-xs font-bold uppercase">
                            Current state: {isPoweredOff ? "Instance offline" : "Instance active (shutdown required)"}
                          </span>
                        </div>
                        <Button
                          onClick={handleStartReset}
                          disabled={!isPoweredOff || requestTokenMutation.isPending}
                          className="w-full h-12 font-bold text-[10px] uppercase"
                        >
                          {requestTokenMutation.isPending ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Mail className="h-4 w-4 mr-2" />
                          )}
                          Send verification code
                        </Button>
                      </div>
                    )}

                    {resetStep === "token-sent" && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex flex-col items-center justify-center text-center p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                          <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
                          <h4 className="text-sm font-bold uppercase">Check provider email</h4>
                          <p className="text-[10px] font-medium text-muted-foreground mt-1 leading-relaxed">
                            Open the inbox for your infrastructure provider account and copy the verification code from
                            the password reset email.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                            Verification code
                          </Label>
                          <Input
                            placeholder="Paste code from provider email"
                            value={resetToken}
                            onChange={(e) => setResetToken(e.target.value)}
                            className="h-12 font-bold text-center"
                          />
                        </div>

                        <Button
                          onClick={handleFinalizeReset}
                          disabled={!resetToken.trim() || finalizeResetMutation.isPending}
                          className="w-full h-12 font-bold text-[10px] uppercase bg-primary"
                        >
                          {finalizeResetMutation.isPending ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Shield className="h-4 w-4 mr-2" />
                          )}
                          Finalize reset
                        </Button>
                      </div>
                    )}

                    {(resetStep === "finalizing" || resetStep === "awaiting-password") && (
                      <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
                        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                        <p className="text-sm font-bold uppercase">Fetching new password</p>
                        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed max-w-xs">
                          The reset is being applied. The new root password will appear in Infrastructure Credentials
                          when ready.
                        </p>
                      </div>
                    )}
                  </div>

                  <DialogFooter className="bg-muted/30 -mx-6 -mb-6 p-6">
                    <p className="text-[9px] text-muted-foreground leading-relaxed font-medium">
                      The VPS must be powered off during reset. Existing SSH keys are preserved. The new password is
                      published after the reset task completes, usually within 10 minutes.
                    </p>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Terminal className="h-5 w-5 text-primary" />
                  Remote Command Interface
                </CardTitle>
                <CardDescription>Direct cryptographic terminal access</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Secure SSH payload</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Connect with the provisioning password (or an SSH key), then set your own password with the command
                  below.
                </p>
                <CopyableShellCommand command={sshCommand} copyLabel="SSH command" onCopy={copyToClipboard} />
              </div>

              <div className="space-y-2 rounded-xl border border-primary/15 bg-primary/[0.03] p-3">
                <p className="text-[10px] font-bold uppercase text-foreground">Set your own root password</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Run this at the shell prompt after SSH login. Enter the current root password when asked, then choose a
                  new one. Your new password stays on the server until you change it again.
                </p>
                <CopyableShellCommand command={setPasswordCommand} copyLabel="passwd command" onCopy={copyToClipboard} />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-primary/[0.03] border border-primary/10 space-y-4">
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase">Standard virtual terminal</p>
                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                  Integrated high-performance terminal. Manage your infrastructure with low latency without leaving the
                  control plane.
                </p>
              </div>
              <Button className="w-full h-10 gap-2 font-bold text-[10px] uppercase" onClick={() => onTabChange?.("terminal")}>
                <Terminal className="h-3.5 w-3.5" />
                Initialize SSH Session
              </Button>
            </div>

            <VpsSshKeysSection deviceId={deviceData.deviceId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
