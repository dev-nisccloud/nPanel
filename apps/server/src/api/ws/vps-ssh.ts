import { Context } from "hono";
import { Client } from "ssh2";
import { auth } from "@npanel/auth";
import { hivelocityRequest } from "@npanel/api/lib/hivelocity-client";
import { getRedisClient } from "@npanel/api/lib/redis";
import type { WSEvents } from "hono/ws";

// A map to store SSH clients associated with a WebSocket connection
// We use a WeakMap or store it on the WS object if possible, but hono/ws doesn't expose the underlying socket easily in onMessage.
// Actually, we can just use closure variables inside the upgradeWebSocket handler because it returns an object of event handlers.

export function handleVpsSshUpgrade(c: Context): WSEvents {
  let sshClient: Client | null = null;
  let sshStream: any = null;
  let deviceIdStr: string | null = null;
  
  // Helper to ensure the WS message is sent before the connection is forcefully closed by Bun
  const closeWithError = (ws: any, code: string, message: string) => {
    ws.send(JSON.stringify({ type: "error", code, message }));
    setTimeout(() => {
      try { ws.close(); } catch (e) {}
    }, 200);
  };
  
  return {
    onMessage: async (event, ws) => {
      try {
        const data = typeof event.data === "string" ? event.data : new TextDecoder().decode(event.data as ArrayBuffer);
        const payload = JSON.parse(data);

        if (payload.type === "init") {
          // 1. Authenticate user using the ticket
          let userId: string | null = null;
          if (payload.ticket) {
            const redis = getRedisClient();
            if (redis) {
              // Retry loop for potential Redis replication delay across regions
              for (let i = 0; i < 6; i++) {
                userId = await redis.get(`ws-ticket:${payload.ticket}`);
                if (userId) break;
                // Wait 150ms before retrying (max ~900ms)
                await new Promise(r => setTimeout(r, 150));
              }

              if (userId) {
                // Invalidate the ticket immediately after use
                await redis.del(`ws-ticket:${payload.ticket}`);
              }
            }
          }

          if (!userId) {
            closeWithError(ws, "UNAUTHORIZED", "Unauthorized");
            return;
          }

          deviceIdStr = payload.deviceId;
          if (!deviceIdStr) {
            closeWithError(ws, "INVALID_INPUT", "Missing deviceId");
            return;
          }

          // 2. Determine SSH Credentials
          const deviceId = parseInt(deviceIdStr, 10);
          let sshPassword = payload.password;
          let hostIp = payload.hostIp;

          // If no password provided, try to fetch the initial password from Hivelocity
          if (!sshPassword) {
            try {
              const credsRes = await hivelocityRequest<any>(`/device/${deviceId}/initial-password`, { requireApiKey: true });
              if (credsRes && credsRes.password) {
                sshPassword = credsRes.password;
              } else {
                closeWithError(ws, "NO_INITIAL_CREDENTIALS", "No initial password found. Please provide it manually.");
                return;
              }
            } catch (err) {
              console.error("Failed to fetch initial password:", err);
              closeWithError(ws, "AUTH_FAILED", "Failed to fetch initial password");
              return;
            }
          }

          // If hostIp isn't provided, fetch device details to get it
          if (!hostIp) {
            try {
              // Try VPS first
              let deviceDetails = await hivelocityRequest<any>(`/vps/${deviceId}`, { requireApiKey: true }).catch(() => null);
              if (!deviceDetails) {
                 deviceDetails = await hivelocityRequest<any>(`/device/${deviceId}`, { requireApiKey: true });
              }
              hostIp = deviceDetails?.primaryIp;
              
              if (!hostIp) {
                closeWithError(ws, "INVALID_INPUT", "Could not determine host IP");
                return;
              }
            } catch (err) {
               console.error("Failed to fetch device details:", err);
               closeWithError(ws, "INVALID_INPUT", "Failed to fetch device details");
               return;
            }
          }

          // 3. Connect via SSH
          sshClient = new Client();

          sshClient.on("ready", () => {
            sshClient!.shell({ term: 'xterm-256color' }, (err, stream) => {
              if (err) {
                console.error("SSH Shell error:", err);
                closeWithError(ws, "SHELL_ERROR", "Failed to start SSH shell");
                return;
              }
              
              sshStream = stream;
              ws.send(JSON.stringify({ type: "connected" }));

              stream.on("data", (d: any) => {
                ws.send(JSON.stringify({ type: "data", data: d.toString("utf-8") }));
              }).on("close", () => {
                ws.close();
              });
            });
          });

          sshClient.on("error", (err: any) => {
            console.error("SSH Connection Error:", err);
            // Detect auth failure
            if (err.level === "client-authentication") {
              closeWithError(ws, "AUTH_FAILED", "Authentication failed. Password might have been changed.");
            } else {
              closeWithError(ws, "CONNECTION_ERROR", err.message || "Failed to connect to SSH");
            }
          });

          // Connect
          try {
            sshClient.connect({
              host: hostIp,
              port: 22,
              username: "root", // Hivelocity initial user is usually root
              password: sshPassword,
              readyTimeout: 15000,
            });
          } catch (e: any) {
            console.error("SSH Connect exception:", e);
            closeWithError(ws, "CONNECTION_ERROR", e.message || "Failed to connect");
          }

        } else if (payload.type === "data" && sshStream) {
          sshStream.write(payload.data);
        } else if (payload.type === "resize" && sshStream) {
          sshStream.setWindow(payload.rows, payload.cols, 0, 0);
        }
      } catch (err) {
        console.error("WS message error:", err);
      }
    },
    onClose: () => {
      if (sshStream) {
        sshStream.end();
      }
      if (sshClient) {
        sshClient.end();
      }
    },
    onError: (err) => {
      console.error("WS error:", err);
      if (sshClient) sshClient.end();
    }
  };
}
