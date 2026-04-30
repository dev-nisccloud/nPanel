"use client";

import * as React from "react";
import { 
  Key, 
  Shield, 
  Terminal, 
  Eye, 
  EyeOff, 
  Copy, 
  RefreshCw, 
  Plus, 
  AlertTriangle, 
  Info,
  Lock,
  Mail,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { format } from "date-fns";

interface VpsAccessProps {
  deviceData: any;
  onTabChange?: (value: string) => void;
}

export function VpsAccess({ deviceData, onTabChange }: VpsAccessProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);
  const [resetStep, setResetStep] = React.useState<'idle' | 'requesting' | 'token-sent' | 'finalizing'>('idle');
  const [resetToken, setResetToken] = React.useState("");

  const credsQuery = trpc.hivelocity.getDeviceInitialCreds.useQuery({ deviceId: deviceData.deviceId });
  const creds = (credsQuery.data?.data as any) || {};

  const requestTokenMutation = trpc.hivelocity.vpsRequestResetPasswordToken.useMutation({
    onSuccess: () => {
      setResetStep('token-sent');
      toast.success("Security token dispatched to account email");
    },
    onError: (err) => {
      setResetStep('idle');
      toast.error(`Request failed: ${err.message}`);
    }
  });

  const finalizeResetMutation = trpc.hivelocity.vpsResetRootPassword.useMutation({
    onSuccess: () => {
      toast.success("Root password reset initiated. The instance will be updated shortly.");
      setIsResetDialogOpen(false);
      setResetStep('idle');
      setResetToken("");
    },
    onError: (err) => {
      toast.error(`Reset failed: ${err.message}`);
    }
  });

  const handleStartReset = () => {
    setResetStep('requesting');
    requestTokenMutation.mutate({ deviceId: deviceData.deviceId });
  };

  const handleFinalizeReset = () => {
    if (!resetToken.trim()) return;
    finalizeResetMutation.mutate({ 
      deviceId: deviceData.deviceId,
      token: resetToken.trim()
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const isPoweredOff = String((deviceData.powerStatus as any)?.status || deviceData.powerStatus).toLowerCase() === 'off';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" />
              Infrastructure Credentials
            </CardTitle>
            <CardDescription>Initial provisioning credentials (system-managed)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
             <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20">
                   <span className="text-[10px] font-bold uppercase text-muted-foreground">Username</span>
                   <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{creds.user || "root"}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(creds.user || "root", "Username")}>
                        <Copy className="h-3.5 w-3.5 opacity-60" />
                      </Button>
                   </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20">
                   <span className="text-[10px] font-bold uppercase text-muted-foreground">Password</span>
                   <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">
                        {showPassword ? (creds.password || "Unavailable") : "••••••••••••"} 
                        {!creds.password && !credsQuery.isLoading && <span className="text-[9px] font-bold text-muted-foreground ml-2 uppercase opacity-60">(Expired)</span>}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7" 
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={!creds.password}
                      >
                         {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                   </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20">
                   <span className="text-[10px] font-bold uppercase text-muted-foreground">SSH Access Port</span>
                   <span className="text-sm font-bold">{creds.port || 22}</span>
                </div>
             </div>

             <Dialog open={isResetDialogOpen} onOpenChange={(open) => {
               setIsResetDialogOpen(open);
               if (!open) {
                 setResetStep('idle');
                 setResetToken("");
               }
             }}>
               <DialogTrigger asChild>
                 <Button 
                   variant="outline"                    
                   className="w-full h-11 gap-2 border-destructive/20 text-destructive font-bold text-[10px] uppercase hover:bg-destructive hover:text-white transition-all shadow-sm"
                  >
                     <RefreshCw className="h-3.5 w-3.5" />
                     Reset Root Password
                 </Button>
               </DialogTrigger>
               <DialogContent className="sm:max-w-[450px]">
                 <DialogHeader>
                   <DialogTitle className="flex items-center gap-2">
                     <Lock className="h-5 w-5 text-primary" />
                     Root Credential Recovery
                   </DialogTitle>
                   <DialogDescription>
                     Securely recover access to your instance. This process is audited and requires manual confirmation.
                   </DialogDescription>
                 </DialogHeader>

                 <div className="py-6 space-y-6">
                   {resetStep === 'idle' && (
                     <div className="space-y-4">
                       <Alert variant="warning" className="bg-amber-500/5 border-amber-500/20">
                         <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <AlertTitle className="text-[10px] font-bold uppercase">Requirement Checklist</AlertTitle>
                          <AlertDescription className="text-[10px] font-medium leading-relaxed opacity-80">
                            1. Instance must be powered off<br />
                            2. You must have access to the account email address
                          </AlertDescription>
                       </Alert>
                       <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border">
                         <div className={`h-2.5 w-2.5 rounded-full ${isPoweredOff ? 'bg-emerald-500' : 'bg-destructive animate-pulse'}`} />
                          <span className="text-xs font-bold uppercase">
                            Current state: {isPoweredOff ? 'Instance offline' : 'Instance active (Shutdown required)'}
                          </span>
                       </div>
                       <Button 
                         onClick={handleStartReset}                          
                         disabled={!isPoweredOff || requestTokenMutation.isPending}
                          className="w-full h-12 font-bold text-[10px] uppercase"
                        >
                          {requestTokenMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                          Dispatch security token
                       </Button>
                     </div>
                   )}

                   {resetStep === 'token-sent' && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                       <div className="flex flex-col items-center justify-center text-center p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                         <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
                          <h4 className="text-sm font-bold uppercase">Token dispatched</h4>
                          <p className="text-[10px] font-medium text-muted-foreground mt-1">Please check your administrative email inbox for the reset code.</p>
                       </div>
                       
                       <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Verification token</Label>
                          <Input 
                             placeholder="Enter security token" 
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
                          {finalizeResetMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                          Finalize credential reset
                       </Button>
                     </div>
                   )}
                 </div>

                 <DialogFooter className="bg-muted/30 -mx-6 -mb-6 p-6">
                    <p className="text-[9px] text-muted-foreground leading-relaxed font-medium">
                      * Resetting the root password will result in a mandatory reboot of the instance if it is not already offline. 
                      Existing SSH keys will be preserved.
                    </p>
                 </DialogFooter>
               </DialogContent>
             </Dialog>
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
             <div className="space-y-3">
                 <p className="text-[10px] font-bold uppercase text-muted-foreground">Secure SSH Payload</p>
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 text-zinc-50 border border-white/10 group relative">
                    <code className="text-[11px] opacity-80 overflow-x-auto whitespace-nowrap scrollbar-hide mr-4">
                      ssh {creds.user || "root"}@{deviceData.primaryIp} -p {creds.port || 22}
                    </code>
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="h-8 w-8 text-zinc-400 hover:text-zinc-50 hover:bg-white/10 shrink-0"
                     onClick={() => copyToClipboard(`ssh ${creds.user || "root"}@${deviceData.primaryIp} -p ${creds.port || 22}`, "SSH command")}
                   >
                     <Copy className="h-3.5 w-3.5" />
                   </Button>
                </div>
                <div className="flex items-center gap-2 px-1">
                   <Info className="h-3 w-3 text-muted-foreground" />
                    <p className="text-[9px] text-muted-foreground font-bold">
                       Authentication requires system or manually injected SSH keys.
                    </p>
                </div>
             </div>

             <div className="p-5 rounded-2xl bg-primary/[0.03] border border-primary/10 space-y-4">
                <div className="space-y-1.5">
                   <p className="text-xs font-bold uppercase">Standard virtual terminal</p>
                  <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                    Integrated high-performance terminal. Manage your infrastructure with low latency without leaving the control plane.
                  </p>
                </div>
                 <Button 
                   className="w-full h-10 gap-2 font-bold text-[10px] uppercase" 
                  onClick={() => onTabChange?.('terminal')}
                >
                   <Terminal className="h-3.5 w-3.5" />
                   Initialize SSH Session
                </Button>
             </div>

             <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Authorized SSH Keys</p>
                    <Button variant="ghost" size="sm" className="h-7 text-[9px] font-bold uppercase opacity-60 hover:opacity-100">
                      <Plus className="h-3 w-3 mr-1" />
                      Inject Key
                   </Button>
                </div>
                <div className="p-6 rounded-xl border border-dashed flex flex-col items-center justify-center opacity-40">
                   <Shield className="h-6 w-6 mb-2 opacity-40" />
                    <p className="text-[10px] font-bold uppercase">Vault empty</p>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
