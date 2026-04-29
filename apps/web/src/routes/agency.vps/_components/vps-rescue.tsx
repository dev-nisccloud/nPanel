"use client";

import * as React from "react";
import { Disc, ShieldAlert, Upload, XCircle, Info, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface VpsRescueProps {
  deviceId: number;
}

export function VpsRescue({ deviceId }: VpsRescueProps) {
  const attachMutation = trpc.hivelocity.vpsAttachIso.useMutation({
    onSuccess: () => toast.success("ISO attachment triggered successfully"),
    onError: (err) => toast.error(`Failed to attach ISO: ${err.message}`)
  });

  const detachMutation = trpc.hivelocity.vpsDetachIso.useMutation({
    onSuccess: () => toast.success("ISO detached successfully"),
    onError: (err) => toast.error(`Failed to detach ISO: ${err.message}`)
  });

  const reloadMutation = trpc.hivelocity.reloadDevice.useMutation({
    onSuccess: () => toast.success("OS reload initiated successfully. This may take a few minutes."),
    onError: (err) => toast.error(`Failed to initiate reload: ${err.message}`)
  });

  const isoOptions = [
    { id: "ubuntu-22.04", name: "Ubuntu 22.04 LTS", description: "Standard Linux recovery environment" },
    { id: "systemrescue", name: "SystemRescue", description: "Specialized recovery tools for disk and boot repair" },
    { id: "gparted", name: "GParted Live", description: "Partition management and disk resizing tools" },
  ];

  return (
    <div className="space-y-6">
      <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
        <ShieldAlert className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-400">Rescue Mode Warning</AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-500">
          Mounting an ISO or performing an OS reload will impact your current installation. Ensure you have backups before proceeding.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Disc className="h-5 w-5 text-primary" />
              Mount Recovery ISO
            </CardTitle>
            <CardDescription>Select an image to boot your instance from</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-1 gap-3">
                {isoOptions.map((iso) => (
                   <div key={iso.id} className="flex items-center justify-between p-4 rounded-lg border bg-background hover:bg-muted/30 transition-colors">
                      <div className="space-y-1">
                         <p className="text-sm font-bold">{iso.name}</p>
                         <p className="text-xs text-muted-foreground">{iso.description}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8"
                        onClick={() => attachMutation.mutate({ deviceId, isoId: iso.id })}
                        disabled={attachMutation.isPending}
                      >
                         <Upload className="h-3 w-3 mr-1" />
                         Mount
                      </Button>
                   </div>
                ))}
             </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <RefreshCw className="h-5 w-5 text-destructive" />
              Factory Reset / OS Reload
            </CardTitle>
            <CardDescription>Completely wipe and reinstall the operating system</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
             <div className="p-3 rounded-full bg-red-50 dark:bg-red-900/20 mb-4">
                <ShieldAlert className="h-8 w-8 text-red-600" />
             </div>
             <p className="text-sm font-bold text-destructive">Wipe & Reinstall OS</p>
             <p className="text-xs text-muted-foreground mt-1 mb-6 max-w-[250px]">
                This will permanently delete all data on the primary disk and reinstall the OS.
             </p>
             
             <Button 
               variant="destructive" 
               size="sm" 
               className="gap-2"
               onClick={() => {
                 if (confirm("Are you ABSOLUTELY sure you want to wipe this server and reinstall the OS? All data will be lost.")) {
                   reloadMutation.mutate({ deviceId });
                 }
               }}
               disabled={reloadMutation.isPending}
             >
                <RefreshCw className={`h-4 w-4 ${reloadMutation.isPending ? 'animate-spin' : ''}`} />
                Initiate Full Reload
             </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
           <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-5 w-5 text-muted-foreground" />
              Active Media & Recovery Tools
           </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center border-t">
           <div className="p-3 rounded-full bg-muted mb-4">
              <Disc className="h-8 w-8 text-muted-foreground opacity-20" />
           </div>
           <p className="text-sm font-medium">Primary Boot Active</p>
           <p className="text-xs text-muted-foreground mt-1 mb-6">Your instance is currently set to boot from the primary disk.</p>
           
           <Button 
             variant="outline" 
             size="sm" 
             className="gap-2 text-muted-foreground"
             onClick={() => detachMutation.mutate({ deviceId })}
             disabled={detachMutation.isPending}
           >
              <XCircle className="h-4 w-4" />
              Detach All Mounted ISOs
           </Button>
        </CardContent>
      </Card>
    </div>
  );
}
