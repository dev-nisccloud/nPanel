"use client";

import * as React from "react";
import {
  Terminal as TerminalIcon,
  Maximize2,
  Minimize2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Monitor
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface VpsTerminalProps {
  deviceData: any;
}

export function VpsTerminal({ deviceData }: VpsTerminalProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [consoleUrl, setConsoleUrl] = React.useState<string | null>(null);
  const [isIframeLoaded, setIsIframeLoaded] = React.useState(false);

  const consoleMutation = trpc.hivelocity.vpsGetConsoleUrl.useMutation({
    onSuccess: (data: any) => {
      if (data.data?.url) {
        setConsoleUrl(data.data.url);
        setIsIframeLoaded(false);
      } else {
        toast.error("Console URL not found in response");
      }
    },
    onError: (err) => {
      toast.error(`Failed to launch console: ${err.message}`);
    }
  });

  const handleConnect = () => {
    consoleMutation.mutate({ deviceId: deviceData.deviceId });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`space-y-6 ${isFullscreen ? "fixed inset-0 z-[100] bg-background p-6" : ""}`}>
      {!consoleUrl && (
        <Card className="border-dashed border-2 flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
            <Monitor className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl font-bold mb-2">Native Remote Console</CardTitle>
          <p className="text-muted-foreground max-w-md mb-8">
            Access your VPS directly via nPanel's secure remote management console.
            No SSH configuration required on your local machine.
          </p>
          <Button
            size="lg"
            className="gap-2 px-8"
            onClick={handleConnect}
            disabled={consoleMutation.isPending}
          >
            {consoleMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <TerminalIcon className="h-4 w-4" />}
            {consoleMutation.isPending ? "Requesting Access..." : "Launch Secure Console"}
          </Button>
          <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-green-500" />
              Encrypted Session
            </div>
            <div className="flex items-center gap-1">
              <Monitor className="h-3 w-3 text-blue-500" />
              No Agent Required
            </div>
          </div>
        </Card>
      )}

      {consoleUrl && (
        <Card className={`overflow-hidden border-2 border-zinc-800 bg-[#09090b] ${isFullscreen ? "h-full flex flex-col" : ""}`}>
          <CardHeader className="border-b border-zinc-800 bg-zinc-900/50 py-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TerminalIcon className="h-5 w-5 text-zinc-400" />
                <div>
                  <CardTitle className="text-sm font-bold text-zinc-100">
                    {isFullscreen ? `Remote Console - ${deviceData.primaryIp}` : "Native Console Session"}
                  </CardTitle>
                  {!isFullscreen && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] h-4 border-zinc-700 text-zinc-400">
                        {deviceData.primaryIp}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                          Live Session
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                  onClick={() => window.open(consoleUrl, "_blank")}
                  title="Open in new window"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-zinc-800"
                  onClick={() => setConsoleUrl(null)}
                  title="Terminate Session"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className={`p-0 bg-black relative ${isFullscreen ? "flex-1 overflow-hidden" : "h-[600px]"}`}>
            {!isIframeLoaded && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
                <p className="text-zinc-400 text-sm animate-pulse">Establishing secure connection...</p>
              </div>
            )}
            <iframe
              src={consoleUrl}
              className="w-full h-full border-0"
              onLoad={() => setIsIframeLoaded(true)}
              allow="fullscreen"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
