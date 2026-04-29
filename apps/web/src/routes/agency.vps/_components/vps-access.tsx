"use client";

import * as React from "react";
import { Key, Shield, Terminal, Eye, EyeOff, Copy, RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VpsAccessProps {
  deviceData: any;
  onTabChange?: (value: string) => void;
}

export function VpsAccess({ deviceData, onTabChange }: VpsAccessProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const credsQuery = trpc.hivelocity.getDeviceInitialCreds.useQuery({ deviceId: deviceData.deviceId });
  const creds = (credsQuery.data?.data as any) || {};

  const resetPasswordMutation = trpc.hivelocity.vpsResetPassword.useMutation({
    onSuccess: () => {
      toast.success("Password reset triggered. Check your email or initial credentials.");
    },
    onError: (err) => {
      toast.error(`Failed to reset password: ${err.message}`);
    }
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" />
              Initial Credentials
            </CardTitle>
            <CardDescription>Generated at provisioning time (expires after 7 days)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                   <span className="text-sm text-muted-foreground">Username</span>
                   <div className="flex items-center gap-2">
                      <span className="font-semibold">{creds.user || "root"}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(creds.user || "root", "Username")}>
                        <Copy className="h-3 w-3" />
                      </Button>
                   </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                   <span className="text-sm text-muted-foreground">Password</span>
                   <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">
                        {showPassword ? (creds.password || "Unavailable") : "••••••••"} 
                        {!creds.password && !credsQuery.isLoading && <span className="text-[10px] text-muted-foreground ml-2">(Expired)</span>}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={!creds.password}
                      >
                         {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                   </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                   <span className="text-sm text-muted-foreground">SSH Port</span>
                   <span className="font-semibold">{creds.port || 22}</span>
                </div>
             </div>
             <Button 
               variant="outline" 
               className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50"
               onClick={() => resetPasswordMutation.mutate({ deviceId: deviceData.deviceId })}
               disabled={resetPasswordMutation.isPending}
             >
                <RefreshCw className={`h-4 w-4 ${resetPasswordMutation.isPending ? 'animate-spin' : ''}`} />
                Reset Root Password
             </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Terminal className="h-5 w-5 text-primary" />
                  Remote Access
                </CardTitle>
                <CardDescription>Direct machine control</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-3">
                <p className="text-sm font-semibold">SSH Connection Command</p>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-zinc-950 text-zinc-50 group relative">
                   <code className="text-xs font-mono">
                     ssh {creds.user || "root"}@{deviceData.primaryIp} -p {creds.port || 22}
                   </code>
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="h-8 w-8 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800"
                     onClick={() => copyToClipboard(`ssh ${creds.user || "root"}@${deviceData.primaryIp} -p ${creds.port || 22}`, "SSH command")}
                   >
                     <Copy className="h-4 w-4" />
                   </Button>
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                   * Use the password from the credentials card to log in.
                </p>
             </div>

             <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Remote Terminal Access</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    We've integrated a high-performance, secure terminal directly into nPanel. 
                    Use it to manage your instance without leaving the dashboard.
                  </p>
                </div>
                <Button 
                  className="w-full gap-2" 
                  onClick={() => onTabChange?.('terminal')}
                >
                   <Terminal className="h-4 w-4" />
                   Go to SSH Terminal
                </Button>
             </div>

             <div className="space-y-3">
                <div className="flex items-center justify-between">
                   <p className="text-sm font-semibold">Public SSH Keys</p>
                   <Button variant="ghost" size="sm" className="h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      Add Key
                   </Button>
                </div>
                <div className="p-4 rounded-lg border border-dashed text-center">
                   <p className="text-xs text-muted-foreground">No SSH keys assigned to this instance</p>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
