"use client";

import * as React from "react";
import {
  Terminal as TerminalIcon,
  Maximize2,
  Minimize2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Monitor,
  Key,
  LogOut
} from "lucide-react";
import { toast } from "sonner";
import { Terminal } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import "xterm/css/xterm.css";

import { env } from "@npanel/env/web";
import { trpc } from "@/utils/trpc";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VpsTerminalProps {
  deviceData: any;
}

type ConnectionState = "disconnected" | "connecting" | "connected" | "auth_failed";

export function VpsTerminal({ deviceData }: VpsTerminalProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [connState, setConnState] = React.useState<ConnectionState>("disconnected");
  const [password, setPassword] = React.useState("");
  
  const terminalRef = React.useRef<HTMLDivElement>(null);
  const termInstance = React.useRef<Terminal | null>(null);
  const fitAddonRef = React.useRef<FitAddon | null>(null);
  const wsRef = React.useRef<WebSocket | null>(null);
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);
  const { mutateAsync: getWsTicket } = trpc.hivelocity.getWsTicket.useMutation();

  const connect = async (usePassword?: string) => {
    if (connState === "connected" || connState === "connecting") return;
    
    setConnState("connecting");

    // Fetch auth ticket first
    let ticket = "";
    try {
      const res = await getWsTicket();
      ticket = res.ticket;
    } catch (err) {
      console.error("Failed to get WS ticket:", err);
      toast.error("Authentication failed. Please check your login session.");
      setConnState("disconnected");
      return;
    }

    // Build WS URL
    let wsUrl = "";
    if (import.meta.env.DEV) {
      wsUrl = window.location.origin.replace(/^http/, "ws") + '/api/ws/vps-ssh';
    } else {
      wsUrl = env.VITE_SERVER_URL.replace(/^http/, "ws");
      if (!wsUrl.endsWith('/')) wsUrl += '/';
      wsUrl += 'api/ws/vps-ssh';
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Send initial auth and params
      ws.send(
        JSON.stringify({
          type: "init",
          deviceId: deviceData.deviceId || deviceData.id,
          hostIp: deviceData.primaryIp,
          password: usePassword || undefined,
          ticket: ticket
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "connected") {
          setConnState("connected");
          initTerminal();
        } else if (msg.type === "data" && termInstance.current) {
          termInstance.current.write(msg.data);
        } else if (msg.type === "error") {
          if (msg.code === "AUTH_FAILED" || msg.code === "NO_INITIAL_CREDENTIALS") {
            setConnState("auth_failed");
            toast.error(msg.message);
          } else {
            setConnState("disconnected");
            toast.error(msg.message || "Connection error");
          }
        }
      } catch (err) {
        console.error("WS message parse error", err);
      }
    };

    ws.onerror = (e) => {
      console.error("WS Error", e);
      // Wait for onclose to handle state
    };

    ws.onclose = () => {
      if (wsRef.current === ws) {
        wsRef.current = null;
        setConnState((prev) => (prev === "auth_failed" ? prev : "disconnected"));
        cleanupTerminal();
      }
    };
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnState("disconnected");
    cleanupTerminal();
  };

  const initTerminal = () => {
    if (!terminalRef.current) return;
    cleanupTerminal();

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      theme: {
        background: "#000000",
        foreground: "#ffffff",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    term.onData((data) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "data", data }));
      }
    });

    term.onResize((size) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "resize", cols: size.cols, rows: size.rows }));
      }
    });

    termInstance.current = term;
    fitAddonRef.current = fitAddon;

    // Observe container size changes
    const observer = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch (e) {
        // Ignore errors during layout recalculation
      }
    });
    observer.observe(terminalRef.current);
    resizeObserverRef.current = observer;
  };

  const cleanupTerminal = () => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
    if (termInstance.current) {
      termInstance.current.dispose();
      termInstance.current = null;
    }
    if (fitAddonRef.current) {
      fitAddonRef.current = null;
    }
    if (terminalRef.current) {
      terminalRef.current.innerHTML = '';
    }
  };

  React.useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // Effect to re-fit terminal when fullscreen toggles
  React.useEffect(() => {
    if (connState === "connected" && fitAddonRef.current) {
      // Slight delay to allow DOM to layout after CSS class change
      setTimeout(() => fitAddonRef.current?.fit(), 50);
    }
  }, [isFullscreen, connState]);


  return (
    <div className={`space-y-6 ${isFullscreen ? "fixed inset-0 z-[100] bg-background p-6" : ""}`}>
      {connState === "disconnected" && (
        <Card className="border-dashed border-2 flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
            <Monitor className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl font-bold mb-2">Native SSH Console</CardTitle>
          <p className="text-muted-foreground max-w-md mb-8">
            Access your VPS directly via nPanel's native secure SSH terminal.
          </p>
          <Button
            size="lg"
            className="gap-2 px-8"
            onClick={() => connect()}
          >
            <TerminalIcon className="h-4 w-4" />
            Launch Secure Console
          </Button>
          <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-green-500" />
              End-to-End Encryption
            </div>
          </div>
        </Card>
      )}

      {connState === "auth_failed" && (
        <Card className="border-dashed border-2 flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-6 text-orange-500">
            <Key className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl font-bold mb-2">Authentication Required</CardTitle>
          <p className="text-muted-foreground max-w-md mb-8">
            The initial server password is no longer valid or could not be found. 
            Please enter the current SSH password for <strong>root</strong> to connect.
          </p>
          <div className="flex flex-col gap-4 w-full max-w-sm">
            <Input 
              type="password" 
              placeholder="Root Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && password) connect(password);
              }}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConnState("disconnected")}>
                Cancel
              </Button>
              <Button 
                className="flex-1 gap-2" 
                onClick={() => connect(password)}
                disabled={!password}
              >
                <TerminalIcon className="h-4 w-4" />
                Connect
              </Button>
            </div>
          </div>
        </Card>
      )}

      {(connState === "connected" || connState === "connecting") && (
        <Card className={`overflow-hidden border-2 border-zinc-800 bg-[#09090b] ${isFullscreen ? "h-full flex flex-col" : ""}`}>
          <CardHeader className="border-b border-zinc-800 bg-zinc-900/50 py-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TerminalIcon className="h-5 w-5 text-zinc-400" />
                <div>
                  <CardTitle className="text-sm font-bold text-zinc-100">
                    {isFullscreen ? `SSH Console - ${deviceData.primaryIp}` : "Native SSH Session"}
                  </CardTitle>
                  {!isFullscreen && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] h-4 border-zinc-700 text-zinc-400">
                        {deviceData.primaryIp}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${connState === 'connected' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                          {connState === 'connected' ? 'Live Session' : 'Connecting...'}
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
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-zinc-800"
                  onClick={disconnect}
                  title="Terminate Session"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className={`p-0 bg-black relative ${isFullscreen ? "flex-1 overflow-hidden" : "h-[600px] overflow-hidden"}`}>
            {connState === "connecting" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
                <p className="text-zinc-400 text-sm animate-pulse">Establishing SSH connection...</p>
              </div>
            )}
            <div ref={terminalRef} className="w-full h-full p-2" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
